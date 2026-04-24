import * as fc from 'fast-check';
import { SearchService } from '../search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

/**
 * Property-Based Test: Relevancia de Búsqueda
 *
 * **Validates: Requirements 1.5, 12.1**
 *
 * Propiedad 16: Para toda API en el Catálogo y para todo substring del nombre
 * de la API, al buscar por ese substring la API SHALL aparecer en los resultados
 * de búsqueda.
 */
describe('Property 16: Relevancia de Búsqueda', () => {
  let service: SearchService;

  // In-memory API store for the mock
  let apiStore: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    product: string;
    process: string;
    currentVersion: string;
    lifecycleState: string;
  }>;

  // Arbitraries
  const apiProductArb = fc.constantFrom(
    'VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY',
  );
  const apiProcessArb = fc.constantFrom(
    'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
    'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
  );
  const lifecycleStateArb = fc.constantFrom('DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET');

  const apiNameArb = fc.string({ minLength: 3, maxLength: 30 })
    .filter((s) => /^[a-zA-Z][a-zA-Z0-9 _-]+$/.test(s));

  beforeEach(() => {
    apiStore = [];
  });

  /**
   * Create a mock PrismaService that searches the in-memory apiStore
   * using the same case-insensitive contains logic as the real service.
   */
  function createMockPrisma() {
    return {
      api: {
        findMany: jest.fn().mockImplementation((args: any) => {
          let results = [...apiStore];

          if (args.where) {
            // Apply OR conditions (name/description contains)
            if (args.where.OR) {
              const orConditions = args.where.OR;
              results = results.filter((api) =>
                orConditions.some((cond: any) => {
                  if (cond.name?.contains) {
                    const search = cond.name.contains.toLowerCase();
                    return api.name.toLowerCase().includes(search);
                  }
                  if (cond.description?.contains) {
                    const search = cond.description.contains.toLowerCase();
                    return api.description.toLowerCase().includes(search);
                  }
                  return false;
                }),
              );
            }

            // Apply filters
            if (args.where.product) {
              results = results.filter((api) => api.product === args.where.product);
            }
            if (args.where.process) {
              results = results.filter((api) => api.process === args.where.process);
            }
            if (args.where.currentVersion) {
              results = results.filter(
                (api) => api.currentVersion === args.where.currentVersion,
              );
            }
            if (args.where.lifecycleState) {
              results = results.filter(
                (api) => api.lifecycleState === args.where.lifecycleState,
              );
            }
          }

          // Apply ordering
          results.sort((a, b) => a.name.localeCompare(b.name));

          // Apply pagination
          const skip = args.skip || 0;
          const take = args.take || 20;
          return Promise.resolve(results.slice(skip, skip + take));
        }),
        count: jest.fn().mockImplementation((args: any) => {
          let results = [...apiStore];

          if (args.where) {
            if (args.where.OR) {
              const orConditions = args.where.OR;
              results = results.filter((api) =>
                orConditions.some((cond: any) => {
                  if (cond.name?.contains) {
                    const search = cond.name.contains.toLowerCase();
                    return api.name.toLowerCase().includes(search);
                  }
                  if (cond.description?.contains) {
                    const search = cond.description.contains.toLowerCase();
                    return api.description.toLowerCase().includes(search);
                  }
                  return false;
                }),
              );
            }
            if (args.where.product) {
              results = results.filter((api) => api.product === args.where.product);
            }
            if (args.where.process) {
              results = results.filter((api) => api.process === args.where.process);
            }
            if (args.where.currentVersion) {
              results = results.filter(
                (api) => api.currentVersion === args.where.currentVersion,
              );
            }
            if (args.where.lifecycleState) {
              results = results.filter(
                (api) => api.lifecycleState === args.where.lifecycleState,
              );
            }
          }

          return Promise.resolve(results.length);
        }),
      },
    };
  }

  function createMockRedis() {
    const cache = new Map<string, string>();
    return {
      get: jest.fn().mockImplementation((key: string) => Promise.resolve(cache.get(key) || null)),
      set: jest.fn().mockImplementation((key: string, value: string) => {
        cache.set(key, value);
        return Promise.resolve('OK');
      }),
    };
  }

  it('para toda API y todo substring de su nombre, buscar por ese substring retorna la API en resultados', () => {
    /**
     * **Validates: Requirements 1.5, 12.1**
     *
     * For every API and every substring of its name, searching by that
     * substring returns the API in the results.
     */
    fc.assert(
      fc.asyncProperty(
        apiNameArb,
        apiProductArb,
        apiProcessArb,
        lifecycleStateArb,
        async (name, product, process, state) => {
          // Setup fresh store and service for each run
          apiStore = [];
          const mockPrisma = createMockPrisma();
          const mockRedis = createMockRedis();
          service = new SearchService(
            mockPrisma as unknown as PrismaService,
            mockRedis as unknown as RedisService,
          );

          // Add the API to the store
          const api = {
            id: `api-${Math.random().toString(36).slice(2)}`,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: `Descripción de ${name}`,
            product,
            process,
            currentVersion: '1.0.0',
            lifecycleState: state,
          };
          apiStore.push(api);

          // Test with every possible substring of the name (at least length 1)
          // To keep it efficient, test a few representative substrings
          const substrings: string[] = [];

          // Full name
          substrings.push(name);

          // First character(s)
          if (name.length >= 1) substrings.push(name.slice(0, 1));
          if (name.length >= 2) substrings.push(name.slice(0, 2));

          // Middle substring
          if (name.length >= 3) {
            const mid = Math.floor(name.length / 2);
            substrings.push(name.slice(mid - 1, mid + 2));
          }

          // Last characters
          if (name.length >= 2) substrings.push(name.slice(-2));

          for (const substring of substrings) {
            const result = await service.search({
              query: substring,
              limit: 100,
            });

            const found = result.data.some((item) => item.id === api.id);
            expect(found).toBe(true);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
