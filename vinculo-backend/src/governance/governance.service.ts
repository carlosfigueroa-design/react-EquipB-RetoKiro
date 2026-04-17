import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GovernanceService {
  constructor(private prisma: PrismaService) {}

  async listVersions(apiName?: string) {
    const where: any = {};
    if (apiName) where.apiName = apiName;

    return this.prisma.apiVersion.findMany({
      where,
      orderBy: [{ apiName: 'asc' }, { publishedAt: 'desc' }],
    });
  }

  async publishVersion(data: { apiName: string; version: string; changelog?: string }) {
    const existing = await this.prisma.apiVersion.findUnique({
      where: { apiName_version: { apiName: data.apiName, version: data.version } },
    });
    if (existing) throw new ConflictException(`Versión ${data.version} ya existe para ${data.apiName}`);

    return this.prisma.apiVersion.create({
      data: {
        apiName: data.apiName,
        version: data.version,
        changelog: data.changelog,
        status: 'ACTIVE',
      },
    });
  }

  async deprecateVersion(apiName: string, version: string, sunsetDate: string, notice?: string) {
    const v = await this.prisma.apiVersion.findUnique({
      where: { apiName_version: { apiName, version } },
    });
    if (!v) throw new NotFoundException(`Versión ${version} no encontrada para ${apiName}`);

    return this.prisma.apiVersion.update({
      where: { apiName_version: { apiName, version } },
      data: {
        status: 'DEPRECATED',
        deprecatedAt: new Date(),
        sunsetAt: new Date(sunsetDate),
        sunsetNotice: notice || `Esta versión será retirada el ${sunsetDate}. Migre a la versión más reciente.`,
      },
    });
  }

  async sunsetVersion(apiName: string, version: string) {
    const v = await this.prisma.apiVersion.findUnique({
      where: { apiName_version: { apiName, version } },
    });
    if (!v) throw new NotFoundException(`Versión ${version} no encontrada para ${apiName}`);

    return this.prisma.apiVersion.update({
      where: { apiName_version: { apiName, version } },
      data: { status: 'SUNSET' },
    });
  }

  async getTimeline() {
    const versions = await this.prisma.apiVersion.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    return {
      active: versions.filter((v) => v.status === 'ACTIVE'),
      deprecated: versions.filter((v) => v.status === 'DEPRECATED'),
      sunset: versions.filter((v) => v.status === 'SUNSET'),
    };
  }
}
