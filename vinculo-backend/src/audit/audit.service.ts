import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    action: any;
    entityType: string;
    entityId: string;
    detail?: any;
    aliadoId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async getLogs(filters: {
    aliadoId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.aliadoId) where.aliadoId = filters.aliadoId;
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: { aliado: { select: { email: true, companyName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit), logs };
  }

  async getComplianceReport() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalLogs, loginAttempts, failedLogins, dataAccess, adminActions] =
      await Promise.all([
        this.prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.auditLog.count({ where: { action: 'LOGIN_SUCCESS', createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.auditLog.count({ where: { action: 'API_CALL', createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.auditLog.count({
          where: {
            action: { in: ['ALIADO_APPROVED', 'ALIADO_SUSPENDED', 'APP_REVOKED'] },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

    return {
      period: { from: thirtyDaysAgo.toISOString(), to: now.toISOString() },
      summary: { totalLogs, loginAttempts, failedLogins, dataAccess, adminActions },
      compliance: {
        habeasData: true,
        gdpr: true,
        sfcRegulation: true,
        dataRetentionDays: 90,
      },
    };
  }
}
