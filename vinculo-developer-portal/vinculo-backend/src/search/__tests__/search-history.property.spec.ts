import * as fc from 'fast-check';
import { SearchService } from '../search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

/**
 * Property-Based Test: Persistencia del Historial de Búsqueda
 *
 * **Validates: Requirements 12.5**
 *
 * Propiedad 18: Para todo usuario autenticado que ejecuta una búsqueda,
 * la consulta SHALL aparecer en su historial de búsquedas recientes con
 * el texto exacto de la consulta y la marca de tiempo.
 */
describe('Property 18: Persistencia del Historial de Búsqueda', () => {
  let service: SearchService;

  // In-memory search history store
  let historyStore: Array<{
    id: string;
    userId: string;
    query: string;
    filters: Record<string, unknown> | null;
    resultCount: number;
    createdAt: Date;
  }>;

  // Arbitraries
  const userIdArb = fc.uuid();
  const queryArb = fc.string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0 && /^[a-zA-Z0-9 áéíóúñÁÉÍÓÚÑ]+$/.test(s));
  const resultCountArb = fc.integer({ min: 0, max: 500 });

  function createMockPrisma() {
    return {
      searchHistory: {
        create: jest.fn().mockImplementation((args: { data: any }) => {
          const entry = {
            id: `history-${historyStore.length + 1}`,
            userId: args.data.userId,
            query: args.data.query,
            filters: args.data.filters || null,
            resultCount: args.data.resultCount || 0,
            createdAt: new Date(),
          };
          historyStore.push(entry);
          return Promise.resolve(entry);
        }),
        findMany: jest.fn().mockImplementation((args: any) => {
          let results = historyStore.filter((h) => h.userId === args.where.userId);
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (args.take) {
            results = results.slice(0, args.take);
          }
          return Promise.resolve(results);
        }),
      },
      api: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
  }

  function createMockRedis() {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };
  }

  beforeEach(() => {
    historyStore = [];
  });

  it('para todo usuario autenticado que ejecuta una búsqueda, la consulta aparece en su historial con texto exacto y timestamp', () => {
    /**
     * **Validates: Requirements 12.5**
     *
     * For every authenticated user search, the query appears in history
     * with exact text and timestamp.
     */
    fc.assert(
      fc.asyncProperty(
        userIdArb,
        queryArb,
        resultCountArb,
        async (userId, query, resultCount) => {
          // Setup fresh store and service
          historyStore = [];
          const mockPrisma = createMockPrisma();
          const mockRedis = createMockRedis();
          service = new SearchService(
            mockPrisma as unknown as PrismaService,
            mockRedis as unknown as RedisService,
          );

          const timeBefore = new Date();

          // Save search in history
          const saved = await service.saveHistory(userId, query, null, resultCount);

          const timeAfter = new Date();

          // Verify the saved entry
          expect(saved.userId).toBe(userId);
          expect(saved.query).toBe(query);
          expect(saved.resultCount).toBe(resultCount);
          expect(saved.createdAt).toBeDefined();
          expect(saved.createdAt.getTime()).toBeGreaterThanOrEqual(timeBefore.getTime());
          expect(saved.createdAt.getTime()).toBeLessThanOrEqual(timeAfter.getTime());

          // Retrieve history and verify the query appears
          const history = await service.getHistory(userId);

          expect(history.length).toBeGreaterThanOrEqual(1);

          const found = history.find(
            (h: { query: string; userId: string }) =>
              h.query === query && h.userId === userId,
          );
          expect(found).toBeDefined();
          expect(found!.query).toBe(query); // Exact text match
          expect(found!.createdAt).toBeDefined();
        },
      ),
      { numRuns: 50 },
    );
  });
});
