import * as fc from 'fast-check';
import { SearchService } from '../search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

/**
 * Property-Based Test: Correctitud de Filtros del Catálogo
 *
 * **Validates: Requirements 3.1, 12.3**
 *
 * Propiedad 17: Para toda combinación de filtros (producto, proceso, versión,
 * estado), todos los resultados retornados SHALL cumplir con cada filtro
 * aplicado simultáneamente, y ningún resultado que no cumpla con todos los
 * filtros SHALL ser incluido.
 */
describe('Property 17: Correctitud de Filtros del Catálogo', () => {
  let service: SearchService;

  // In-memory API store
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
  const products = ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'] as const;
  const processes = [
    'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
    'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
  ] as const;
  const states = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET'] as const;
  const versions = ['1.0.0', '1.1.0', '2.0.0', '3.0.0'] as const;

  const apiProductArb = fc.constantFrom(...products);
  const apiProcessArb = fc.constantFrom(...processes);
  const lifecycleStateArb = fc.constantFrom(...states);
  const versionArb = fc.constantFrom(...versions);

  const apiNameArb = fc.string({ minLength: 3, maxLength: 20 })
    .filter((s) => /^[a-zA-Z][a-zA-Z0-9 ]+$/.test(s));

  // Generate a set of APIs
  const apiSetArb = fc.array(
    fc.tuple(apiNameArb, apiProductArb, apiProcessArb, lifecycleStateArb, versionArb),
    { minLength: 3, maxLength: 15 },
  );

  // Generate optional filter combination
  const filterArb = fc.record({
    product: fc.option(apiProductArb, { nil: undefined }),
    process: fc.option(apiProcessArb, { nil: undefined }),
    state: fc.option(lifecycleStateArb, { nil: undefined }),
    version: fc.option(versionArb, { nil: undefined }),
  });

  function createMockPrisma() {
    return {
      api: {
        findMany: jest.fn().mockImplementation((args: any) => {
          let results = [...apiStore];

          if (args.where) {
            if (args.where.OR) {
              const orConditions = args.where.OR;
              results = results.filter((api) =>
                orConditions.some((cond: any) => {
                  if (cond.name?.contains) {
                    return api.name.toLowerCase().includes(cond.name.contains.toLowerCase());
                  }
                  if (cond.description?.contains) {
                    return api.description.toLowerCase().includes(cond.description.contains.toLowerCase());
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
              results = results.filter((api) => api.currentVersion === args.where.currentVersion);
            }
            if (args.where.lifecycleState) {
              results = results.filter((api) => api.lifecycleState === args.where.lifecycleState);
            }
          }

          results.sort((a, b) => a.name.localeCompare(b.name));
          const skip = args.skip || 0;
          const take = args.take || 100;
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
                    return api.name.toLowerCase().includes(cond.name.contains.toLowerCase());
                  }
                  if (cond.description?.contains) {
                    return api.description.toLowerCase().includes(cond.description.contains.toLowerCase());
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
              results = results.filter((api) => api.currentVersion === args.where.currentVersion);
            }
            if (args.where.lifecycleState) {
              results = results.filter((api) => api.lifecycleState === args.where.lifecycleState);
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

  it('para toda combinación de filtros, todos los resultados cumplen cada filtro y ningún no-matching es incluido', () => {
    /**
     * **Validates: Requirements 3.1, 12.3**
     *
     * For every filter combination, all results satisfy each filter
     * and no non-matching result is included.
     */
    fc.assert(
      fc.asyncProperty(
        apiSetArb,
        filterArb,
        async (apiTuples, filters) => {
          // Setup fresh store
          apiStore = apiTuples.map(([name, product, process, state, version], i) => ({
            id: `api-${i}`,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-') + `-${i}`,
            description: `Descripción de ${name}`,
            product,
            process,
            currentVersion: version,
            lifecycleState: state,
          }));

          const mockPrisma = createMockPrisma();
          const mockRedis = createMockRedis();
          service = new SearchService(
            mockPrisma as unknown as PrismaService,
            mockRedis as unknown as RedisService,
          );

          // Pick a query that matches at least some APIs — use a common letter
          const query = 'a';

          const result = await service.search({
            query,
            product: filters.product,
            process: filters.process,
            state: filters.state,
            version: filters.version,
            limit: 100,
          });

          // Verify: every returned result satisfies ALL applied filters
          for (const item of result.data) {
            if (filters.product) {
              expect(item.product).toBe(filters.product);
            }
            if (filters.process) {
              expect(item.process).toBe(filters.process);
            }
            if (filters.state) {
              expect(item.lifecycleState).toBe(filters.state);
            }
            if (filters.version) {
              expect(item.currentVersion).toBe(filters.version);
            }
          }

          // Verify: no API that matches the query AND all filters is excluded
          const expectedMatches = apiStore.filter((api) => {
            // Must match query (case-insensitive contains on name or description)
            const queryLower = query.toLowerCase();
            const matchesQuery =
              api.name.toLowerCase().includes(queryLower) ||
              api.description.toLowerCase().includes(queryLower);
            if (!matchesQuery) return false;

            // Must match all filters
            if (filters.product && api.product !== filters.product) return false;
            if (filters.process && api.process !== filters.process) return false;
            if (filters.state && api.lifecycleState !== filters.state) return false;
            if (filters.version && api.currentVersion !== filters.version) return false;

            return true;
          });

          // All expected matches should be in results (within pagination limit)
          const resultIds = new Set(result.data.map((item) => item.id));
          for (const expected of expectedMatches.slice(0, 100)) {
            expect(resultIds.has(expected.id)).toBe(true);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
