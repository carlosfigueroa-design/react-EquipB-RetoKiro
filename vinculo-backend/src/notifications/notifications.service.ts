import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getForAliado(aliadoId: string) {
    const [personal, global] = await Promise.all([
      this.prisma.notification.findMany({
        where: { aliadoId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.findMany({
        where: { global: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const all = [...personal, ...global]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    return {
      unreadCount: all.filter((n) => !n.read).length,
      notifications: all,
    };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(aliadoId: string) {
    await this.prisma.notification.updateMany({
      where: { aliadoId, read: false },
      data: { read: true },
    });
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  async createGlobal(type: any, title: string, message: string) {
    return this.prisma.notification.create({
      data: { type, title, message, global: true },
    });
  }

  async createForAliado(aliadoId: string, type: any, title: string, message: string) {
    return this.prisma.notification.create({
      data: { type, title, message, aliadoId },
    });
  }
}
