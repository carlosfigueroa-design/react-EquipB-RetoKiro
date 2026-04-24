import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { AuditActionDto } from '../audit/dto/create-audit-log.dto';

/**
 * UsersService — Manages users, roles, and status with audit logging.
 *
 * Provides:
 * - `findAll(filters)`: List users with role, status, and last access date
 * - `findById(id)`: User detail
 * - `changeRole(id, newRole, adminId)`: Change user role with audit log
 * - `changeStatus(id, newStatus, adminId)`: Activate/deactivate user with audit log
 *
 * Requirements: 11.1, 11.2, 11.3
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  /** Default page size for cursor-based pagination */
  static readonly DEFAULT_PAGE_SIZE = 20;

  /** Maximum page size */
  static readonly MAX_PAGE_SIZE = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List users with optional filters: role, status, search (name/email).
   * Supports cursor-based pagination.
   *
   * Requirement 11.1: List users with role, status, and last access date.
   */
  async findAll(filters: UserFilterDto) {
    const take = Math.min(
      filters.take ?? UsersService.DEFAULT_PAGE_SIZE,
      UsersService.MAX_PAGE_SIZE,
    );

    const where: Record<string, unknown> = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const paginationArgs: Record<string, unknown> = {
      take: take + 1,
      orderBy: { createdAt: 'desc' as const },
      where,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    };

    if (filters.cursor) {
      paginationArgs.cursor = { id: filters.cursor };
      paginationArgs.skip = 1;
    }

    const records = await this.prisma.user.findMany(
      paginationArgs as Parameters<typeof this.prisma.user.findMany>[0],
    );

    const hasNextPage = records.length > take;
    const data = hasNextPage ? records.slice(0, take) : records;
    const nextCursor = hasNextPage ? data[data.length - 1]?.id : null;

    return {
      data,
      pagination: {
        hasNextPage,
        nextCursor,
        count: data.length,
      },
    };
  }

  /**
   * Get user detail by ID.
   *
   * Requirement 11.1: View user detail including role, status, last access.
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    return user;
  }

  /**
   * Change a user's role and log the action to audit.
   *
   * Requirement 11.2: Allow ADMIN to change user roles.
   * Requirement 11.3: Log role changes to audit with admin ID, affected user, and timestamp.
   */
  async changeRole(id: string, newRole: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    const previousRole = user.role;

    if (previousRole === newRole) {
      throw new BadRequestException(
        `El usuario ya tiene el rol ${newRole}`,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: newRole as any },
    });

    // Log to audit
    await this.auditService.log({
      userId: adminId,
      action: AuditActionDto.USER_ROLE_CHANGED,
      resource: 'User',
      resourceId: id,
      metadata: {
        previousRole,
        newRole,
        affectedUserId: id,
        affectedUserEmail: user.email,
        timestamp: new Date().toISOString(),
      },
      ipAddress: '0.0.0.0', // Will be overridden by interceptor in real requests
    });

    this.logger.log(
      `[AUDIT] USER_ROLE_CHANGED: admin=${adminId}, user=${id}, ` +
        `${previousRole} → ${newRole}`,
    );

    return updated;
  }

  /**
   * Change a user's status (activate/deactivate) and log the action to audit.
   *
   * Requirement 11.2: Allow ADMIN to activate/deactivate users.
   * Requirement 11.3: Log status changes to audit with admin ID, affected user, and timestamp.
   */
  async changeStatus(id: string, newStatus: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    const previousStatus = user.status;

    if (previousStatus === newStatus) {
      throw new BadRequestException(
        `El usuario ya tiene el estado ${newStatus}`,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus as any },
    });

    // Log to audit
    await this.auditService.log({
      userId: adminId,
      action: AuditActionDto.USER_STATUS_CHANGED,
      resource: 'User',
      resourceId: id,
      metadata: {
        previousStatus,
        newStatus,
        affectedUserId: id,
        affectedUserEmail: user.email,
        timestamp: new Date().toISOString(),
      },
      ipAddress: '0.0.0.0', // Will be overridden by interceptor in real requests
    });

    this.logger.log(
      `[AUDIT] USER_STATUS_CHANGED: admin=${adminId}, user=${id}, ` +
        `${previousStatus} → ${newStatus}`,
    );

    return updated;
  }
}
