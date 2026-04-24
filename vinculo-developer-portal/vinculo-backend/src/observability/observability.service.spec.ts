import { ObservabilityService } from './observability.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit tests for ObservabilityService.
 *
 * Tests: real-time metrics per API, percentile calculation,
 * quota alert generation, CSV export, trace lookup by trace ID.
 *
 * Requirements: 10.1–10.5
 */
describe('ObservabilityService', () => {
  let service: ObservabilityService;
  let mockPrisma: {
    api: { findMany: jest.Mock; findUnique: jest.Mock };
    sandboxSession: { findMany: jest.Mock; findUnique: jest.Mock };
    apiConsumption: { findMany: jest.Mock };
    notification: { create: jest.Mock };
  };

  beforeEach(() => {
    mockPrisma = {
      api: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      sandboxSession: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      apiConsumption: {
        findMany: jest.fn(),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };

    service = new ObservabilityService(
      mockPrisma as unknown as PrismaService,
    );
  });

  // ─── Real-time metrics per API ───────────────────────────

  describe('getMetrics', () => {
    it('should return metrics for all APIs', async () => {
      mockPrisma.api.findMany.mockResolvedValue([
        { id: 'api-1', name: 'Cotización Auto' },
        { id: 'api-2', name: 'Emisión Vida' },
      ]);

      // API 1: 3 calls, 1 error
      mockPrisma.sandboxSession.findMany
        .mockResolvedValueOnce([
          { latencyMs: 100, responseStatus: 200 },
          { latencyMs: 200, responseStatus: 200 },
          { latencyMs: 150, responseStatus: 500 },
        ])
        // API 2: 0 calls
        .mockResolvedValueOnce([]);

      const metrics = await service.getMetrics();

      expect(metrics).toHaveLength(2);

      // API 1 metrics
      expect(metrics[0].apiId).toBe('api-1');
      expect(metrics[0].callCount).toBe(3);
      expect(metrics[0].errorCount).toBe(1);
      expect(metrics[0].successCount).toBe(2);
      expect(metrics[0].avgLatencyMs).toBeCloseTo(150, 0);
      expect(metrics[0].errorRate).toBeCloseTo(1 / 3, 2);

      // API 2 metrics (no calls)
      expect(metrics[1].apiId).toBe('api-2');
      expect(metrics[1].callCount).toBe(0);
      expect(metrics[1].errorRate).toBe(0);
      expect(metrics[1].avgLatencyMs).toBe(0);
    });
  });

  describe('getMetricsByApi', () => {
    it('should return metrics for a specific API', async () => {
      mockPrisma.api.findUnique.mockResolvedValue({
        id: 'api-1',
        name: 'Cotización Auto',
      });
      mockPrisma.sandboxSession.findMany.mockResolvedValue([
        { latencyMs: 50, responseStatus: 200 },
        { latencyMs: 100, responseStatus: 200 },
        { latencyMs: 200, responseStatus: 400 },
        { latencyMs: 300, responseStatus: 503 },
      ]);

      const metrics = await service.getMetricsByApi('api-1');

      expect(metrics.apiId).toBe('api-1');
      expect(metrics.apiName).toBe('Cotización Auto');
      expect(metrics.callCount).toBe(4);
      expect(metrics.errorCount).toBe(2);
      expect(metrics.successCount).toBe(2);
      expect(metrics.errorRate).toBe(0.5);
    });
  });

  // ─── Percentile calculation ──────────────────────────────

  describe('calculatePercentiles (static)', () => {
    it('should calculate correct percentiles for a known dataset', () => {
      // 10 values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = ObservabilityService.calculatePercentiles(latencies);

      // p50: ceil(0.5 * 10) - 1 = 4 → sorted[4] = 50
      expect(result.p50).toBe(50);
      // p95: ceil(0.95 * 10) - 1 = 9 → sorted[9] = 100
      expect(result.p95).toBe(100);
      // p99: ceil(0.99 * 10) - 1 = 9 → sorted[9] = 100
      expect(result.p99).toBe(100);
    });

    it('should return zeros for empty array', () => {
      const result = ObservabilityService.calculatePercentiles([]);
      expect(result.p50).toBe(0);
      expect(result.p95).toBe(0);
      expect(result.p99).toBe(0);
    });

    it('should handle single-element array', () => {
      const result = ObservabilityService.calculatePercentiles([42]);
      expect(result.p50).toBe(42);
      expect(result.p95).toBe(42);
      expect(result.p99).toBe(42);
    });

    it('should handle unsorted input', () => {
      const latencies = [100, 10, 50, 90, 30, 70, 20, 80, 40, 60];
      const result = ObservabilityService.calculatePercentiles(latencies);

      // Same as sorted [10,20,30,40,50,60,70,80,90,100]
      expect(result.p50).toBe(50);
    });
  });

  describe('getLatencyPercentiles', () => {
    it('should return percentiles from sandbox sessions', async () => {
      mockPrisma.sandboxSession.findMany.mockResolvedValue(
        [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((ms) => ({
          latencyMs: ms,
        })),
      );

      const result = await service.getLatencyPercentiles('api-1');

      expect(result.apiId).toBe('api-1');
      expect(result.p50).toBe(50);
      expect(result.sampleSize).toBe(10);
    });
  });

  // ─── Quota alert generation ──────────────────────────────

  describe('evaluateQuotaAlert (static)', () => {
    it('should generate alert when consumption >= 80% of quota', () => {
      const alert = ObservabilityService.evaluateQuotaAlert(
        'user-1',
        'api-1',
        800,
        1000,
      );

      expect(alert).not.toBeNull();
      expect(alert!.type).toBe('QUOTA_WARNING');
      expect(alert!.usagePercent).toBe(0.8);
    });

    it('should generate alert when consumption exceeds quota', () => {
      const alert = ObservabilityService.evaluateQuotaAlert(
        'user-1',
        'api-1',
        1200,
        1000,
      );

      expect(alert).not.toBeNull();
      expect(alert!.usagePercent).toBe(1.2);
    });

    it('should NOT generate alert when consumption < 80% of quota', () => {
      const alert = ObservabilityService.evaluateQuotaAlert(
        'user-1',
        'api-1',
        799,
        1000,
      );

      expect(alert).toBeNull();
    });

    it('should return null for zero quota', () => {
      const alert = ObservabilityService.evaluateQuotaAlert(
        'user-1',
        'api-1',
        100,
        0,
      );

      expect(alert).toBeNull();
    });
  });

  describe('checkQuotaAlerts', () => {
    it('should generate alerts and create notifications for partners above 80%', async () => {
      mockPrisma.apiConsumption.findMany.mockResolvedValue([
        { userId: 'user-1', apiId: 'api-1', callCount: 900, quota: 1000 },
        { userId: 'user-2', apiId: 'api-2', callCount: 100, quota: 1000 },
      ]);

      const alerts = await service.checkQuotaAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].userId).toBe('user-1');
      expect(alerts[0].type).toBe('QUOTA_WARNING');

      // Should create notification for the alert
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            type: 'QUOTA_WARNING',
          }),
        }),
      );
    });
  });

  // ─── CSV export ──────────────────────────────────────────

  describe('exportConsumptionCsv', () => {
    it('should generate valid CSV with header and data rows', async () => {
      mockPrisma.apiConsumption.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          apiId: 'api-1',
          callCount: 500,
          quota: 1000,
          period: 'monthly',
          user: {
            email: 'partner@example.com',
            name: 'Partner One',
            company: 'Fintech Co',
          },
          api: { name: 'Cotización Auto', slug: 'cotizacion-auto' },
        },
      ]);

      const csv = await service.exportConsumptionCsv();
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe(
        'userId,userEmail,userName,userCompany,apiId,apiName,apiSlug,callCount,quota,usagePercent,period',
      );
      expect(lines[1]).toContain('user-1');
      expect(lines[1]).toContain('partner@example.com');
      expect(lines[1]).toContain('Partner One');
      expect(lines[1]).toContain('500');
      expect(lines[1]).toContain('1000');
      expect(lines[1]).toContain('50'); // 50% usage
    });

    it('should return only header when no consumption data', async () => {
      mockPrisma.apiConsumption.findMany.mockResolvedValue([]);

      const csv = await service.exportConsumptionCsv();
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('userId');
    });

    it('should escape CSV fields with commas', () => {
      const escaped = ObservabilityService.escapeCsvField('Hello, World');
      expect(escaped).toBe('"Hello, World"');
    });

    it('should escape CSV fields with quotes', () => {
      const escaped = ObservabilityService.escapeCsvField('Say "hello"');
      expect(escaped).toBe('"Say ""hello"""');
    });
  });

  // ─── Trace lookup by trace ID ────────────────────────────

  describe('getTraceByTraceId', () => {
    it('should return trace detail for existing trace ID', async () => {
      const mockSession = {
        traceId: 'trace-abc-123',
        apiId: 'api-1',
        endpoint: '/cotizacion',
        method: 'POST',
        requestBody: { cedula: '123456' },
        responseBody: { premium: 50000 },
        responseStatus: 200,
        latencyMs: 150,
        userId: 'user-1',
        isDemo: false,
        createdAt: new Date('2024-06-01T10:00:00Z'),
      };

      mockPrisma.sandboxSession.findUnique.mockResolvedValue(mockSession);

      const trace = await service.getTraceByTraceId('trace-abc-123');

      expect(trace).not.toBeNull();
      expect(trace!.traceId).toBe('trace-abc-123');
      expect(trace!.apiId).toBe('api-1');
      expect(trace!.endpoint).toBe('/cotizacion');
      expect(trace!.method).toBe('POST');
      expect(trace!.latencyMs).toBe(150);
      expect(trace!.responseStatus).toBe(200);
    });

    it('should return null for non-existent trace ID', async () => {
      mockPrisma.sandboxSession.findUnique.mockResolvedValue(null);

      const trace = await service.getTraceByTraceId('nonexistent');

      expect(trace).toBeNull();
    });
  });
});
