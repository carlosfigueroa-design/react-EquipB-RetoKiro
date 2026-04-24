import { MockEngineService, ErrorScenario } from './mock-engine.service';

/**
 * Unit tests for MockEngineService.
 *
 * Tests: quote/policy/claim response generation, demo vs authenticated mode,
 * error scenario simulation (circuit breaker, timeout, HTTP errors),
 * Colombian mock data (cédulas, NIT, cities).
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6
 */
describe('MockEngineService', () => {
  let service: MockEngineService;

  beforeEach(() => {
    service = new MockEngineService();
  });

  // ─── Quote response generation ───────────────────────────

  describe('generateResponse — cotización/quote', () => {
    it('should generate a quote response for /cotizacion endpoint', () => {
      const result = service.generateResponse('api-1', '/cotizacion', {
        producto: 'Auto',
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBeDefined();
      expect(result.body.cotizacionId).toBeDefined();
      expect(result.body.estado).toBe('GENERADA');
      expect(result.body.moneda).toBe('COP');
      expect(result.body.sandbox).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(50);
      expect(result.latencyMs).toBeLessThanOrEqual(300);
    });

    it('should generate demo data when no userId is provided', () => {
      const result = service.generateResponse('api-1', '/cotizacion', {});

      expect(result.body.isDemo).toBe(true);
      const asegurado = result.body.asegurado as Record<string, unknown>;
      expect(asegurado.cedula).toBe('1000000001');
      expect(asegurado.nombre).toContain('Demo');
      expect(asegurado.ciudad).toBe('Bogotá');
    });

    it('should generate personalized data when userId is provided', () => {
      const result = service.generateResponse(
        'api-1',
        '/cotizacion',
        {},
        'user-123',
      );

      expect(result.body.isDemo).toBe(false);
      const asegurado = result.body.asegurado as Record<string, unknown>;
      expect(asegurado.cedula).not.toBe('1000000001');
      expect(asegurado.nombre).not.toContain('Demo');
    });

    it('should generate deterministic personalized data for the same userId', () => {
      const result1 = service.generateResponse('api-1', '/cotizacion', {}, 'user-abc');
      const result2 = service.generateResponse('api-1', '/cotizacion', {}, 'user-abc');

      const asegurado1 = result1.body.asegurado as Record<string, unknown>;
      const asegurado2 = result2.body.asegurado as Record<string, unknown>;
      expect(asegurado1.cedula).toBe(asegurado2.cedula);
      expect(asegurado1.nombre).toBe(asegurado2.nombre);
    });
  });

  // ─── Policy response generation ──────────────────────────

  describe('generateResponse — póliza/policy', () => {
    it('should generate a policy response for /poliza endpoint', () => {
      const result = service.generateResponse('api-1', '/poliza', {
        producto: 'Vida',
      });

      expect(result.statusCode).toBe(200);
      expect(result.body.polizaId).toBeDefined();
      expect(result.body.estado).toBe('VIGENTE');
      expect(result.body.moneda).toBe('COP');
      expect(result.body.sandbox).toBe(true);
    });

    it('should include NIT in policy response for authenticated mode', () => {
      const result = service.generateResponse('api-1', '/poliza', {}, 'user-456');

      const tomador = result.body.tomador as Record<string, unknown>;
      expect(tomador.nit).toBeDefined();
      expect(typeof tomador.nit).toBe('string');
      expect(tomador.nit).toMatch(/^\d+-\d$/);
    });

    it('should use generic NIT in demo mode', () => {
      const result = service.generateResponse('api-1', '/poliza', {});

      const tomador = result.body.tomador as Record<string, unknown>;
      expect(tomador.nit).toBe('900000001-1');
    });
  });

  // ─── Claim response generation ───────────────────────────

  describe('generateResponse — siniestro/claim', () => {
    it('should generate a claim response for /siniestro endpoint', () => {
      const result = service.generateResponse('api-1', '/siniestro', {
        descripcion: 'Accidente de tránsito',
      });

      expect(result.statusCode).toBe(200);
      expect(result.body.siniestroId).toBeDefined();
      expect(result.body.estado).toBe('EN_PROCESO');
      expect(result.body.moneda).toBe('COP');
      expect(result.body.sandbox).toBe(true);
    });
  });

  // ─── Generic response ────────────────────────────────────

  describe('generateResponse — generic endpoint', () => {
    it('should generate a generic response for unknown endpoints', () => {
      const result = service.generateResponse('api-1', '/custom-endpoint', {
        key: 'value',
      });

      expect(result.statusCode).toBe(200);
      expect(result.body.requestId).toBeDefined();
      expect(result.body.apiId).toBe('api-1');
      expect(result.body.endpoint).toBe('/custom-endpoint');
      expect(result.body.sandbox).toBe(true);
    });
  });

  // ─── Response headers ────────────────────────────────────

  describe('response headers', () => {
    it('should include sandbox headers', () => {
      const result = service.generateResponse('api-1', '/cotizacion', {});

      expect(result.headers['X-Sandbox']).toBe('true');
      expect(result.headers['X-Mock-Engine']).toBe('vinculo-sandbox');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should include X-Demo-Mode header in demo mode', () => {
      const result = service.generateResponse('api-1', '/cotizacion', {});
      expect(result.headers['X-Demo-Mode']).toBe('true');
    });

    it('should not include X-Demo-Mode header in authenticated mode', () => {
      const result = service.generateResponse('api-1', '/cotizacion', {}, 'user-1');
      expect(result.headers['X-Demo-Mode']).toBeUndefined();
    });
  });

  // ─── Error scenario simulation ───────────────────────────

  describe('simulateError', () => {
    const errorScenarios: Array<{ scenario: ErrorScenario; expectedStatus: number }> = [
      { scenario: 'BAD_REQUEST', expectedStatus: 400 },
      { scenario: 'UNAUTHORIZED', expectedStatus: 401 },
      { scenario: 'FORBIDDEN', expectedStatus: 403 },
      { scenario: 'NOT_FOUND', expectedStatus: 404 },
      { scenario: 'INTERNAL_SERVER_ERROR', expectedStatus: 500 },
      { scenario: 'SERVICE_UNAVAILABLE', expectedStatus: 503 },
      { scenario: 'GATEWAY_TIMEOUT', expectedStatus: 504 },
      { scenario: 'CIRCUIT_BREAKER', expectedStatus: 503 },
      { scenario: 'TIMEOUT', expectedStatus: 504 },
    ];

    it.each(errorScenarios)(
      'should simulate $scenario with status $expectedStatus',
      ({ scenario, expectedStatus }) => {
        const result = service.simulateError(scenario);

        expect(result.statusCode).toBe(expectedStatus);
        expect(result.body.statusCode).toBe(expectedStatus);
        expect(result.body.message).toBeDefined();
        expect(typeof result.body.message).toBe('string');
        expect(result.body.sandbox).toBe(true);
        expect(result.headers['X-Sandbox']).toBe('true');
        expect(result.headers['X-Error-Scenario']).toBe(scenario);
      },
    );

    it('should simulate high latency for TIMEOUT scenario', () => {
      const result = service.simulateError('TIMEOUT');
      expect(result.latencyMs).toBeGreaterThanOrEqual(3000);
    });

    it('should simulate high latency for GATEWAY_TIMEOUT scenario', () => {
      const result = service.simulateError('GATEWAY_TIMEOUT');
      expect(result.latencyMs).toBeGreaterThanOrEqual(3000);
    });

    it('should include circuit breaker message', () => {
      const result = service.simulateError('CIRCUIT_BREAKER');
      expect(result.body.message).toContain('Circuit breaker');
    });
  });
});
