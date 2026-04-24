import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { PrismaService } from '../prisma/prisma.service';
import { MigrationWindowDto } from './dto/deprecate-api.dto';

/**
 * Unit tests for GovernanceService.
 *
 * Tests: publicación DRAFT→ACTIVE, deprecación con ventana de migración,
 * sunset y desactivación, reactivación, transiciones inválidas,
 * reactivation fails when sunset passed, notification creation.
 *
 * Requirements: 8.1–8.5, 13.1–13.5
 */
describe('GovernanceService', () => {
  let service: GovernanceService;
  let mockPrisma: {
    api: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    apiConsumption: {
      findMany: jest.Mock;
    };
    notification: {
      create: jest.Mock;
    };
  };

  const baseMockApi = {
    id: 'api-1',
    name: 'Cotización Auto',
    slug: 'cotizacion-auto',
    description: 'API de cotización de seguros de auto',
    product: 'AUTO',
    process: 'COTIZACION',
    currentVersion: '1.0.0',
    slaUptime: 99.9,
    deprecatedAt: null,
    sunsetAt: null,
    migrationWindow: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      api: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      apiConsumption: {
        findMany: jest.fn(),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };

    service = new GovernanceService(mockPrisma as unknown as PrismaService);
  });

  // ─── Publicación DRAFT → ACTIVE ─────────────────────────

  describe('publish (DRAFT → ACTIVE)', () => {
    it('should transition a DRAFT API to ACTIVE', async () => {
      const draftApi = { ...baseMockApi, lifecycleState: 'DRAFT' };
      const activeApi = { ...draftApi, lifecycleState: 'ACTIVE' };

      mockPrisma.api.findUnique.mockResolvedValue(draftApi);
      mockPrisma.api.update.mockResolvedValue(activeApi);

      const result = await service.publish('api-1');

      expect(mockPrisma.api.findUnique).toHaveBeenCalledWith({
        where: { id: 'api-1' },
      });
      expect(mockPrisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-1' },
        data: { lifecycleState: 'ACTIVE' },
      });
      expect(result.lifecycleState).toBe('ACTIVE');
    });

    it('should throw NotFoundException when API does not exist', async () => {
      mockPrisma.api.findUnique.mockResolvedValue(null);

      await expect(service.publish('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when API is not in DRAFT state', async () => {
      mockPrisma.api.findUnique.mockResolvedValue({
        ...baseMockApi,
        lifecycleState: 'ACTIVE',
      });

      await expect(service.publish('api-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Deprecación con ventana de migración ────────────────

  describe('deprecate (ACTIVE → DEPRECATED)', () => {
    it('should transition ACTIVE API to DEPRECATED with 30-day window', async () => {
      const activeApi = { ...baseMockApi, lifecycleState: 'ACTIVE' };
      mockPrisma.api.findUnique.mockResolvedValue(activeApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...activeApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([]);

      const result = await service.deprecate('api-1', {
        migrationWindow: MigrationWindowDto.DAYS_30,
      });

      expect(result.lifecycleState).toBe('DEPRECATED');
      expect(result.migrationWindow).toBe('DAYS_30');
      expect(result.deprecatedAt).toBeInstanceOf(Date);
      expect(result.sunsetAt).toBeInstanceOf(Date);

      // Verify sunset is ~30 days after deprecation
      const diffMs =
        result.sunsetAt!.getTime() - result.deprecatedAt!.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });

    it('should transition ACTIVE API to DEPRECATED with 60-day window', async () => {
      const activeApi = { ...baseMockApi, lifecycleState: 'ACTIVE' };
      mockPrisma.api.findUnique.mockResolvedValue(activeApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...activeApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([]);

      const result = await service.deprecate('api-1', {
        migrationWindow: MigrationWindowDto.DAYS_60,
      });

      const diffMs =
        result.sunsetAt!.getTime() - result.deprecatedAt!.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(60);
    });

    it('should transition ACTIVE API to DEPRECATED with 90-day window', async () => {
      const activeApi = { ...baseMockApi, lifecycleState: 'ACTIVE' };
      mockPrisma.api.findUnique.mockResolvedValue(activeApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...activeApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([]);

      const result = await service.deprecate('api-1', {
        migrationWindow: MigrationWindowDto.DAYS_90,
      });

      const diffMs =
        result.sunsetAt!.getTime() - result.deprecatedAt!.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(90);
    });

    it('should throw BadRequestException when API is not ACTIVE', async () => {
      mockPrisma.api.findUnique.mockResolvedValue({
        ...baseMockApi,
        lifecycleState: 'DRAFT',
      });

      await expect(
        service.deprecate('api-1', {
          migrationWindow: MigrationWindowDto.DAYS_30,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Sunset y desactivación del catálogo ─────────────────

  describe('sunset (DEPRECATED → SUNSET)', () => {
    it('should transition DEPRECATED API to SUNSET', async () => {
      const deprecatedApi = {
        ...baseMockApi,
        lifecycleState: 'DEPRECATED',
        deprecatedAt: new Date('2024-06-01'),
        sunsetAt: new Date('2024-07-01'),
        migrationWindow: 'DAYS_30',
      };
      mockPrisma.api.findUnique.mockResolvedValue(deprecatedApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...deprecatedApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([]);

      const result = await service.sunset('api-1');

      expect(result.lifecycleState).toBe('SUNSET');
      expect(result.sunsetAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when API is not DEPRECATED', async () => {
      mockPrisma.api.findUnique.mockResolvedValue({
        ...baseMockApi,
        lifecycleState: 'ACTIVE',
      });

      await expect(service.sunset('api-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should notify all consumers on sunset', async () => {
      const deprecatedApi = {
        ...baseMockApi,
        lifecycleState: 'DEPRECATED',
        deprecatedAt: new Date(),
        sunsetAt: new Date(),
        migrationWindow: 'DAYS_30',
      };
      mockPrisma.api.findUnique.mockResolvedValue(deprecatedApi);
      mockPrisma.api.update.mockResolvedValue({
        ...deprecatedApi,
        lifecycleState: 'SUNSET',
      });
      mockPrisma.apiConsumption.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);

      await service.sunset('api-1');

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'API_SUNSET',
            userId: 'user-1',
          }),
        }),
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'API_SUNSET',
            userId: 'user-2',
          }),
        }),
      );
    });
  });

  // ─── Reactivación de API deprecada ───────────────────────

  describe('reactivate (DEPRECATED → ACTIVE)', () => {
    it('should reactivate a DEPRECATED API with future sunset date', async () => {
      const futureSunset = new Date();
      futureSunset.setDate(futureSunset.getDate() + 30);

      const deprecatedApi = {
        ...baseMockApi,
        lifecycleState: 'DEPRECATED',
        deprecatedAt: new Date(),
        sunsetAt: futureSunset,
        migrationWindow: 'DAYS_30',
      };
      mockPrisma.api.findUnique.mockResolvedValue(deprecatedApi);
      mockPrisma.api.update.mockResolvedValue({
        ...baseMockApi,
        lifecycleState: 'ACTIVE',
        deprecatedAt: null,
        sunsetAt: null,
        migrationWindow: null,
      });

      const result = await service.reactivate('api-1');

      expect(result.lifecycleState).toBe('ACTIVE');
      expect(result.deprecatedAt).toBeNull();
      expect(result.sunsetAt).toBeNull();
      expect(result.migrationWindow).toBeNull();
      expect(mockPrisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-1' },
        data: {
          lifecycleState: 'ACTIVE',
          deprecatedAt: null,
          sunsetAt: null,
          migrationWindow: null,
        },
      });
    });

    it('should throw BadRequestException when sunset date has passed', async () => {
      const pastSunset = new Date();
      pastSunset.setDate(pastSunset.getDate() - 1);

      const deprecatedApi = {
        ...baseMockApi,
        lifecycleState: 'DEPRECATED',
        deprecatedAt: new Date('2024-01-01'),
        sunsetAt: pastSunset,
        migrationWindow: 'DAYS_30',
      };
      mockPrisma.api.findUnique.mockResolvedValue(deprecatedApi);

      await expect(service.reactivate('api-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.reactivate('api-1')).rejects.toThrow(
        /fecha de sunset.*ya ha pasado/,
      );
    });

    it('should throw BadRequestException when API is not DEPRECATED', async () => {
      mockPrisma.api.findUnique.mockResolvedValue({
        ...baseMockApi,
        lifecycleState: 'ACTIVE',
      });

      await expect(service.reactivate('api-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Transiciones inválidas (error descriptivo) ──────────

  describe('validateTransition — invalid transitions', () => {
    it('should reject DRAFT → DEPRECATED with descriptive error', () => {
      expect(() =>
        service.validateTransition('DRAFT', 'DEPRECATED'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition('DRAFT', 'DEPRECATED'),
      ).toThrow(/Transición inválida.*DRAFT.*DEPRECATED/);
    });

    it('should reject DRAFT → SUNSET with descriptive error', () => {
      expect(() => service.validateTransition('DRAFT', 'SUNSET')).toThrow(
        BadRequestException,
      );
    });

    it('should reject ACTIVE → DRAFT with descriptive error', () => {
      expect(() => service.validateTransition('ACTIVE', 'DRAFT')).toThrow(
        BadRequestException,
      );
    });

    it('should reject ACTIVE → SUNSET with descriptive error', () => {
      expect(() =>
        service.validateTransition('ACTIVE', 'SUNSET'),
      ).toThrow(BadRequestException);
    });

    it('should reject SUNSET → any state with descriptive error', () => {
      expect(() =>
        service.validateTransition('SUNSET', 'DRAFT'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition('SUNSET', 'ACTIVE'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition('SUNSET', 'DEPRECATED'),
      ).toThrow(BadRequestException);
    });

    it('should reject self-transitions', () => {
      expect(() =>
        service.validateTransition('DRAFT', 'DRAFT'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition('ACTIVE', 'ACTIVE'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition('DEPRECATED', 'DEPRECATED'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition('SUNSET', 'SUNSET'),
      ).toThrow(BadRequestException);
    });

    it('should include current and target state in error message', () => {
      try {
        service.validateTransition('DRAFT', 'SUNSET');
      } catch (error) {
        expect((error as BadRequestException).message).toContain('DRAFT');
        expect((error as BadRequestException).message).toContain('SUNSET');
      }
    });
  });

  // ─── Notification creation for consumers ─────────────────

  describe('notification creation for consumers', () => {
    it('should create notifications for all consumers on deprecation', async () => {
      const activeApi = { ...baseMockApi, lifecycleState: 'ACTIVE' };
      mockPrisma.api.findUnique.mockResolvedValue(activeApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...activeApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);

      await service.deprecate('api-1', {
        migrationWindow: MigrationWindowDto.DAYS_60,
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(3);

      // Verify each notification has correct type and contains API info
      for (let i = 0; i < 3; i++) {
        const call = mockPrisma.notification.create.mock.calls[i][0];
        expect(call.data.type).toBe('API_DEPRECATED');
        expect(call.data.title).toContain('Cotización Auto');
        expect(call.data.message).toContain('DEPRECATED');
        expect(call.data.metadata.apiId).toBe('api-1');
      }
    });

    it('should not create notifications when there are no consumers', async () => {
      const activeApi = { ...baseMockApi, lifecycleState: 'ACTIVE' };
      mockPrisma.api.findUnique.mockResolvedValue(activeApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...activeApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([]);

      await service.deprecate('api-1', {
        migrationWindow: MigrationWindowDto.DAYS_30,
      });

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('should include migration window info in notification message', async () => {
      const activeApi = { ...baseMockApi, lifecycleState: 'ACTIVE' };
      mockPrisma.api.findUnique.mockResolvedValue(activeApi);
      mockPrisma.api.update.mockImplementation((args) =>
        Promise.resolve({ ...activeApi, ...args.data }),
      );
      mockPrisma.apiConsumption.findMany.mockResolvedValue([
        { userId: 'user-1' },
      ]);

      await service.deprecate('api-1', {
        migrationWindow: MigrationWindowDto.DAYS_90,
      });

      const call = mockPrisma.notification.create.mock.calls[0][0];
      expect(call.data.message).toContain('90 días');
      expect(call.data.metadata.migrationWindow).toBe('DAYS_90');
    });
  });
});
