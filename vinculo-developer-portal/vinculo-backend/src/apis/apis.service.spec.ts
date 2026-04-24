import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApisService } from './apis.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { OpenApiParserService } from './openapi-parser.service';

// ─── Mock factories ────────────────────────────────────────

function createMockPrisma() {
  return {
    api: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    apiVersion: {
      findMany: jest.fn(),
    },
  };
}

function createMockRedis() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
  };
}

function createMockOpenApiParser() {
  return {
    parse: jest.fn(),
  };
}

// ─── Test data helpers ─────────────────────────────────────

const sampleApi = {
  id: 'api-uuid-1',
  name: 'Cotización Auto',
  slug: 'cotizacion-auto',
  description: 'API para cotización de seguros de automóvil',
  descriptionEn: 'API for automobile insurance quotation',
  product: 'AUTO',
  process: 'COTIZACION',
  currentVersion: '1.0.0',
  lifecycleState: 'DRAFT',
  slaUptime: 99.9,
  contactName: 'Juan Pérez',
  contactEmail: 'juan@segurosbolivar.com',
  contactSlack: '#api-auto',
  specOpenApi: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const sampleApiWithRelations = {
  ...sampleApi,
  versions: [
    {
      id: 'ver-1',
      apiId: 'api-uuid-1',
      version: '1.0.0',
      versionUrl: '/v1/',
      lifecycleState: 'ACTIVE',
      createdAt: new Date('2024-01-01'),
    },
  ],
  _count: {
    sandboxSessions: 42,
    consumptions: 5,
  },
};

const validOpenApiSpec = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: { '/test': { get: { responses: { '200': { description: 'OK' } } } } },
};

// ─── Test suite ────────────────────────────────────────────

describe('ApisService', () => {
  let service: ApisService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let redis: ReturnType<typeof createMockRedis>;
  let openApiParser: ReturnType<typeof createMockOpenApiParser>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    redis = createMockRedis();
    openApiParser = createMockOpenApiParser();

    // Default: scan returns no keys (empty cache)
    redis.scan.mockResolvedValue(['0', []]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApisService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: OpenApiParserService, useValue: openApiParser },
      ],
    }).compile();

    service = module.get<ApisService>(ApisService);
  });

  // ─── findAll ─────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated APIs with no filters', async () => {
      prisma.api.findMany.mockResolvedValue([sampleApi]);
      redis.get.mockResolvedValue(null); // cache miss

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.count).toBe(1);
      expect(prisma.api.findMany).toHaveBeenCalled();
    });

    it('should return cached result on cache hit', async () => {
      const cachedResult = {
        data: [{ id: 'api-uuid-1', name: 'Cotización Auto' }],
        pagination: { hasNextPage: false, count: 1 },
      };
      redis.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.findAll({});

      expect(result).toEqual(cachedResult);
      expect(prisma.api.findMany).not.toHaveBeenCalled();
    });

    it('should cache result on cache miss', async () => {
      prisma.api.findMany.mockResolvedValue([sampleApi]);
      redis.get.mockResolvedValue(null);

      await service.findAll({});

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('api:catalog'),
        expect.any(String),
        'EX',
        300,
      );
    });

    it('should apply product filter', async () => {
      prisma.api.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ product: 'AUTO' });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.where.product).toBe('AUTO');
    });

    it('should apply process filter', async () => {
      prisma.api.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ process: 'COTIZACION' });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.where.process).toBe('COTIZACION');
    });

    it('should apply lifecycleState filter', async () => {
      prisma.api.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ lifecycleState: 'ACTIVE' });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.where.lifecycleState).toBe('ACTIVE');
    });

    it('should apply version filter', async () => {
      prisma.api.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ version: '2.0.0' });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.where.currentVersion).toBe('2.0.0');
    });

    it('should apply search filter with OR on name and description', async () => {
      prisma.api.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ search: 'cotización' });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.where.OR).toEqual([
        { name: { contains: 'cotización', mode: 'insensitive' } },
        { description: { contains: 'cotización', mode: 'insensitive' } },
      ]);
    });

    it('should apply multiple filters simultaneously', async () => {
      prisma.api.findMany.mockResolvedValue([]);
      redis.get.mockResolvedValue(null);

      await service.findAll({
        product: 'VIDA',
        process: 'EMISION',
        lifecycleState: 'ACTIVE',
      });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.where.product).toBe('VIDA');
      expect(findManyArgs.where.process).toBe('EMISION');
      expect(findManyArgs.where.lifecycleState).toBe('ACTIVE');
    });

    it('should handle cursor-based pagination', async () => {
      prisma.api.findMany.mockResolvedValue([sampleApi]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ cursor: 'some-cursor-id' });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.cursor).toEqual({ id: 'some-cursor-id' });
      expect(findManyArgs.skip).toBe(1);
    });

    it('should detect hasNextPage when more results exist', async () => {
      // Default take is 20, so return 21 items to trigger hasNextPage
      const manyApis = Array.from({ length: 21 }, (_, i) => ({
        ...sampleApi,
        id: `api-${i}`,
      }));
      prisma.api.findMany.mockResolvedValue(manyApis);
      redis.get.mockResolvedValue(null);

      const result = await service.findAll({});

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.data).toHaveLength(20);
      expect(result.pagination.nextCursor).toBe('api-19');
    });

    it('should respect custom take parameter', async () => {
      prisma.api.findMany.mockResolvedValue([sampleApi]);
      redis.get.mockResolvedValue(null);

      await service.findAll({ take: 5 });

      const findManyArgs = prisma.api.findMany.mock.calls[0][0];
      expect(findManyArgs.take).toBe(6); // take + 1 for next page detection
    });
  });

  // ─── findById ────────────────────────────────────────────

  describe('findById', () => {
    it('should return API detail with versions and metrics', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApiWithRelations);
      redis.get.mockResolvedValue(null);

      const result = await service.findById('api-uuid-1');

      expect(result.id).toBe('api-uuid-1');
      expect(result.versions).toHaveLength(1);
      expect(result.metrics).toEqual({
        totalSandboxSessions: 42,
        totalConsumers: 5,
      });
    });

    it('should return cached result on cache hit', async () => {
      const cachedDetail = { id: 'api-uuid-1', name: 'Cached API' };
      redis.get.mockResolvedValue(JSON.stringify(cachedDetail));

      const result = await service.findById('api-uuid-1');

      expect(result).toEqual(cachedDetail);
      expect(prisma.api.findUnique).not.toHaveBeenCalled();
    });

    it('should cache result with correct key and TTL on cache miss', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApiWithRelations);
      redis.get.mockResolvedValue(null);

      await service.findById('api-uuid-1');

      expect(redis.set).toHaveBeenCalledWith(
        'api:detail:api-uuid-1',
        expect.any(String),
        'EX',
        600,
      );
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);
      redis.get.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include related data in the Prisma query', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApiWithRelations);
      redis.get.mockResolvedValue(null);

      await service.findById('api-uuid-1');

      expect(prisma.api.findUnique).toHaveBeenCalledWith({
        where: { id: 'api-uuid-1' },
        include: {
          versions: { orderBy: { createdAt: 'desc' } },
          _count: { select: { sandboxSessions: true, consumptions: true } },
        },
      });
    });
  });

  // ─── create ──────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      name: 'Cotización Auto',
      description: 'API para cotización de seguros de automóvil',
      product: 'AUTO',
      process: 'COTIZACION',
    };

    it('should create an API in DRAFT state with generated slug', async () => {
      prisma.api.findUnique.mockResolvedValue(null); // no slug conflict
      prisma.api.create.mockResolvedValue({ ...sampleApi });

      const result = await service.create(createDto as any);

      expect(prisma.api.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Cotización Auto',
          slug: 'cotizacion-auto',
          lifecycleState: 'DRAFT',
        }),
      });
      expect(result.id).toBe('api-uuid-1');
    });

    it('should generate correct slug from name with special characters', async () => {
      prisma.api.findUnique.mockResolvedValue(null);
      prisma.api.create.mockResolvedValue({ ...sampleApi, slug: 'poliza-vida-basica' });

      await service.create({
        ...createDto,
        name: 'Póliza Vida Básica',
      } as any);

      expect(prisma.api.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'poliza-vida-basica',
        }),
      });
    });

    it('should throw BadRequestException on duplicate slug', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi); // slug already exists

      await expect(service.create(createDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use default version 1.0.0 when not provided', async () => {
      prisma.api.findUnique.mockResolvedValue(null);
      prisma.api.create.mockResolvedValue(sampleApi);

      await service.create(createDto as any);

      expect(prisma.api.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currentVersion: '1.0.0',
        }),
      });
    });

    it('should use default SLA 99.9 when not provided', async () => {
      prisma.api.findUnique.mockResolvedValue(null);
      prisma.api.create.mockResolvedValue(sampleApi);

      await service.create(createDto as any);

      expect(prisma.api.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slaUptime: 99.9,
        }),
      });
    });

    it('should invalidate catalog cache after creation', async () => {
      prisma.api.findUnique.mockResolvedValue(null);
      prisma.api.create.mockResolvedValue(sampleApi);
      redis.scan.mockResolvedValue(['0', ['api:catalog', 'api:catalog:p:AUTO']]);

      await service.create(createDto as any);

      expect(redis.del).toHaveBeenCalledWith('api:catalog', 'api:catalog:p:AUTO');
    });

    it('should use custom version and SLA when provided', async () => {
      prisma.api.findUnique.mockResolvedValue(null);
      prisma.api.create.mockResolvedValue(sampleApi);

      await service.create({
        ...createDto,
        currentVersion: '2.0.0',
        slaUptime: 99.95,
      } as any);

      expect(prisma.api.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currentVersion: '2.0.0',
          slaUptime: 99.95,
        }),
      });
    });
  });

  // ─── update ──────────────────────────────────────────────

  describe('update', () => {
    it('should update API fields and return updated API', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      prisma.api.update.mockResolvedValue({
        ...sampleApi,
        description: 'Updated description',
      });

      const result = await service.update('api-uuid-1', {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
      expect(prisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-uuid-1' },
        data: { description: 'Updated description' },
      });
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should regenerate slug when name changes', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      prisma.api.findFirst.mockResolvedValue(null); // no slug conflict
      prisma.api.update.mockResolvedValue({
        ...sampleApi,
        name: 'Emisión Auto',
        slug: 'emision-auto',
      });

      await service.update('api-uuid-1', { name: 'Emisión Auto' });

      expect(prisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-uuid-1' },
        data: expect.objectContaining({
          name: 'Emisión Auto',
          slug: 'emision-auto',
        }),
      });
    });

    it('should throw BadRequestException on slug conflict when name changes', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      prisma.api.findFirst.mockResolvedValue({ id: 'other-api', slug: 'emision-auto' });

      await expect(
        service.update('api-uuid-1', { name: 'Emisión Auto' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should invalidate both detail and catalog caches after update', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      prisma.api.update.mockResolvedValue(sampleApi);
      redis.scan.mockResolvedValue(['0', ['api:catalog']]);

      await service.update('api-uuid-1', { description: 'Updated' });

      // Detail cache invalidated
      expect(redis.del).toHaveBeenCalledWith('api:detail:api-uuid-1');
      // Catalog cache invalidated
      expect(redis.del).toHaveBeenCalledWith('api:catalog');
    });

    it('should only update provided fields', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      prisma.api.update.mockResolvedValue(sampleApi);

      await service.update('api-uuid-1', { slaUptime: 99.95 });

      expect(prisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-uuid-1' },
        data: { slaUptime: 99.95 },
      });
    });
  });

  // ─── uploadSpec ──────────────────────────────────────────

  describe('uploadSpec', () => {
    it('should parse and store a valid OpenAPI spec', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      openApiParser.parse.mockReturnValue({
        success: true,
        spec: validOpenApiSpec,
        errors: [],
      });
      prisma.api.update.mockResolvedValue({
        ...sampleApi,
        specOpenApi: validOpenApiSpec,
      });
      redis.scan.mockResolvedValue(['0', []]);

      const specBuffer = Buffer.from(JSON.stringify(validOpenApiSpec), 'utf-8');
      const result = await service.uploadSpec('api-uuid-1', specBuffer);

      expect(openApiParser.parse).toHaveBeenCalledWith(specBuffer);
      expect(prisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-uuid-1' },
        data: { specOpenApi: validOpenApiSpec },
      });
      expect(result.specOpenApi).toEqual(validOpenApiSpec);
    });

    it('should throw BadRequestException for invalid OpenAPI spec', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      openApiParser.parse.mockReturnValue({
        success: false,
        errors: [{ path: 'info', message: 'Missing required field "info"' }],
      });

      const specBuffer = Buffer.from('invalid spec', 'utf-8');

      await expect(service.uploadSpec('api-uuid-1', specBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include validation errors in the BadRequestException', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      const errors = [
        { path: 'openapi', message: 'Missing required field "openapi"' },
        { path: 'info', message: 'Missing required field "info"' },
      ];
      openApiParser.parse.mockReturnValue({ success: false, errors });

      const specBuffer = Buffer.from('{}', 'utf-8');

      try {
        await service.uploadSpec('api-uuid-1', specBuffer);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        expect(response).toEqual({
          message: 'La especificación OpenAPI no es válida',
          errors,
        });
      }
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);

      const specBuffer = Buffer.from('test', 'utf-8');

      await expect(service.uploadSpec('nonexistent-id', specBuffer)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should invalidate caches after successful spec upload', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      openApiParser.parse.mockReturnValue({
        success: true,
        spec: validOpenApiSpec,
        errors: [],
      });
      prisma.api.update.mockResolvedValue({
        ...sampleApi,
        specOpenApi: validOpenApiSpec,
      });
      redis.scan.mockResolvedValue(['0', ['api:catalog']]);

      const specBuffer = Buffer.from(JSON.stringify(validOpenApiSpec), 'utf-8');
      await service.uploadSpec('api-uuid-1', specBuffer);

      // Detail cache invalidated
      expect(redis.del).toHaveBeenCalledWith('api:detail:api-uuid-1');
      // Catalog cache invalidated
      expect(redis.del).toHaveBeenCalledWith('api:catalog');
    });
  });

  // ─── Cache invalidation ──────────────────────────────────

  describe('cache invalidation', () => {
    it('should scan and delete all catalog cache keys', async () => {
      prisma.api.findUnique.mockResolvedValue(null); // for slug check
      prisma.api.create.mockResolvedValue(sampleApi);
      redis.scan
        .mockResolvedValueOnce(['5', ['api:catalog', 'api:catalog:p:AUTO']])
        .mockResolvedValueOnce(['0', ['api:catalog:pr:COTIZACION']]);

      await service.create({
        name: 'Test API',
        description: 'Test',
        product: 'AUTO',
        process: 'COTIZACION',
      } as any);

      // Should have called del with all found keys
      expect(redis.del).toHaveBeenCalledWith(
        'api:catalog',
        'api:catalog:p:AUTO',
        'api:catalog:pr:COTIZACION',
      );
    });

    it('should not call del when no cache keys exist', async () => {
      prisma.api.findUnique.mockResolvedValue(sampleApi);
      prisma.api.update.mockResolvedValue(sampleApi);
      redis.scan.mockResolvedValue(['0', []]);

      await service.update('api-uuid-1', { description: 'Updated' });

      // del called once for detail key, but not for catalog (no keys found)
      expect(redis.del).toHaveBeenCalledTimes(1);
      expect(redis.del).toHaveBeenCalledWith('api:detail:api-uuid-1');
    });
  });
});
