import { SandboxService } from './sandbox.service';
import { MockEngineService } from './mock-engine.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit tests for SandboxService.
 *
 * Tests: demo mode execution, authenticated execution with personalized data,
 * error scenario simulation, execution history, trace ID uniqueness.
 *
 * Requirements: 4.1–4.6
 */
describe('SandboxService', () => {
  let service: SandboxService;
  let mockEngine: MockEngineService;
  let mockPrisma: {
    sandboxSession: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(() => {
    mockEngine = new MockEngineService();

    mockPrisma = {
      sandboxSession: {
        create: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: 'session-1',
            ...args.data,
            createdAt: new Date(),
          }),
        ),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    service = new SandboxService(
      mockPrisma as unknown as PrismaService,
      mockEngine,
    );
  });

  // ─── Demo mode execution (no auth) ──────────────────────

  describe('execute — demo mode (no auth)', () => {
    it('should execute in demo mode when no userId is provided', async () => {
      const result = await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
        body: { producto: 'Auto' },
      });

      expect(result.isDemo).toBe(true);
      expect(result.traceId).toBeDefined();
      expect(result.responseStatus).toBe(200);
      expect(result.responseBody).toBeDefined();
      expect(result.apiId).toBe('api-1');
      expect(result.endpoint).toBe('/cotizacion');
    });

    it('should persist session with isDemo=true', async () => {
      await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
        body: {},
      });

      expect(mockPrisma.sandboxSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isDemo: true,
          userId: null,
          apiId: 'api-1',
          endpoint: '/cotizacion',
        }),
      });
    });

    it('should default method to POST when not specified', async () => {
      const result = await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
      });

      expect(result.method).toBe('POST');
    });
  });

  // ─── Authenticated execution with personalized data ──────

  describe('execute — authenticated mode', () => {
    it('should execute with personalized data when userId is provided', async () => {
      const result = await service.execute(
        {
          apiId: 'api-1',
          endpoint: '/cotizacion',
          body: { producto: 'Vida' },
        },
        'user-123',
      );

      expect(result.isDemo).toBe(false);
      expect(result.responseStatus).toBe(200);
      expect(result.responseBody).toBeDefined();
    });

    it('should persist session with userId', async () => {
      await service.execute(
        {
          apiId: 'api-1',
          endpoint: '/poliza',
          body: {},
        },
        'user-456',
      );

      expect(mockPrisma.sandboxSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isDemo: false,
          userId: 'user-456',
        }),
      });
    });
  });

  // ─── Error scenario simulation ───────────────────────────

  describe('execute — error scenarios', () => {
    it('should simulate circuit breaker error', async () => {
      const result = await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
        body: {},
        errorScenario: 'CIRCUIT_BREAKER',
      });

      expect(result.responseStatus).toBe(503);
      expect(result.responseBody.message).toContain('Circuit breaker');
    });

    it('should simulate timeout error', async () => {
      const result = await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
        body: {},
        errorScenario: 'TIMEOUT',
      });

      expect(result.responseStatus).toBe(504);
      expect(result.responseBody.message).toContain('Timeout');
    });

    it('should simulate bad request error', async () => {
      const result = await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
        body: {},
        errorScenario: 'BAD_REQUEST',
      });

      expect(result.responseStatus).toBe(400);
    });

    it('should persist error responses in session', async () => {
      await service.execute({
        apiId: 'api-1',
        endpoint: '/cotizacion',
        body: {},
        errorScenario: 'INTERNAL_SERVER_ERROR',
      });

      expect(mockPrisma.sandboxSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          responseStatus: 500,
        }),
      });
    });
  });

  // ─── Trace ID uniqueness ─────────────────────────────────

  describe('generateTraceId', () => {
    it('should generate unique trace IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(service.generateTraceId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate trace IDs with sb- prefix', () => {
      const traceId = service.generateTraceId();
      expect(traceId).toMatch(/^sb-/);
    });
  });

  // ─── Execution history ───────────────────────────────────

  describe('getHistory', () => {
    it('should return paginated history for a user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          userId: 'user-1',
          apiId: 'api-1',
          endpoint: '/cotizacion',
          method: 'POST',
          traceId: 'sb-abc-123',
          responseStatus: 200,
          latencyMs: 150,
          isDemo: false,
          createdAt: new Date(),
        },
      ];

      mockPrisma.sandboxSession.findMany.mockResolvedValue(mockSessions);
      mockPrisma.sandboxSession.count.mockResolvedValue(1);

      const result = await service.getHistory('user-1');

      expect(result.data).toEqual(mockSessions);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should apply filters to history query', async () => {
      mockPrisma.sandboxSession.findMany.mockResolvedValue([]);
      mockPrisma.sandboxSession.count.mockResolvedValue(0);

      await service.getHistory('user-1', {
        apiId: 'api-1',
        responseStatus: 200,
        page: 2,
        limit: 10,
      });

      expect(mockPrisma.sandboxSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            apiId: 'api-1',
            responseStatus: 200,
          }),
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should apply date range filters', async () => {
      mockPrisma.sandboxSession.findMany.mockResolvedValue([]);
      mockPrisma.sandboxSession.count.mockResolvedValue(0);

      await service.getHistory('user-1', {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-12-31T23:59:59Z',
      });

      expect(mockPrisma.sandboxSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            createdAt: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-12-31T23:59:59Z'),
            },
          }),
        }),
      );
    });
  });

  // ─── Session detail ──────────────────────────────────────

  describe('getSessionById', () => {
    it('should return session by ID for the given user', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        traceId: 'sb-abc-123',
      };
      mockPrisma.sandboxSession.findFirst.mockResolvedValue(mockSession);

      const result = await service.getSessionById('session-1', 'user-1');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.sandboxSession.findFirst).toHaveBeenCalledWith({
        where: { id: 'session-1', userId: 'user-1' },
      });
    });

    it('should return null when session is not found', async () => {
      mockPrisma.sandboxSession.findFirst.mockResolvedValue(null);

      const result = await service.getSessionById('nonexistent', 'user-1');

      expect(result).toBeNull();
    });
  });
});
