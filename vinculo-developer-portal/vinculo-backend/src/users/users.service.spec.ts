import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActionDto } from '../audit/dto/create-audit-log.dto';

/**
 * Unit tests for UsersService.
 *
 * Tests: list users with filters, role change with audit log,
 * status change with audit log, RBAC restrictions, error cases.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let mockAuditService: {
    log: jest.Mock;
  };

  const baseMockUser = {
    id: 'user-1',
    email: 'aliado@example.com',
    name: 'Juan Pérez',
    company: 'Fintech Colombia',
    role: 'EXTERNO',
    status: 'ACTIVE',
    lastLoginAt: new Date('2024-06-15T10:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-15T10:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    service = new UsersService(
      mockPrisma as unknown as PrismaService,
      mockAuditService as unknown as AuditService,
    );
  });

  // ─── List users with filters ─────────────────────────────

  describe('findAll', () => {
    it('should list users with default pagination', async () => {
      const users = [baseMockUser];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll({});

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(result.data).toEqual(users);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.count).toBe(1);
    });

    it('should filter users by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll({ role: 'ADMIN' });

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.role).toBe('ADMIN');
    });

    it('should filter users by status', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'BLOCKED' });

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.status).toBe('BLOCKED');
    });

    it('should filter users by search term (name/email/company)', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll({ search: 'fintech' });

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('should support cursor-based pagination', async () => {
      // Return take+1 items to indicate there's a next page
      const manyUsers = Array.from({ length: 21 }, (_, i) => ({
        ...baseMockUser,
        id: `user-${i}`,
      }));
      mockPrisma.user.findMany.mockResolvedValue(manyUsers);

      const result = await service.findAll({ take: 20 });

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.nextCursor).toBe('user-19');
      expect(result.data).toHaveLength(20);
    });

    it('should cap page size at MAX_PAGE_SIZE', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll({ take: 500 });

      const callArgs = mockPrisma.user.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(UsersService.MAX_PAGE_SIZE + 1);
    });
  });

  // ─── User detail ─────────────────────────────────────────

  describe('findById', () => {
    it('should return user detail by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseMockUser);

      const result = await service.findById('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          email: true,
          role: true,
          status: true,
          lastLoginAt: true,
        }),
      });
      expect(result).toEqual(baseMockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Role change with audit log ──────────────────────────

  describe('changeRole', () => {
    it('should change user role and log to audit', async () => {
      const user = { ...baseMockUser, role: 'EXTERNO' };
      const updatedUser = { ...user, role: 'LIDER_TECNICO' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.changeRole(
        'user-1',
        'LIDER_TECNICO',
        'admin-1',
      );

      expect(result.role).toBe('LIDER_TECNICO');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'LIDER_TECNICO' },
      });

      // Verify audit log was created
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          action: AuditActionDto.USER_ROLE_CHANGED,
          resource: 'User',
          resourceId: 'user-1',
          metadata: expect.objectContaining({
            previousRole: 'EXTERNO',
            newRole: 'LIDER_TECNICO',
            affectedUserId: 'user-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeRole('nonexistent', 'ADMIN', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when role is the same', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseMockUser);

      await expect(
        service.changeRole('user-1', 'EXTERNO', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changeRole('user-1', 'EXTERNO', 'admin-1'),
      ).rejects.toThrow(/ya tiene el rol/);
    });

    it('should include admin ID in audit log metadata', async () => {
      const user = { ...baseMockUser, role: 'EXTERNO' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, role: 'ADMIN' });

      await service.changeRole('user-1', 'ADMIN', 'admin-99');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-99',
        }),
      );
    });
  });

  // ─── Status change with audit log ────────────────────────

  describe('changeStatus', () => {
    it('should change user status and log to audit', async () => {
      const user = { ...baseMockUser, status: 'ACTIVE' };
      const updatedUser = { ...user, status: 'BLOCKED' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.changeStatus(
        'user-1',
        'BLOCKED',
        'admin-1',
      );

      expect(result.status).toBe('BLOCKED');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'BLOCKED' },
      });

      // Verify audit log was created
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          action: AuditActionDto.USER_STATUS_CHANGED,
          resource: 'User',
          resourceId: 'user-1',
          metadata: expect.objectContaining({
            previousStatus: 'ACTIVE',
            newStatus: 'BLOCKED',
            affectedUserId: 'user-1',
          }),
        }),
      );
    });

    it('should activate a blocked user', async () => {
      const user = { ...baseMockUser, status: 'BLOCKED' };
      const updatedUser = { ...user, status: 'ACTIVE' };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.changeStatus(
        'user-1',
        'ACTIVE',
        'admin-1',
      );

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeStatus('nonexistent', 'BLOCKED', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when status is the same', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseMockUser);

      await expect(
        service.changeStatus('user-1', 'ACTIVE', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changeStatus('user-1', 'ACTIVE', 'admin-1'),
      ).rejects.toThrow(/ya tiene el estado/);
    });

    it('should include timestamp in audit log metadata', async () => {
      const user = { ...baseMockUser, status: 'ACTIVE' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        status: 'INACTIVE',
      });

      await service.changeStatus('user-1', 'INACTIVE', 'admin-1');

      const auditCall = mockAuditService.log.mock.calls[0][0];
      expect(auditCall.metadata.timestamp).toBeDefined();
      expect(typeof auditCall.metadata.timestamp).toBe('string');
    });
  });
});
