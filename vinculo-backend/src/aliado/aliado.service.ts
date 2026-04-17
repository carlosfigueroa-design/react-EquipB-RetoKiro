import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAliadoDto } from './dto/register-aliado.dto';

@Injectable()
export class AliadoService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterAliadoDto) {
    const existing = await this.prisma.aliado.findFirst({
      where: { OR: [{ email: dto.email }, { nit: dto.nit }] },
    });

    if (existing) {
      throw new ConflictException('Ya existe un aliado con ese email o NIT');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const aliado = await this.prisma.aliado.create({
      data: {
        email: dto.email,
        passwordHash,
        companyName: dto.companyName,
        nit: dto.nit,
        type: dto.type as any,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        status: 'ACTIVE',
        apps: {
          create: {
            name: `${dto.companyName} - Sandbox`,
            clientSecret: uuidv4(),
            sandbox: true,
          },
        },
      },
      include: { apps: true },
    });

    return {
      id: aliado.id,
      email: aliado.email,
      companyName: aliado.companyName,
      type: aliado.type,
      status: aliado.status,
      sandbox: {
        appId: aliado.apps[0].id,
        clientId: aliado.apps[0].clientId,
        clientSecret: aliado.apps[0].clientSecret,
      },
      message: '¡Bienvenido a VÍNCULO! Tu sandbox está listo.',
    };
  }

  async findById(id: string) {
    return this.prisma.aliado.findUnique({
      where: { id },
      include: { apps: true },
    });
  }

  async getQuotas(aliadoId: string) {
    const callCount = await this.prisma.apiCall.count({
      where: { aliadoId },
    });

    return {
      aliadoId,
      plan: 'sandbox',
      limits: {
        requestsPerMonth: 10000,
        requestsPerSecond: 50,
        sandboxApps: 3,
      },
      usage: {
        requestsThisMonth: callCount,
      },
    };
  }

  async getMetrics(aliadoId: string) {
    const calls = await this.prisma.apiCall.findMany({
      where: { aliadoId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const totalCalls = calls.length;
    const successCalls = calls.filter((c) => c.statusCode < 400).length;
    const latencies = calls.map((c) => c.latencyMs).sort((a, b) => a - b);

    return {
      aliadoId,
      totalCalls,
      successRate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
      latency: {
        p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
        p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
        p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
      },
      topEndpoints: this.groupByEndpoint(calls),
    };
  }

  private groupByEndpoint(calls: any[]) {
    const map = new Map<string, number>();
    calls.forEach((c) => {
      const key = `${c.method} ${c.endpoint}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
