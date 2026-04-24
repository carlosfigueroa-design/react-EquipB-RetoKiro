import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from './audit.service';
import { AuditActionDto } from './dto/create-audit-log.dto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit tests for AuditService.
 *
 * Tests: creation with all fields, query with combined filters,
 * compliance report generation, immutability verification.
 *
 * Requirements: 14.1–14.4
 */
describe('AuditService', () => {
  let service: AuditService;
  let mockPrisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const baseMockLog = {
    id: 'log-1',
    userId: 'user-1',
    action: AuditActionDto.API_PUBLISHED,
    resource: 'Api',
    resourceId: 'api-1',
    metadata: { apiName: 'Cotización Auto' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-06-15T10:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new AuditService(mockPrisma as unknown as PrismaService);
  });

  // ─── Creation with all fields ────────────────────────────

  describe('log (create audit entry)', () => {
    it('should create an audit log with all required fields', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(baseMockLog);

      const result = await service.log({
        userId: 'user-1',
        action: AuditActionDto.API_PUBLISHED,
        resource: 'Api',
        resourceId: 'api-1',
        metadata: { apiName: 'Cotización Auto' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(baseMockLog);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: AuditActionDto.API_PUBLISHED,
          resource: 'Api',
          resourceId: 'api-1',
          metadata: { apiName: 'Cotización Auto' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should create an audit log with optional fields as null', async () => {
      const logWithNulls = {
        ...baseMockLog,
        resourceId: null,
        metadata: null,
        userAgent: null,
      };
      mockPrisma.auditLog.create.mockResolvedValue(logWithNulls);

      const result = await service.log({
        userId: 'user-1',
        action: AuditActionDto.LOGIN_SUCCESS,
        resource: 'Auth',
        ipAddress: '10.0.0.1',
      });

      expect(result.resourceId).toBeNull();
      expect(result.metadata).toBeNull();
      expect(result.userAgent).toBeNull();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resourceId: null,
          metadata: Prisma.DbNull,
          userAgent: null,
        }),
      });
    });

    it('should create logs for all audit action types', async () => {
      for (const action of Object.values(AuditActionDto)) {
        mockPrisma.auditLog.create.mockResolvedValue({
          ...baseMockLog,
          action,
        });

        const result = await service.log({
          userId: 'user-1',
          action,
          resource: 'Test',
          ipAddress: '127.0.0.1',
        });

        expect(result.action).toBe(action);
      }
    });
  });

  // ─── Query with combined filters ─────────────────────────

  describe('findAll (query with filters)', () => {
    it('should return logs with default pagination', async () => {
      const logs = [baseMockLog];
      mockPrisma.auditLog.findMany.mockResolvedValue(logs);

      const result = await service.findAll({});

      expect(result.data).toEqual(logs);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.count).toBe(1);
    });

    it('should filter by userId', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([baseMockLog]);

      await service.findAll({ userId: 'user-1' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should filter by action type', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([baseMockLog]);

      await service.findAll({ action: AuditActionDto.API_PUBLISHED });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: AuditActionDto.API_PUBLISHED,
          }),
        }),
      );
    });

    it('should filter by resource', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([baseMockLog]);

      await service.findAll({ resource: 'Api' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ resource: 'Api' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([baseMockLog]);

      await service.findAll({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-12-31T23:59:59Z'),
            },
          }),
        }),
      );
    });

    it('should apply combined filters simultaneously', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([baseMockLog]);

      await service.findAll({
        userId: 'user-1',
        action: AuditActionDto.API_PUBLISHED,
        resource: 'Api',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            action: AuditActionDto.API_PUBLISHED,
            resource: 'Api',
            createdAt: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-12-31T23:59:59Z'),
            },
          },
        }),
      );
    });

    it('should throw BadRequestException when startDate >= endDate', async () => {
      await expect(
        service.findAll({
          startDate: '2024-12-31T00:00:00Z',
          endDate: '2024-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should support cursor-based pagination', async () => {
      // Return take+1 records to indicate there's a next page
      const manyLogs = Array.from({ length: 21 }, (_, i) => ({
        ...baseMockLog,
        id: `log-${i}`,
      }));
      mockPrisma.auditLog.findMany.mockResolvedValue(manyLogs);

      const result = await service.findAll({});

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.nextCursor).toBe('log-19');
      expect(result.data).toHaveLength(20);
    });

    it('should use cursor when provided', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([baseMockLog]);

      await service.findAll({ cursor: 'log-5' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'log-5' },
          skip: 1,
        }),
      );
    });

    it('should cap page size at MAX_PAGE_SIZE', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await service.findAll({ take: 500 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: AuditService.MAX_PAGE_SIZE + 1,
        }),
      );
    });
  });

  // ─── Find by ID ──────────────────────────────────────────

  describe('findById', () => {
    it('should return a log by ID', async () => {
      mockPrisma.auditLog.findUnique.mockResolvedValue(baseMockLog);

      const result = await service.findById('log-1');

      expect(result).toEqual(baseMockLog);
      expect(mockPrisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-1' },
      });
    });

    it('should throw NotFoundException when log does not exist', async () => {
      mockPrisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Compliance report generation ────────────────────────

  describe('generateComplianceReport', () => {
    it('should generate a compliance report for a date range', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(42);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          action: AuditActionDto.API_PUBLISHED,
          userId: 'user-1',
          createdAt: new Date(),
        },
        {
          action: AuditActionDto.API_PUBLISHED,
          userId: 'user-2',
          createdAt: new Date(),
        },
        {
          action: AuditActionDto.USER_ROLE_CHANGED,
          userId: 'user-1',
          createdAt: new Date(),
        },
        {
          action: AuditActionDto.LOGIN_SUCCESS,
          userId: 'user-3',
          createdAt: new Date(),
        },
      ]);
      mockPrisma.auditLog.findFirst.mockResolvedValue({
        createdAt: new Date('2024-01-01'),
      });

      const result = await service.generateComplianceReport({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });

      expect(result.report).toBeDefined();
      expect(result.report.summary.totalRecords).toBe(42);
      expect(result.report.summary.uniqueUsers).toBe(3);
      expect(result.report.summary.actionBreakdown).toEqual({
        API_PUBLISHED: 2,
        USER_ROLE_CHANGED: 1,
        LOGIN_SUCCESS: 1,
      });
      expect(result.report.compliance.sfc).toBeDefined();
      expect(result.report.compliance.habeasData).toBeDefined();
      expect(result.report.compliance.gdpr).toBeDefined();
      expect(result.report.compliance.gdpr.immutabilityEnforced).toBe(true);
    });

    it('should throw BadRequestException when startDate >= endDate', async () => {
      await expect(
        service.generateComplianceReport({
          startDate: '2024-12-31T00:00:00Z',
          endDate: '2024-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle empty date range with zero records', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findFirst.mockResolvedValue(null);

      const result = await service.generateComplianceReport({
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      });

      expect(result.report.summary.totalRecords).toBe(0);
      expect(result.report.summary.uniqueUsers).toBe(0);
    });
  });

  // ─── Immutability verification ───────────────────────────

  describe('verifyImmutability', () => {
    it('should confirm UPDATE and DELETE are rejected', async () => {
      mockPrisma.auditLog.update.mockRejectedValue(
        new Error('Immutable record'),
      );
      mockPrisma.auditLog.delete.mockRejectedValue(
        new Error('Immutable record'),
      );

      const result = await service.verifyImmutability('log-1');

      expect(result.updateRejected).toBe(true);
      expect(result.deleteRejected).toBe(true);
    });

    it('should detect when UPDATE is not rejected', async () => {
      mockPrisma.auditLog.update.mockResolvedValue(baseMockLog);
      mockPrisma.auditLog.delete.mockRejectedValue(
        new Error('Immutable record'),
      );

      const result = await service.verifyImmutability('log-1');

      expect(result.updateRejected).toBe(false);
      expect(result.deleteRejected).toBe(true);
    });

    it('should detect when DELETE is not rejected', async () => {
      mockPrisma.auditLog.update.mockRejectedValue(
        new Error('Immutable record'),
      );
      mockPrisma.auditLog.delete.mockResolvedValue(baseMockLog);

      const result = await service.verifyImmutability('log-1');

      expect(result.updateRejected).toBe(true);
      expect(result.deleteRejected).toBe(false);
    });
  });
});
