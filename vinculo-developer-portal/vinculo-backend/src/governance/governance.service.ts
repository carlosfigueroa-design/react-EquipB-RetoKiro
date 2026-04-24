import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeprecateApiDto, MigrationWindowDto } from './dto/deprecate-api.dto';
import { MIGRATION_WINDOWS } from '../common/constants';

/**
 * Valid lifecycle state transitions for the API state machine.
 *
 * DRAFT → ACTIVE (publish)
 * ACTIVE → DEPRECATED (deprecate, with migration window)
 * DEPRECATED → SUNSET (sunset, when migration window expires)
 * DEPRECATED → ACTIVE (reactivate, only before sunset date)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['DEPRECATED'],
  DEPRECATED: ['SUNSET', 'ACTIVE'],
};

/**
 * GovernanceService — Manages the API lifecycle state machine.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.5, 13.1, 13.5
 */
@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate that a state transition is allowed by the state machine.
   * Throws BadRequestException for invalid transitions.
   *
   * Requirement 13.1: Manage lifecycle through ACTIVE → DEPRECATED → SUNSET.
   */
  validateTransition(currentState: string, targetState: string): void {
    const allowed = VALID_TRANSITIONS[currentState];

    if (!allowed || !allowed.includes(targetState)) {
      throw new BadRequestException(
        `Transición inválida: no se puede pasar de ${currentState} a ${targetState}. ` +
          `Transiciones permitidas desde ${currentState}: ${allowed?.join(', ') ?? 'ninguna'}`,
      );
    }
  }

  /**
   * Publish an API: transition DRAFT → ACTIVE.
   * Logs the action to audit (console placeholder until AuditService is implemented in task 6).
   *
   * Requirement 13.1: Manage lifecycle states.
   */
  async publish(apiId: string) {
    const api = await this.findApiOrFail(apiId);

    this.validateTransition(api.lifecycleState, 'ACTIVE');

    const updated = await this.prisma.api.update({
      where: { id: apiId },
      data: { lifecycleState: 'ACTIVE' },
    });

    // Audit log — console placeholder until AuditService is implemented (task 6)
    this.logger.log(
      `[AUDIT] API_PUBLISHED: id=${apiId}, name="${api.name}", transition=DRAFT→ACTIVE`,
    );

    return updated;
  }

  /**
   * Deprecate an API: transition ACTIVE → DEPRECATED.
   * Configures migration window, calculates sunset date, and notifies consumers.
   *
   * Requirement 8.1: Show DEPRECATED banner from the indicated date.
   * Requirement 8.2: Send notification to all active consumers.
   * Requirement 8.3: Configurable migration window (30/60/90 days).
   */
  async deprecate(apiId: string, dto: DeprecateApiDto) {
    const api = await this.findApiOrFail(apiId);

    this.validateTransition(api.lifecycleState, 'DEPRECATED');

    const deprecatedAt = new Date();
    const windowDays = MIGRATION_WINDOWS[dto.migrationWindow];
    const sunsetAt = new Date(deprecatedAt);
    sunsetAt.setDate(sunsetAt.getDate() + windowDays);

    const updated = await this.prisma.api.update({
      where: { id: apiId },
      data: {
        lifecycleState: 'DEPRECATED',
        deprecatedAt,
        sunsetAt,
        migrationWindow: dto.migrationWindow,
      },
    });

    // Find all consumers of this API and notify them
    const consumptions = await this.prisma.apiConsumption.findMany({
      where: { apiId },
      select: { userId: true },
    });

    // Create a notification for each consumer
    for (const consumption of consumptions) {
      await this.prisma.notification.create({
        data: {
          userId: consumption.userId,
          type: 'API_DEPRECATED',
          title: `API "${api.name}" ha sido deprecada`,
          message:
            `La API "${api.name}" ha sido marcada como DEPRECATED. ` +
            `Tiene hasta el ${sunsetAt.toISOString().split('T')[0]} ` +
            `(${windowDays} días) para migrar a una alternativa.`,
          metadata: {
            apiId,
            apiName: api.name,
            deprecatedAt: deprecatedAt.toISOString(),
            sunsetAt: sunsetAt.toISOString(),
            migrationWindow: dto.migrationWindow,
          },
        },
      });
    }

    // Audit log — console placeholder until AuditService is implemented (task 6)
    this.logger.log(
      `[AUDIT] API_DEPRECATED: id=${apiId}, name="${api.name}", ` +
        `transition=ACTIVE→DEPRECATED, migrationWindow=${dto.migrationWindow}, ` +
        `sunsetAt=${sunsetAt.toISOString()}, consumersNotified=${consumptions.length}`,
    );

    return updated;
  }

  /**
   * Sunset an API: transition DEPRECATED → SUNSET.
   * Deactivates the API from the catalog and notifies consumers.
   *
   * Requirement 13.5: Deactivate API from catalog and notify affected consumers.
   */
  async sunset(apiId: string) {
    const api = await this.findApiOrFail(apiId);

    this.validateTransition(api.lifecycleState, 'SUNSET');

    const updated = await this.prisma.api.update({
      where: { id: apiId },
      data: {
        lifecycleState: 'SUNSET',
        sunsetAt: new Date(),
      },
    });

    // Find all consumers and notify them about the sunset
    const consumptions = await this.prisma.apiConsumption.findMany({
      where: { apiId },
      select: { userId: true },
    });

    for (const consumption of consumptions) {
      await this.prisma.notification.create({
        data: {
          userId: consumption.userId,
          type: 'API_SUNSET',
          title: `API "${api.name}" ha alcanzado sunset`,
          message:
            `La API "${api.name}" ha sido desactivada del catálogo. ` +
            `Por favor migre a una API alternativa lo antes posible.`,
          metadata: {
            apiId,
            apiName: api.name,
            sunsetAt: new Date().toISOString(),
          },
        },
      });
    }

    // Audit log — console placeholder until AuditService is implemented (task 6)
    this.logger.log(
      `[AUDIT] API_SUNSET: id=${apiId}, name="${api.name}", ` +
        `transition=DEPRECATED→SUNSET, consumersNotified=${consumptions.length}`,
    );

    return updated;
  }

  /**
   * Reactivate a deprecated API: transition DEPRECATED → ACTIVE.
   * Only allowed before the sunset date.
   *
   * Requirement 8.5: Deprecated API remains accessible before sunset date.
   */
  async reactivate(apiId: string) {
    const api = await this.findApiOrFail(apiId);

    this.validateTransition(api.lifecycleState, 'ACTIVE');

    // Verify that the sunset date has not passed
    if (api.sunsetAt && api.sunsetAt <= new Date()) {
      throw new BadRequestException(
        `No se puede reactivar la API "${api.name}": la fecha de sunset ` +
          `(${api.sunsetAt.toISOString().split('T')[0]}) ya ha pasado.`,
      );
    }

    const updated = await this.prisma.api.update({
      where: { id: apiId },
      data: {
        lifecycleState: 'ACTIVE',
        deprecatedAt: null,
        sunsetAt: null,
        migrationWindow: null,
      },
    });

    // Audit log — console placeholder until AuditService is implemented (task 6)
    this.logger.log(
      `[AUDIT] API_REACTIVATED: id=${apiId}, name="${api.name}", transition=DEPRECATED→ACTIVE`,
    );

    return updated;
  }

  /**
   * Find an API by ID or throw NotFoundException.
   */
  private async findApiOrFail(apiId: string) {
    const api = await this.prisma.api.findUnique({ where: { id: apiId } });

    if (!api) {
      throw new NotFoundException(`API con ID "${apiId}" no encontrada`);
    }

    return api;
  }
}
