import * as fc from 'fast-check';
import { AuditService } from '../audit.service';
import { AuditActionDto } from '../dto/create-audit-log.dto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Property 10: Inmutabilidad del Log de Auditoría
 *
 * For every existing log record, UPDATE and DELETE are rejected.
 * This tests the mock behavior — the real trigger is in PostgreSQL.
 *
 * **Validates: Requirement 14.4**
 *
 * Runs 50 iterations.
 */
describe('Property 10: Inmutabilidad del Log', () => {
  let service: AuditService;
  let mockPrisma: {
    auditLog: {
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  // Arbitrary for existing audit log records
  const existingLogArb = fc.record({
    id: fc.uuid(),
    userId: fc.uuid(),
    action: fc.constantFrom(...Object.values(AuditActionDto)),
    resource: fc.constantFrom('Api', 'User', 'ApiVersion'),
    resourceId: fc.option(fc.uuid(), { nil: null }),
    metadata: fc.constant(null),
    ipAddress: fc.ipV4(),
    userAgent: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
    createdAt: fc.date({
      min: new Date('2024-01-01'),
      max: new Date('2025-12-31'),
    }),
  });

  beforeEach(() => {
    // Simulate PostgreSQL trigger behavior: reject UPDATE and DELETE
    mockPrisma = {
      auditLog: {
        update: jest.fn().mockRejectedValue(
          new Error(
            'Los registros de auditoría son inmutables. No se permite UPDATE ni DELETE.',
          ),
        ),
        delete: jest.fn().mockRejectedValue(
          new Error(
            'Los registros de auditoría son inmutables. No se permite UPDATE ni DELETE.',
          ),
        ),
      },
    };

    service = new AuditService(mockPrisma as unknown as PrismaService);
  });

  it('should reject UPDATE and DELETE for every existing log record', () => {
    fc.assert(
      fc.asyncProperty(existingLogArb, async (log) => {
        const result = await service.verifyImmutability(log.id);

        // Both UPDATE and DELETE must be rejected
        expect(result.updateRejected).toBe(true);
        expect(result.deleteRejected).toBe(true);

        // Verify that update was attempted with the correct ID
        expect(mockPrisma.auditLog.update).toHaveBeenCalledWith({
          where: { id: log.id },
          data: { resource: 'MODIFIED' },
        });

        // Verify that delete was attempted with the correct ID
        expect(mockPrisma.auditLog.delete).toHaveBeenCalledWith({
          where: { id: log.id },
        });
      }),
      { numRuns: 50 },
    );
  });
});
