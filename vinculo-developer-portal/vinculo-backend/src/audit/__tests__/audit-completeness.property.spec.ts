import * as fc from 'fast-check';
import { AuditService } from '../audit.service';
import { AuditActionDto, CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Property 9: Completitud y Creación de Logs de Auditoría
 *
 * For every admin action, verify the log contains userId, action, resource,
 * resourceId, timestamp (createdAt), and IP.
 *
 * **Validates: Requirements 6.6, 8.4, 11.3, 13.3, 14.1**
 *
 * Runs 100 iterations.
 */
describe('Property 9: Completitud y Creación de Logs', () => {
  let service: AuditService;
  let mockPrisma: {
    auditLog: {
      create: jest.Mock;
    };
  };

  // Arbitrary for AuditAction enum values
  const auditActionArb = fc.constantFrom(
    ...Object.values(AuditActionDto),
  );

  // Arbitrary for admin actions specifically
  const adminActionArb = fc.constantFrom(
    AuditActionDto.API_PUBLISHED,
    AuditActionDto.API_DEPRECATED,
    AuditActionDto.API_SUNSET,
    AuditActionDto.API_REACTIVATED,
    AuditActionDto.USER_ROLE_CHANGED,
    AuditActionDto.USER_STATUS_CHANGED,
    AuditActionDto.API_SPEC_UPLOADED,
    AuditActionDto.API_DOCS_GENERATED,
    AuditActionDto.API_CREATED,
    AuditActionDto.API_UPDATED,
  );

  // Arbitrary for a complete audit log entry
  const auditEntryArb = fc.record({
    userId: fc.uuid(),
    action: adminActionArb,
    resource: fc.constantFrom('Api', 'User', 'ApiVersion'),
    resourceId: fc.option(fc.uuid(), { nil: undefined }),
    metadata: fc.option(
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.oneof(fc.string(), fc.integer(), fc.boolean()),
      ),
      { nil: undefined },
    ),
    ipAddress: fc.ipV4(),
    userAgent: fc.option(
      fc.string({ minLength: 5, maxLength: 100 }),
      { nil: undefined },
    ),
  }) as fc.Arbitrary<CreateAuditLogDto>;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
      },
    };

    // Mock create to return the data with an id and createdAt
    mockPrisma.auditLog.create.mockImplementation((args: { data: Record<string, unknown> }) => {
      return Promise.resolve({
        id: 'generated-uuid',
        ...args.data,
        createdAt: new Date(),
      });
    });

    service = new AuditService(mockPrisma as unknown as PrismaService);
  });

  it('should create a log with all required fields for every admin action', () => {
    fc.assert(
      fc.asyncProperty(auditEntryArb, async (entry) => {
        const result = await service.log(entry);

        // Verify all required fields are present
        expect(result).toHaveProperty('id');
        expect(result.userId).toBe(entry.userId);
        expect(result.action).toBe(entry.action);
        expect(result.resource).toBe(entry.resource);
        expect(result).toHaveProperty('createdAt');
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.ipAddress).toBe(entry.ipAddress);

        // Verify resourceId is preserved (null or value)
        if (entry.resourceId) {
          expect(result.resourceId).toBe(entry.resourceId);
        } else {
          expect(result.resourceId).toBeNull();
        }

        // Verify Prisma create was called with correct data
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: entry.userId,
            action: entry.action,
            resource: entry.resource,
            ipAddress: entry.ipAddress,
          }),
        });
      }),
      { numRuns: 100 },
    );
  });
});
