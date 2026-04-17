import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppsService {
  constructor(private prisma: PrismaService) {}

  async listApps(aliadoId: string) {
    return this.prisma.app.findMany({
      where: { aliadoId },
      select: {
        id: true,
        name: true,
        clientId: true,
        status: true,
        sandbox: true,
        createdAt: true,
      },
    });
  }

  async createApp(aliadoId: string, name: string) {
    return this.prisma.app.create({
      data: {
        name,
        clientSecret: uuidv4(),
        aliadoId,
        sandbox: true,
      },
    });
  }

  async rotateSecret(aliadoId: string, appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, aliadoId },
    });
    if (!app) throw new NotFoundException('App no encontrada');

    return this.prisma.app.update({
      where: { id: appId },
      data: { clientSecret: uuidv4() },
    });
  }
}
