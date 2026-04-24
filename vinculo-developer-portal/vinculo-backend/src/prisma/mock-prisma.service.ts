import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * In-memory mock of PrismaService for local development without PostgreSQL.
 * Simulates the Prisma Client API for User and RefreshToken models.
 */

interface MockUser {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user?: MockUser;
}

@Injectable()
export class MockPrismaService implements OnModuleInit {
  private readonly logger = new Logger('MockPrismaService');
  private users: MockUser[] = [];
  private refreshTokens: MockRefreshToken[] = [];

  async onModuleInit(): Promise<void> {
    this.logger.warn('⚠️  Using IN-MEMORY mock database (no PostgreSQL)');
    this.seedData();
  }

  private seedData(): void {
    this.users.push({
      id: crypto.randomUUID(),
      email: 'admin@segurosbolivar.com',
      name: 'Administrador VÍNCULO',
      company: 'Seguros Bolívar',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.logger.log('Seeded admin user: admin@segurosbolivar.com');
  }

  // Simulate Prisma's nested model access
  get user() {
    return {
      findUnique: async (args: { where: { email?: string; id?: string } }) => {
        const { email, id } = args.where;
        return this.users.find(
          (u) => (email && u.email === email) || (id && u.id === id),
        ) || null;
      },
      create: async (args: { data: Partial<MockUser> }) => {
        const newUser: MockUser = {
          id: crypto.randomUUID(),
          email: args.data.email || '',
          name: args.data.name || null,
          company: args.data.company || null,
          role: args.data.role || 'EXTERNO',
          status: args.data.status || 'ACTIVE',
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.users.push(newUser);
        this.logger.log(`Created mock user: ${newUser.email} (${newUser.role})`);
        return newUser;
      },
      update: async (args: { where: { id: string }; data: Partial<MockUser> }) => {
        const user = this.users.find((u) => u.id === args.where.id);
        if (user) {
          Object.assign(user, args.data, { updatedAt: new Date() });
        }
        return user;
      },
      findMany: async () => this.users,
    };
  }

  get refreshToken() {
    return {
      create: async (args: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => {
        const token: MockRefreshToken = {
          id: crypto.randomUUID(),
          tokenHash: args.data.tokenHash,
          userId: args.data.userId,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
        };
        this.refreshTokens.push(token);
        return token;
      },
      findUnique: async (args: { where: { tokenHash: string }; include?: { user: boolean } }) => {
        const token = this.refreshTokens.find((t) => t.tokenHash === args.where.tokenHash);
        if (!token) return null;
        if (args.include?.user) {
          const user = this.users.find((u) => u.id === token.userId);
          return { ...token, user };
        }
        return token;
      },
      delete: async (args: { where: { id: string } }) => {
        const idx = this.refreshTokens.findIndex((t) => t.id === args.where.id);
        if (idx >= 0) this.refreshTokens.splice(idx, 1);
        return {};
      },
      deleteMany: async (args: { where: { userId: string } }) => {
        const before = this.refreshTokens.length;
        this.refreshTokens = this.refreshTokens.filter((t) => t.userId !== args.where.userId);
        return { count: before - this.refreshTokens.length };
      },
    };
  }

  // Prisma lifecycle methods (no-op for mock)
  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}
}
