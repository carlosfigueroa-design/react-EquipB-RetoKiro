import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listAliados(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const aliados = await this.prisma.aliado.findMany({
      where,
      include: { apps: { select: { id: true, name: true, status: true, sandbox: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: aliados.length,
      aliados: aliados.map((a) => ({
        id: a.id,
        email: a.email,
        companyName: a.companyName,
        nit: a.nit,
        type: a.type,
        status: a.status,
        contactName: a.contactName,
        appsCount: a.apps.length,
        createdAt: a.createdAt,
      })),
    };
  }

  async approveAliado(id: string) {
    const aliado = await this.prisma.aliado.findUnique({ where: { id } });
    if (!aliado) throw new NotFoundException('Aliado no encontrado');

    const updated = await this.prisma.aliado.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.logAudit('ALIADO_APPROVED', 'Aliado', id, { previousStatus: aliado.status });

    return { id: updated.id, status: updated.status, message: 'Aliado aprobado exitosamente' };
  }

  async suspendAliado(id: string, reason?: string) {
    const aliado = await this.prisma.aliado.findUnique({ where: { id } });
    if (!aliado) throw new NotFoundException('Aliado no encontrado');

    const updated = await this.prisma.aliado.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    await this.logAudit('ALIADO_SUSPENDED', 'Aliado', id, { reason, previousStatus: aliado.status });

    return { id: updated.id, status: updated.status, message: 'Aliado suspendido' };
  }

  async reactivateAliado(id: string) {
    const aliado = await this.prisma.aliado.findUnique({ where: { id } });
    if (!aliado) throw new NotFoundException('Aliado no encontrado');

    const updated = await this.prisma.aliado.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.logAudit('ALIADO_REACTIVATED', 'Aliado', id, { previousStatus: aliado.status });

    return { id: updated.id, status: updated.status, message: 'Aliado reactivado' };
  }

  async revokeApp(aliadoId: string, appId: string) {
    const app = await this.prisma.app.findFirst({ where: { id: appId, aliadoId } });
    if (!app) throw new NotFoundException('App no encontrada');

    const updated = await this.prisma.app.update({
      where: { id: appId },
      data: { status: 'REVOKED' },
    });

    await this.logAudit('APP_REVOKED', 'App', appId, { aliadoId });

    return { id: updated.id, status: updated.status, message: 'App revocada' };
  }

  async getDashboard() {
    const [totalAliados, pending, active, suspended, totalApps, totalCalls] =
      await Promise.all([
        this.prisma.aliado.count(),
        this.prisma.aliado.count({ where: { status: 'PENDING' } }),
        this.prisma.aliado.count({ where: { status: 'ACTIVE' } }),
        this.prisma.aliado.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.app.count(),
        this.prisma.apiCall.count(),
      ]);

    return {
      aliados: { total: totalAliados, pending, active, suspended },
      apps: { total: totalApps },
      apiCalls: { total: totalCalls },
    };
  }

  private async logAudit(action: any, entityType: string, entityId: string, detail?: any) {
    await this.prisma.auditLog.create({
      data: { action, entityType, entityId, detail },
    });
  }
}
