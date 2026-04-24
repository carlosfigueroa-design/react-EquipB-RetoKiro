import * as fc from 'fast-check';
import { GovernanceService } from '../governance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MigrationWindowDto } from '../dto/deprecate-api.dto';

/**
 * Property-Based Test: Cobertura de Notificación por Deprecación
 *
 * **Validates: Requirements 8.2**
 *
 * Propiedad 13: Para toda API con N aliados consumidores activos,
 * al ejecutar la acción de deprecación, el sistema SHALL crear
 * exactamente N notificaciones de tipo API_DEPRECATED, una por cada
 * aliado consumidor.
 */
describe('Property 13: Cobertura de Notificación por Deprecación', () => {
  it('al deprecar una API con N consumidores, se crean exactamente N notificaciones API_DEPRECATED', async () => {
    /**
     * **Validates: Requirements 8.2**
     *
     * For each generated number of consumers N (0..20), mock PrismaService
     * to return N consumers and verify that exactly N notification.create
     * calls are made with type API_DEPRECATED.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 20 }),
        async (numConsumers) => {
          // Track notification.create calls
          const notificationCreateCalls: any[] = [];

          // Generate N consumer records
          const consumers = Array.from({ length: numConsumers }, (_, i) => ({
            userId: `user-${i}`,
          }));

          // Mock PrismaService
          const mockPrisma = {
            api: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'api-test',
                name: 'Test API',
                slug: 'test-api',
                lifecycleState: 'ACTIVE',
                deprecatedAt: null,
                sunsetAt: null,
                migrationWindow: null,
              }),
              update: jest.fn().mockResolvedValue({
                id: 'api-test',
                name: 'Test API',
                lifecycleState: 'DEPRECATED',
              }),
            },
            apiConsumption: {
              findMany: jest.fn().mockResolvedValue(consumers),
            },
            notification: {
              create: jest.fn().mockImplementation((args) => {
                notificationCreateCalls.push(args);
                return Promise.resolve({ id: `notif-${notificationCreateCalls.length}` });
              }),
            },
          } as unknown as PrismaService;

          const service = new GovernanceService(mockPrisma);

          await service.deprecate('api-test', {
            migrationWindow: MigrationWindowDto.DAYS_30,
          });

          // Verify exactly N notifications were created
          expect(notificationCreateCalls).toHaveLength(numConsumers);

          // Verify each notification is of type API_DEPRECATED
          for (const call of notificationCreateCalls) {
            expect(call.data.type).toBe('API_DEPRECATED');
          }

          // Verify each consumer got exactly one notification
          const notifiedUserIds = notificationCreateCalls.map(
            (call) => call.data.userId,
          );
          const expectedUserIds = consumers.map((c) => c.userId);
          expect(notifiedUserIds.sort()).toEqual(expectedUserIds.sort());
        },
      ),
      { numRuns: 50 },
    );
  });
});
