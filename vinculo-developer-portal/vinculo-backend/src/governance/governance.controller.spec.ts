import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../auth/jwt.service';

describe('GovernanceController', () => {
  let controller: GovernanceController;
  let governanceService: jest.Mocked<GovernanceService>;
  let prisma: {
    api: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const mockApi = {
    id: 'api-1',
    name: 'Cotización Auto',
    slug: 'cotizacion-auto',
    description: 'API de cotización de seguros de auto',
    product: 'AUTO',
    process: 'COTIZACION',
    currentVersion: '1.0.0',
    lifecycleState: 'DRAFT',
    slaUptime: 99.9,
    deprecatedAt: null,
    sunsetAt: null,
    migrationWindow: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const mockGovernanceService = {
      publish: jest.fn(),
      deprecate: jest.fn(),
      sunset: jest.fn(),
      reactivate: jest.fn(),
      validateTransition: jest.fn(),
    };

    const mockPrisma = {
      api: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockJwtService = {
      verifyToken: jest.fn(),
      signToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [
        { provide: GovernanceService, useValue: mockGovernanceService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        Reflector,
      ],
    }).compile();

    controller = module.get<GovernanceController>(GovernanceController);
    governanceService = module.get(GovernanceService) as jest.Mocked<GovernanceService>;
    prisma = module.get(PrismaService) as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── POST /governance/apis/:id/publish ──────────────────

  describe('publish', () => {
    it('should call governanceService.publish and return the updated API', async () => {
      const published = { ...mockApi, lifecycleState: 'ACTIVE' };
      governanceService.publish.mockResolvedValue(published as any);

      const result = await controller.publish('api-1');

      expect(governanceService.publish).toHaveBeenCalledWith('api-1');
      expect(result).toEqual(published);
    });

    it('should propagate NotFoundException when API does not exist', async () => {
      governanceService.publish.mockRejectedValue(
        new NotFoundException('API con ID "nonexistent" no encontrada'),
      );

      await expect(controller.publish('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate BadRequestException for invalid transition', async () => {
      governanceService.publish.mockRejectedValue(
        new BadRequestException(
          'Transición inválida: no se puede pasar de ACTIVE a ACTIVE',
        ),
      );

      await expect(controller.publish('api-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── POST /governance/apis/:id/deprecate ────────────────

  describe('deprecate', () => {
    it('should call governanceService.deprecate with dto and return the updated API', async () => {
      const deprecated = {
        ...mockApi,
        lifecycleState: 'DEPRECATED',
        deprecatedAt: new Date(),
        sunsetAt: new Date(),
        migrationWindow: 'DAYS_30',
      };
      governanceService.deprecate.mockResolvedValue(deprecated as any);

      const dto = { migrationWindow: 'DAYS_30' as any };
      const result = await controller.deprecate('api-1', dto);

      expect(governanceService.deprecate).toHaveBeenCalledWith('api-1', dto);
      expect(result).toEqual(deprecated);
    });

    it('should propagate NotFoundException when API does not exist', async () => {
      governanceService.deprecate.mockRejectedValue(
        new NotFoundException('API con ID "nonexistent" no encontrada'),
      );

      await expect(
        controller.deprecate('nonexistent', { migrationWindow: 'DAYS_60' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException for invalid transition', async () => {
      governanceService.deprecate.mockRejectedValue(
        new BadRequestException(
          'Transición inválida: no se puede pasar de DRAFT a DEPRECATED',
        ),
      );

      await expect(
        controller.deprecate('api-1', { migrationWindow: 'DAYS_30' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /governance/apis/:id/sunset ───────────────────

  describe('sunset', () => {
    it('should call governanceService.sunset and return the updated API', async () => {
      const sunsetApi = {
        ...mockApi,
        lifecycleState: 'SUNSET',
        sunsetAt: new Date(),
      };
      governanceService.sunset.mockResolvedValue(sunsetApi as any);

      const result = await controller.sunset('api-1');

      expect(governanceService.sunset).toHaveBeenCalledWith('api-1');
      expect(result).toEqual(sunsetApi);
    });

    it('should propagate NotFoundException when API does not exist', async () => {
      governanceService.sunset.mockRejectedValue(
        new NotFoundException('API con ID "nonexistent" no encontrada'),
      );

      await expect(controller.sunset('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate BadRequestException for invalid transition', async () => {
      governanceService.sunset.mockRejectedValue(
        new BadRequestException(
          'Transición inválida: no se puede pasar de ACTIVE a SUNSET',
        ),
      );

      await expect(controller.sunset('api-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── POST /governance/apis/:id/reactivate ───────────────

  describe('reactivate', () => {
    it('should call governanceService.reactivate and return the updated API', async () => {
      const reactivated = {
        ...mockApi,
        lifecycleState: 'ACTIVE',
        deprecatedAt: null,
        sunsetAt: null,
        migrationWindow: null,
      };
      governanceService.reactivate.mockResolvedValue(reactivated as any);

      const result = await controller.reactivate('api-1');

      expect(governanceService.reactivate).toHaveBeenCalledWith('api-1');
      expect(result).toEqual(reactivated);
    });

    it('should propagate BadRequestException when sunset date has passed', async () => {
      governanceService.reactivate.mockRejectedValue(
        new BadRequestException(
          'No se puede reactivar la API: la fecha de sunset ya ha pasado.',
        ),
      );

      await expect(controller.reactivate('api-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── GET /governance/apis/:id/timeline ──────────────────

  describe('getTimeline', () => {
    it('should return timeline for a DRAFT API', async () => {
      prisma.api.findUnique.mockResolvedValue({ ...mockApi });

      const result = await controller.getTimeline('api-1');

      expect(prisma.api.findUnique).toHaveBeenCalledWith({
        where: { id: 'api-1' },
      });
      expect(result.apiId).toBe('api-1');
      expect(result.apiName).toBe('Cotización Auto');
      expect(result.currentState).toBe('DRAFT');
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].event).toBe('API_CREATED');
    });

    it('should return timeline with publish event for ACTIVE API', async () => {
      prisma.api.findUnique.mockResolvedValue({
        ...mockApi,
        lifecycleState: 'ACTIVE',
      });

      const result = await controller.getTimeline('api-1');

      expect(result.currentState).toBe('ACTIVE');
      expect(result.timeline).toHaveLength(2);
      expect(result.timeline[0].event).toBe('API_CREATED');
      expect(result.timeline[1].event).toBe('API_PUBLISHED');
    });

    it('should return timeline with deprecation event for DEPRECATED API', async () => {
      const deprecatedAt = new Date('2024-06-01T00:00:00Z');
      prisma.api.findUnique.mockResolvedValue({
        ...mockApi,
        lifecycleState: 'DEPRECATED',
        deprecatedAt,
        migrationWindow: 'DAYS_60',
      });

      const result = await controller.getTimeline('api-1');

      expect(result.currentState).toBe('DEPRECATED');
      expect(result.timeline).toHaveLength(3);
      expect(result.timeline[2].event).toBe('API_DEPRECATED');
      expect(result.timeline[2].date).toBe(deprecatedAt.toISOString());
      expect(result.timeline[2].details).toContain('DAYS_60');
    });

    it('should return full timeline for SUNSET API', async () => {
      const deprecatedAt = new Date('2024-06-01T00:00:00Z');
      const sunsetAt = new Date('2024-08-01T00:00:00Z');
      prisma.api.findUnique.mockResolvedValue({
        ...mockApi,
        lifecycleState: 'SUNSET',
        deprecatedAt,
        sunsetAt,
        migrationWindow: 'DAYS_60',
      });

      const result = await controller.getTimeline('api-1');

      expect(result.currentState).toBe('SUNSET');
      expect(result.timeline).toHaveLength(4);
      expect(result.timeline[3].event).toBe('API_SUNSET');
      expect(result.timeline[3].date).toBe(sunsetAt.toISOString());
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);

      await expect(controller.getTimeline('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── GET /governance/status ─────────────────────────────

  describe('getStatus', () => {
    it('should return global status panel with summary and API list', async () => {
      const apis = [
        {
          id: 'api-1',
          name: 'Cotización Auto',
          slug: 'cotizacion-auto',
          product: 'AUTO',
          process: 'COTIZACION',
          currentVersion: '1.0.0',
          lifecycleState: 'ACTIVE',
          slaUptime: 99.9,
          deprecatedAt: null,
          sunsetAt: null,
          migrationWindow: null,
          updatedAt: new Date('2024-01-15T00:00:00Z'),
        },
        {
          id: 'api-2',
          name: 'Emisión Vida',
          slug: 'emision-vida',
          product: 'VIDA',
          process: 'EMISION',
          currentVersion: '2.0.0',
          lifecycleState: 'DEPRECATED',
          slaUptime: 99.5,
          deprecatedAt: new Date('2024-06-01T00:00:00Z'),
          sunsetAt: new Date('2024-08-01T00:00:00Z'),
          migrationWindow: 'DAYS_60',
          updatedAt: new Date('2024-06-01T00:00:00Z'),
        },
      ];
      prisma.api.findMany.mockResolvedValue(apis);

      const result = await controller.getStatus();

      expect(prisma.api.findMany).toHaveBeenCalledWith({
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

      expect(result.summary).toEqual({
        total: 2,
        byState: {
          DRAFT: 0,
          ACTIVE: 1,
          DEPRECATED: 1,
          SUNSET: 0,
        },
      });

      expect(result.apis).toHaveLength(2);
      expect(result.apis[0]).toEqual({
        id: 'api-1',
        name: 'Cotización Auto',
        slug: 'cotizacion-auto',
        product: 'AUTO',
        process: 'COTIZACION',
        version: '1.0.0',
        state: 'ACTIVE',
        slaUptime: 99.9,
        deprecatedAt: null,
        sunsetAt: null,
        migrationWindow: null,
        lastUpdated: '2024-01-15T00:00:00.000Z',
      });

      expect(result.apis[1].deprecatedAt).toBe('2024-06-01T00:00:00.000Z');
      expect(result.apis[1].sunsetAt).toBe('2024-08-01T00:00:00.000Z');
      expect(result.apis[1].migrationWindow).toBe('DAYS_60');
    });

    it('should return empty status when no APIs exist', async () => {
      prisma.api.findMany.mockResolvedValue([]);

      const result = await controller.getStatus();

      expect(result.summary).toEqual({
        total: 0,
        byState: { DRAFT: 0, ACTIVE: 0, DEPRECATED: 0, SUNSET: 0 },
      });
      expect(result.apis).toEqual([]);
    });
  });
});
