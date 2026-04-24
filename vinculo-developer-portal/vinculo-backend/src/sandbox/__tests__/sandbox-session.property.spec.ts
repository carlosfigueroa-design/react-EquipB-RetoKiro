import * as fc from 'fast-check';
import { SandboxService } from '../sandbox.service';
import { MockEngineService } from '../mock-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Property-Based Test: Registro de Sesiones de Sandbox
 *
 * **Validates: Requirements 4.5**
 *
 * Propiedad 20: Para toda ejecución en el Motor_Sandbox, el sistema SHALL
 * persistir un registro que contenga: request body completo, response body
 * completo, trace ID único, latencia en milisegundos, y referencia al API
 * y endpoint ejecutados.
 */
describe('Property 20: Registro de Sesiones de Sandbox', () => {
  let service: SandboxService;
  let mockEngine: MockEngineService;
  let createdSessions: Array<Record<string, unknown>>;

  // Arbitraries for generating sandbox requests
  const apiIdArb = fc.uuid();
  const endpointArb = fc.constantFrom(
    '/cotizacion',
    '/poliza',
    '/siniestro',
    '/validacion',
    '/consulta',
  );
  const methodArb = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
  const bodyArb = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.integer({ min: 0, max: 1000000 }),
      fc.boolean(),
    ),
    { minKeys: 0, maxKeys: 5 },
  );
  const userIdArb = fc.option(fc.uuid(), { nil: undefined });

  beforeEach(() => {
    createdSessions = [];
    mockEngine = new MockEngineService();

    // Mock PrismaService to capture created sessions in memory
    const mockPrisma = {
      sandboxSession: {
        create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => {
          const session = {
            id: `session-${createdSessions.length + 1}`,
            ...args.data,
            createdAt: new Date(),
          };
          createdSessions.push(session);
          return Promise.resolve(session);
        }),
      },
    };

    service = new SandboxService(
      mockPrisma as unknown as PrismaService,
      mockEngine,
    );
  });

  it('persiste request body, response body, trace ID único, latencia en ms, y referencia a API/endpoint para toda ejecución', () => {
    /**
     * **Validates: Requirements 4.5**
     *
     * For every sandbox execution, verify that the persisted session contains:
     * - request body (complete)
     * - response body (complete)
     * - unique trace ID
     * - latency in milliseconds
     * - API and endpoint reference
     */
    const traceIds = new Set<string>();

    fc.assert(
      fc.asyncProperty(
        apiIdArb,
        endpointArb,
        methodArb,
        bodyArb,
        userIdArb,
        async (apiId, endpoint, method, body, userId) => {
          const sessionsBefore = createdSessions.length;

          const result = await service.execute(
            { apiId, endpoint, method, body },
            userId,
          );

          // 1. A session was persisted
          expect(createdSessions.length).toBe(sessionsBefore + 1);
          const persisted = createdSessions[createdSessions.length - 1];

          // 2. Request body is persisted completely
          expect(persisted.requestBody).toEqual(body);

          // 3. Response body is persisted and non-null
          expect(persisted.responseBody).toBeDefined();
          expect(persisted.responseBody).not.toBeNull();
          expect(typeof persisted.responseBody).toBe('object');

          // 4. Trace ID is unique
          expect(result.traceId).toBeDefined();
          expect(typeof result.traceId).toBe('string');
          expect(result.traceId.length).toBeGreaterThan(0);
          expect(traceIds.has(result.traceId)).toBe(false);
          traceIds.add(result.traceId);
          expect(persisted.traceId).toBe(result.traceId);

          // 5. Latency is a positive integer in milliseconds
          expect(persisted.latencyMs).toBeDefined();
          expect(typeof persisted.latencyMs).toBe('number');
          expect(persisted.latencyMs).toBeGreaterThanOrEqual(0);

          // 6. API and endpoint references are correct
          expect(persisted.apiId).toBe(apiId);
          expect(persisted.endpoint).toBe(endpoint);
          expect(persisted.method).toBe(method);

          // 7. Demo mode flag matches userId presence
          expect(persisted.isDemo).toBe(!userId);
        },
      ),
      { numRuns: 50 },
    );
  });
});
