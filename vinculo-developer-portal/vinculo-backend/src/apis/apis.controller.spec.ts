import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApisController } from './apis.controller';
import { ApisService } from './apis.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '../auth/jwt.service';

describe('ApisController', () => {
  let controller: ApisController;
  let apisService: jest.Mocked<ApisService>;
  let prisma: {
    api: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    apiVersion: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    const mockApisService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      uploadSpec: jest.fn(),
    };

    const mockPrisma = {
      api: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      apiVersion: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      verifyToken: jest.fn(),
      signToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApisController],
      providers: [
        { provide: ApisService, useValue: mockApisService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        Reflector,
      ],
    }).compile();

    controller = module.get<ApisController>(ApisController);
    apisService = module.get(ApisService) as jest.Mocked<ApisService>;
    prisma = module.get(PrismaService) as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── GET /apis ───────────────────────────────────────────

  describe('findAll', () => {
    it('should call apisService.findAll with filters and return paginated result', async () => {
      const filters = { product: 'AUTO', take: 10 };
      const expected = {
        data: [{ id: 'api-1', name: 'Cotización Auto' }],
        pagination: { hasNextPage: false, nextCursor: undefined, count: 1 },
      };
      apisService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(filters as any);

      expect(apisService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expected);
    });

    it('should call apisService.findAll with empty filters', async () => {
      const expected = {
        data: [],
        pagination: { hasNextPage: false, nextCursor: undefined, count: 0 },
      };
      apisService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({} as any);

      expect(apisService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(expected);
    });
  });

  // ─── GET /apis/:id ──────────────────────────────────────

  describe('findById', () => {
    it('should call apisService.findById and return API detail', async () => {
      const expected = {
        id: 'api-1',
        name: 'Cotización Auto',
        versions: [],
        metrics: { totalSandboxSessions: 0, totalConsumers: 0 },
      };
      apisService.findById.mockResolvedValue(expected);

      const result = await controller.findById('api-1');

      expect(apisService.findById).toHaveBeenCalledWith('api-1');
      expect(result).toEqual(expected);
    });

    it('should propagate NotFoundException when API does not exist', async () => {
      apisService.findById.mockRejectedValue(
        new NotFoundException('API con ID "nonexistent" no encontrada'),
      );

      await expect(controller.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── POST /apis ─────────────────────────────────────────

  describe('create', () => {
    it('should call apisService.create and return the new API', async () => {
      const dto = {
        name: 'Cotización Vida',
        description: 'API para cotización de seguros de vida',
        product: 'VIDA',
        process: 'COTIZACION',
      };
      const expected = {
        id: 'api-new',
        ...dto,
        slug: 'cotizacion-vida',
        lifecycleState: 'DRAFT',
      };
      apisService.create.mockResolvedValue(expected as any);

      const result = await controller.create(dto as any);

      expect(apisService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate BadRequestException for duplicate slug', async () => {
      const dto = {
        name: 'Cotización Auto',
        description: 'Duplicada',
        product: 'AUTO',
        process: 'COTIZACION',
      };
      apisService.create.mockRejectedValue(
        new BadRequestException('Ya existe una API con el slug "cotizacion-auto"'),
      );

      await expect(controller.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── PATCH /apis/:id ────────────────────────────────────

  describe('update', () => {
    it('should call apisService.update and return the updated API', async () => {
      const dto = { description: 'Descripción actualizada' };
      const expected = {
        id: 'api-1',
        name: 'Cotización Auto',
        description: 'Descripción actualizada',
      };
      apisService.update.mockResolvedValue(expected as any);

      const result = await controller.update('api-1', dto as any);

      expect(apisService.update).toHaveBeenCalledWith('api-1', dto);
      expect(result).toEqual(expected);
    });

    it('should propagate NotFoundException when API does not exist', async () => {
      apisService.update.mockRejectedValue(
        new NotFoundException('API con ID "nonexistent" no encontrada'),
      );

      await expect(
        controller.update('nonexistent', { description: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── GET /apis/:id/versions ─────────────────────────────

  describe('listVersions', () => {
    it('should return versions for an existing API', async () => {
      prisma.api.findUnique.mockResolvedValue({ id: 'api-1', name: 'Test API' });
      const versions = [
        { id: 'v-1', apiId: 'api-1', version: '2.0.0', versionUrl: '/v2/' },
        { id: 'v-2', apiId: 'api-1', version: '1.0.0', versionUrl: '/v1/' },
      ];
      prisma.apiVersion.findMany.mockResolvedValue(versions);

      const result = await controller.listVersions('api-1');

      expect(prisma.api.findUnique).toHaveBeenCalledWith({ where: { id: 'api-1' } });
      expect(prisma.apiVersion.findMany).toHaveBeenCalledWith({
        where: { apiId: 'api-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({ data: versions });
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);

      await expect(controller.listVersions('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── POST /apis/:id/versions ────────────────────────────

  describe('createVersion', () => {
    it('should create a new version with correct versionUrl', async () => {
      prisma.api.findUnique.mockResolvedValue({
        id: 'api-1',
        name: 'Test API',
        specOpenApi: { openapi: '3.1.0' },
      });
      prisma.apiVersion.findUnique.mockResolvedValue(null);
      const createdVersion = {
        id: 'v-new',
        apiId: 'api-1',
        version: '2.0.0',
        versionUrl: '/v2/',
        changelog: 'New features',
      };
      prisma.apiVersion.create.mockResolvedValue(createdVersion);
      prisma.api.update.mockResolvedValue({});

      const result = await controller.createVersion('api-1', {
        version: '2.0.0',
        changelog: 'New features',
      });

      expect(prisma.apiVersion.create).toHaveBeenCalledWith({
        data: {
          apiId: 'api-1',
          version: '2.0.0',
          versionUrl: '/v2/',
          changelog: 'New features',
          specOpenApi: { openapi: '3.1.0' },
        },
      });
      expect(prisma.api.update).toHaveBeenCalledWith({
        where: { id: 'api-1' },
        data: { currentVersion: '2.0.0' },
      });
      expect(result).toEqual(createdVersion);
    });

    it('should generate /v1/ URL for version 1.x.x', async () => {
      prisma.api.findUnique.mockResolvedValue({
        id: 'api-1',
        name: 'Test API',
        specOpenApi: null,
      });
      prisma.apiVersion.findUnique.mockResolvedValue(null);
      prisma.apiVersion.create.mockResolvedValue({
        id: 'v-new',
        version: '1.2.3',
        versionUrl: '/v1/',
      });
      prisma.api.update.mockResolvedValue({});

      await controller.createVersion('api-1', { version: '1.2.3' });

      expect(prisma.apiVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ versionUrl: '/v1/' }),
        }),
      );
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);

      await expect(
        controller.createVersion('nonexistent', { version: '1.0.0' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for duplicate version', async () => {
      prisma.api.findUnique.mockResolvedValue({ id: 'api-1', name: 'Test API' });
      prisma.apiVersion.findUnique.mockResolvedValue({
        id: 'v-existing',
        version: '1.0.0',
      });

      await expect(
        controller.createVersion('api-1', { version: '1.0.0' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /apis/:id/upload-spec ─────────────────────────

  describe('uploadSpec', () => {
    it('should call apisService.uploadSpec with buffer from spec string', async () => {
      const specString = '{"openapi":"3.1.0","info":{"title":"Test","version":"1.0.0"}}';
      const expected = { id: 'api-1', specOpenApi: JSON.parse(specString) };
      apisService.uploadSpec.mockResolvedValue(expected as any);

      const result = await controller.uploadSpec('api-1', { spec: specString });

      expect(apisService.uploadSpec).toHaveBeenCalledWith(
        'api-1',
        Buffer.from(specString, 'utf-8'),
      );
      expect(result).toEqual(expected);
    });

    it('should propagate BadRequestException for invalid spec', async () => {
      apisService.uploadSpec.mockRejectedValue(
        new BadRequestException('La especificación OpenAPI no es válida'),
      );

      await expect(
        controller.uploadSpec('api-1', { spec: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── POST /apis/:id/generate-docs ──────────────────────

  describe('generateDocs', () => {
    it('should return placeholder response for existing API', async () => {
      prisma.api.findUnique.mockResolvedValue({
        id: 'api-1',
        name: 'Cotización Auto',
      });

      const result = await controller.generateDocs('api-1', {
        requestBody: { cedula: '123456789' },
      });

      expect(result).toEqual({
        message: 'Generación de documentación con IA pendiente de implementación',
        apiId: 'api-1',
        apiName: 'Cotización Auto',
        status: 'pending',
        note: expect.any(String),
      });
    });

    it('should throw NotFoundException when API does not exist', async () => {
      prisma.api.findUnique.mockResolvedValue(null);

      await expect(
        controller.generateDocs('nonexistent', { requestBody: {} }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
