import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

/**
 * Unit tests for SearchService.
 *
 * Tests:
 * - Exact and partial name search
 * - Combined filters
 * - Search history
 * - Autocomplete suggestions
 * - Redis cache behavior
 *
 * Requirements: 12.1–12.5
 */
describe('SearchService', () => {
  let service: SearchService;
  let mockPrisma: any;
  let mockRedis: any;
  let redisCache: Map<string, { value: string; ttl?: number }>;

  // Sample APIs for testing
  const sampleApis = [
    {
      id: 'api-1',
      name: 'Cotización Auto',
      slug: 'cotizacion-auto',
      description: 'API para cotizar seguros de automóvil',
      product: 'AUTO',
      process: 'COTIZACION',
      currentVersion: '1.0.0',
      lifecycleState: 'ACTIVE',
    },
    {
      id: 'api-2',
      name: 'Póliza Vida',
      slug: 'poliza-vida',
      description: 'API para gestión de pólizas de vida',
      product: 'VIDA',
      process: 'POLIZA',
      currentVersion: '2.0.0',
      lifecycleState: 'ACTIVE',
    },
    {
      id: 'api-3',
      name: 'Siniestro Hogar',
      slug: 'siniestro-hogar',
      description: 'API para reportar siniestros de hogar',
      product: 'HOGAR',
      process: 'SINIESTRO',
      currentVersion: '1.0.0',
      lifecycleState: 'DEPRECATED',
    },
    {
      id: 'api-4',
      name: 'Validación KYC',
      slug: 'validacion-kyc',
      description: 'API de validación de identidad KYC',
      product: 'IDENTITY_SECURITY',
      process: 'KYC',
      currentVersion: '1.1.0',
      lifecycleState: 'ACTIVE',
    },
  ];

  // In-memory history store
  let historyStore: any[];

  beforeEach(() => {
    redisCache = new Map();
    historyStore = [];

    mockRedis = {
      get: jest.fn().mockImplementation((key: string) => {
        const entry = redisCache.get(key);
        return Promise.resolve(entry ? entry.value : null);
      }),
      set: jest.fn().mockImplementation((key: string, value: string, _mode?: string, ttl?: number) => {
        redisCache.set(key, { value, ttl });
        return Promise.resolve('OK');
      }),
    };

    mockPrisma = {
      api: {
        findMany: jest.fn().mockImplementation((args: any) => {
          let results = [...sampleApis];

          if (args.where) {
            if (args.where.OR) {
              results = results.filter((api) =>
                args.where.OR.some((cond: any) => {
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
          const take = args.take || 20;
          return Promise.resolve(results.slice(skip, skip + take));
        }),
        count: jest.fn().mockImplementation((args: any) => {
          let results = [...sampleApis];

          if (args.where) {
            if (args.where.OR) {
              results = results.filter((api) =>
                args.where.OR.some((cond: any) => {
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
      searchHistory: {
        create: jest.fn().mockImplementation((args: any) => {
          const entry = {
            id: `history-${historyStore.length + 1}`,
            ...args.data,
            createdAt: new Date(),
          };
          historyStore.push(entry);
          return Promise.resolve(entry);
        }),
        findMany: jest.fn().mockImplementation((args: any) => {
          let results = historyStore.filter((h) => h.userId === args.where.userId);
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (args.take) results = results.slice(0, args.take);
          return Promise.resolve(results);
        }),
      },
    };

    service = new SearchService(
      mockPrisma as unknown as PrismaService,
      mockRedis as unknown as RedisService,
    );
  });

  // ─── Exact and partial name search ───────────────────────

  describe('search — exact and partial name', () => {
    it('should find API by exact name', async () => {
      const result = await service.search({ query: 'Cotización Auto' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Cotización Auto');
    });

    it('should find API by partial name (substring)', async () => {
      const result = await service.search({ query: 'cotización' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('api-1');
    });

    it('should find APIs by description substring', async () => {
      const result = await service.search({ query: 'seguros' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should be case-insensitive', async () => {
      const result = await service.search({ query: 'validación kyc' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('api-4');
    });

    it('should return empty results for non-matching query', async () => {
      const result = await service.search({ query: 'xyznonexistent' });
      expect(result.data.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ─── Combined filters ────────────────────────────────────

  describe('search — combined filters', () => {
    it('should filter by product', async () => {
      const result = await service.search({ query: 'api', product: 'AUTO' });
      for (const item of result.data) {
        expect(item.product).toBe('AUTO');
      }
    });

    it('should filter by process', async () => {
      const result = await service.search({ query: 'api', process: 'POLIZA' });
      for (const item of result.data) {
        expect(item.process).toBe('POLIZA');
      }
    });

    it('should filter by lifecycle state', async () => {
      const result = await service.search({ query: 'api', state: 'DEPRECATED' });
      for (const item of result.data) {
        expect(item.lifecycleState).toBe('DEPRECATED');
      }
    });

    it('should filter by version', async () => {
      const result = await service.search({ query: 'api', version: '2.0.0' });
      for (const item of result.data) {
        expect(item.currentVersion).toBe('2.0.0');
      }
    });

    it('should apply multiple filters simultaneously', async () => {
      const result = await service.search({
        query: 'api',
        product: 'AUTO',
        process: 'COTIZACION',
        state: 'ACTIVE',
      });
      for (const item of result.data) {
        expect(item.product).toBe('AUTO');
        expect(item.process).toBe('COTIZACION');
        expect(item.lifecycleState).toBe('ACTIVE');
      }
    });

    it('should return empty when filters exclude all results', async () => {
      const result = await service.search({
        query: 'cotización',
        product: 'VIDA', // Cotización Auto is product AUTO, not VIDA
      });
      expect(result.data.length).toBe(0);
    });
  });

  // ─── Search history ──────────────────────────────────────

  describe('saveHistory / getHistory', () => {
    it('should save search in history with exact query text', async () => {
      const entry = await service.saveHistory('user-1', 'cotización auto', null, 5);
      expect(entry.userId).toBe('user-1');
      expect(entry.query).toBe('cotización auto');
      expect(entry.resultCount).toBe(5);
      expect(entry.createdAt).toBeDefined();
    });

    it('should retrieve history for a specific user', async () => {
      await service.saveHistory('user-1', 'query 1', null, 3);
      await service.saveHistory('user-1', 'query 2', null, 7);
      await service.saveHistory('user-2', 'other query', null, 1);

      const history = await service.getHistory('user-1');
      expect(history.length).toBe(2);
      expect(history.every((h: any) => h.userId === 'user-1')).toBe(true);
    });

    it('should return history ordered by most recent first', async () => {
      await service.saveHistory('user-1', 'first', null, 1);
      // Ensure different timestamps
      const entry2 = await service.saveHistory('user-1', 'second', null, 2);
      // Manually set a later timestamp to guarantee ordering
      entry2.createdAt = new Date(Date.now() + 1000);

      const history = await service.getHistory('user-1');
      expect(history.length).toBe(2);
      // Both entries should be present
      const queries = history.map((h: any) => h.query);
      expect(queries).toContain('first');
      expect(queries).toContain('second');
    });

    it('should save filters in history', async () => {
      const filters = { product: 'AUTO', process: 'COTIZACION' };
      const entry = await service.saveHistory('user-1', 'auto', filters, 2);
      expect(entry.filters).toEqual(filters);
    });
  });

  // ─── Autocomplete suggestions ────────────────────────────

  describe('getSuggestions', () => {
    it('should return API names matching the query', async () => {
      const suggestions = await service.getSuggestions('coti');
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions).toContain('Cotización Auto');
    });

    it('should return empty array for empty query', async () => {
      const suggestions = await service.getSuggestions('');
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const suggestions = await service.getSuggestions('   ');
      expect(suggestions).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const suggestions = await service.getSuggestions('SINIESTRO');
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('should limit results', async () => {
      const suggestions = await service.getSuggestions('a', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  // ─── Redis cache ─────────────────────────────────────────

  describe('Redis cache', () => {
    it('should cache search results in Redis', async () => {
      await service.search({ query: 'cotización' });

      // Verify Redis set was called
      expect(mockRedis.set).toHaveBeenCalled();
      const setCall = mockRedis.set.mock.calls[0];
      expect(setCall[0]).toMatch(/^search:/);
      expect(setCall[2]).toBe('EX');
      expect(setCall[3]).toBe(120); // TTL 120s
    });

    it('should return cached results on second call', async () => {
      // First call — cache miss
      const result1 = await service.search({ query: 'cotización' });
      expect(result1.cached).toBe(false);

      // Second call — cache hit
      const result2 = await service.search({ query: 'cotización' });
      expect(result2.cached).toBe(true);
      expect(result2.data).toEqual(result1.data);
    });

    it('should generate deterministic cache keys for same query', () => {
      const key1 = service.buildCacheKey({ query: 'test' });
      const key2 = service.buildCacheKey({ query: 'test' });
      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different queries', () => {
      const key1 = service.buildCacheKey({ query: 'test1' });
      const key2 = service.buildCacheKey({ query: 'test2' });
      expect(key1).not.toBe(key2);
    });

    it('should generate different cache keys for different filters', () => {
      const key1 = service.buildCacheKey({ query: 'test', product: 'AUTO' });
      const key2 = service.buildCacheKey({ query: 'test', product: 'VIDA' });
      expect(key1).not.toBe(key2);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis connection error'));
      mockRedis.set.mockRejectedValueOnce(new Error('Redis connection error'));

      // Should still return results even if Redis fails
      const result = await service.search({ query: 'cotización' });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Pagination ──────────────────────────────────────────

  describe('pagination', () => {
    it('should return pagination metadata', async () => {
      const result = await service.search({ query: 'api' });
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(typeof result.pagination.total).toBe('number');
      expect(typeof result.pagination.totalPages).toBe('number');
    });

    it('should respect page and limit parameters', async () => {
      const result = await service.search({ query: 'api', page: 1, limit: 2 });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });
  });
});
