import * as fc from 'fast-check';
import { AuditService } from '../audit.service';
import { AuditActionDto } from '../dto/create-audit-log.dto';
import { AuditFilterDto } from '../dto/audit-filter.dto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Property 11: Correctitud de Filtros del Log de Auditoría
 *
 * For every filter combination, all returned records satisfy each filter simultaneously.
 *
 * **Validates: Requirement 14.3**
 *
 * Runs 50 iterations.
 */
describe('Property 11: Correctitud de Filtros del Log', () => {
  // Generate a set of audit log records
  const auditActionValues = Object.values(AuditActionDto);
  const resourceValues = ['Api', 'User', 'ApiVersion'];
  const userIds = ['user-1', 'user-2', 'user-3', 'user-4'];

  const auditLogRecordArb = fc.record({
    id: fc.uuid(),
    userId: fc.constantFrom(...userIds),
    action: fc.constantFrom(...auditActionValues),
    resource: fc.constantFrom(...resourceValues),
    resourceId: fc.option(fc.uuid(), { nil: null }),
    metadata: fc.constant(null),
    ipAddress: fc.ipV4(),
    userAgent: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
    createdAt: fc.date({
      min: new Date('2024-01-01'),
      max: new Date('2025-12-31'),
    }),
  });

  // Generate a set of records
  const auditLogSetArb = fc.array(auditLogRecordArb, {
    minLength: 1,
    maxLength: 30,
  });

  // Generate filter combinations
  const filterArb = fc.record({
    userId: fc.option(fc.constantFrom(...userIds), { nil: undefined }),
    action: fc.option(fc.constantFrom(...auditActionValues) as fc.Arbitrary<AuditActionDto>, { nil: undefined }),
    resource: fc.option(fc.constantFrom(...resourceValues), { nil: undefined }),
    useStartDate: fc.boolean(),
    useEndDate: fc.boolean(),
  });

  it('should return only records that satisfy all applied filters simultaneously', () => {
    fc.assert(
      fc.asyncProperty(
        auditLogSetArb,
        filterArb,
        async (records, filterConfig) => {
          // Build the filter DTO
          const filters: AuditFilterDto = {};

          if (filterConfig.userId !== undefined) {
            filters.userId = filterConfig.userId;
          }
          if (filterConfig.action !== undefined) {
            filters.action = filterConfig.action;
          }
          if (filterConfig.resource !== undefined) {
            filters.resource = filterConfig.resource;
          }

          // Use a fixed date range that covers the generated records
          if (filterConfig.useStartDate) {
            filters.startDate = '2024-06-01T00:00:00.000Z';
          }
          if (filterConfig.useEndDate) {
            filters.endDate = '2025-06-01T00:00:00.000Z';
          }

          // Manually filter records to get expected results
          const expectedRecords = records.filter((r) => {
            if (filters.userId && r.userId !== filters.userId) return false;
            if (filters.action && r.action !== filters.action) return false;
            if (filters.resource && r.resource !== filters.resource) return false;
            if (filters.startDate && r.createdAt < new Date(filters.startDate))
              return false;
            if (filters.endDate && r.createdAt > new Date(filters.endDate))
              return false;
            return true;
          });

          // Sort by createdAt desc (matching service behavior)
          expectedRecords.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );

          // Mock Prisma to filter records in-memory (simulating DB behavior)
          const mockPrisma = {
            auditLog: {
              findMany: jest.fn().mockImplementation((args: any) => {
                let filtered = [...records];

                const where = args?.where ?? {};

                if (where.userId) {
                  filtered = filtered.filter((r) => r.userId === where.userId);
                }
                if (where.action) {
                  filtered = filtered.filter((r) => r.action === where.action);
                }
                if (where.resource) {
                  filtered = filtered.filter(
                    (r) => r.resource === where.resource,
                  );
                }
                if (where.createdAt) {
                  if (where.createdAt.gte) {
                    filtered = filtered.filter(
                      (r) => r.createdAt >= where.createdAt.gte,
                    );
                  }
                  if (where.createdAt.lte) {
                    filtered = filtered.filter(
                      (r) => r.createdAt <= where.createdAt.lte,
                    );
                  }
                }

                // Sort by createdAt desc
                filtered.sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
                );

                // Apply take
                const take = args?.take ?? 21;
                return Promise.resolve(filtered.slice(0, take));
              }),
            },
          };

          const service = new AuditService(
            mockPrisma as unknown as PrismaService,
          );

          const result = await service.findAll(filters);

          // Verify: every returned record satisfies ALL applied filters
          for (const record of result.data) {
            if (filters.userId) {
              expect(record.userId).toBe(filters.userId);
            }
            if (filters.action) {
              expect(record.action).toBe(filters.action);
            }
            if (filters.resource) {
              expect(record.resource).toBe(filters.resource);
            }
            if (filters.startDate) {
              expect(record.createdAt.getTime()).toBeGreaterThanOrEqual(
                new Date(filters.startDate).getTime(),
              );
            }
            if (filters.endDate) {
              expect(record.createdAt.getTime()).toBeLessThanOrEqual(
                new Date(filters.endDate).getTime(),
              );
            }
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
