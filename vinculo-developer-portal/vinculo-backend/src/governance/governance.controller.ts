import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GovernanceService } from './governance.service';
import { DeprecateApiDto } from './dto/deprecate-api.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Controller for the Governance module.
 * Exposes lifecycle management endpoints: publish, deprecate, sunset, reactivate,
 * timeline, and global status panel.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
@ApiTags('governance')
@Controller('governance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class GovernanceController {
  constructor(
    private readonly governanceService: GovernanceService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Lifecycle actions (ADMIN only) ──────────────────────

  @Post('apis/:id/publish')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar API (DRAFT → ACTIVE)',
    description:
      'Transiciona una API del estado DRAFT a ACTIVE. Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'API publicada exitosamente' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async publish(@Param('id') id: string) {
    return this.governanceService.publish(id);
  }

  @Post('apis/:id/deprecate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deprecar API (ACTIVE → DEPRECATED)',
    description:
      'Transiciona una API del estado ACTIVE a DEPRECATED con ventana de migración configurable (30/60/90 días). ' +
      'Notifica automáticamente a todos los aliados consumidores. Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'API deprecada exitosamente' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida o datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async deprecate(
    @Param('id') id: string,
    @Body() dto: DeprecateApiDto,
  ) {
    return this.governanceService.deprecate(id, dto);
  }

  @Post('apis/:id/sunset')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sunset de API (DEPRECATED → SUNSET)',
    description:
      'Transiciona una API del estado DEPRECATED a SUNSET. Desactiva la API del catálogo y notifica a los aliados. ' +
      'Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'API marcada como sunset exitosamente' })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async sunset(@Param('id') id: string) {
    return this.governanceService.sunset(id);
  }

  @Post('apis/:id/reactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivar API deprecada (DEPRECATED → ACTIVE)',
    description:
      'Reactivar una API deprecada antes de que alcance la fecha de sunset. ' +
      'Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'API reactivada exitosamente' })
  @ApiResponse({ status: 400, description: 'Transición inválida o fecha de sunset ya pasada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async reactivate(@Param('id') id: string) {
    return this.governanceService.reactivate(id);
  }

  // ─── Read endpoints (LIDER_TECNICO+ access) ─────────────

  @Get('apis/:id/timeline')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Timeline de cambios de una API',
    description:
      'Retorna el timeline de cambios de ciclo de vida de una API, incluyendo fechas de deprecación y sunset. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Timeline de cambios de la API' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async getTimeline(@Param('id') id: string) {
    const api = await this.prisma.api.findUnique({ where: { id } });

    if (!api) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    // Build timeline from API lifecycle dates
    const timeline: Array<{
      event: string;
      date: string;
      state: string;
      details?: string;
    }> = [];

    timeline.push({
      event: 'API_CREATED',
      date: api.createdAt.toISOString(),
      state: 'DRAFT',
      details: `API "${api.name}" creada`,
    });

    if (
      api.lifecycleState === 'ACTIVE' ||
      api.lifecycleState === 'DEPRECATED' ||
      api.lifecycleState === 'SUNSET'
    ) {
      timeline.push({
        event: 'API_PUBLISHED',
        date: api.updatedAt.toISOString(),
        state: 'ACTIVE',
        details: `API "${api.name}" publicada`,
      });
    }

    if (api.deprecatedAt) {
      timeline.push({
        event: 'API_DEPRECATED',
        date: api.deprecatedAt.toISOString(),
        state: 'DEPRECATED',
        details:
          `API "${api.name}" deprecada con ventana de migración ${api.migrationWindow ?? 'N/A'}`,
      });
    }

    if (api.sunsetAt && api.lifecycleState === 'SUNSET') {
      timeline.push({
        event: 'API_SUNSET',
        date: api.sunsetAt.toISOString(),
        state: 'SUNSET',
        details: `API "${api.name}" alcanzó sunset`,
      });
    }

    return {
      apiId: api.id,
      apiName: api.name,
      currentState: api.lifecycleState,
      timeline,
    };
  }

  @Get('status')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Panel de estado global de APIs',
    description:
      'Retorna el estado global de todas las APIs con versión, estado de ciclo de vida y SLA. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Panel de estado global con versión, estado y SLA por API',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  async getStatus() {
    const apis = await this.prisma.api.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        product: true,
        process: true,
        currentVersion: true,
        lifecycleState: true,
        slaUptime: true,
        deprecatedAt: true,
        sunsetAt: true,
        migrationWindow: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const summary = {
      total: apis.length,
      byState: {
        DRAFT: apis.filter((a) => a.lifecycleState === 'DRAFT').length,
        ACTIVE: apis.filter((a) => a.lifecycleState === 'ACTIVE').length,
        DEPRECATED: apis.filter((a) => a.lifecycleState === 'DEPRECATED').length,
        SUNSET: apis.filter((a) => a.lifecycleState === 'SUNSET').length,
      },
    };

    return {
      summary,
      apis: apis.map((api) => ({
        id: api.id,
        name: api.name,
        slug: api.slug,
        product: api.product,
        process: api.process,
        version: api.currentVersion,
        state: api.lifecycleState,
        slaUptime: api.slaUptime,
        deprecatedAt: api.deprecatedAt?.toISOString() ?? null,
        sunsetAt: api.sunsetAt?.toISOString() ?? null,
        migrationWindow: api.migrationWindow ?? null,
        lastUpdated: api.updatedAt.toISOString(),
      })),
    };
  }
}
