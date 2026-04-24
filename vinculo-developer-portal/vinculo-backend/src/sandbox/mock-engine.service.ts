import { Injectable, Logger } from '@nestjs/common';

/**
 * Error scenarios supported by the sandbox mock engine.
 */
export type ErrorScenario =
  | 'CIRCUIT_BREAKER'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT';

/**
 * Mock response structure returned by the engine.
 */
export interface MockResponse {
  statusCode: number;
  body: Record<string, unknown>;
  headers: Record<string, string>;
  latencyMs: number;
}

// ─── Colombian mock data pools ─────────────────────────────

const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Ibagué',
];

const COLOMBIAN_FIRST_NAMES = [
  'Carlos', 'María', 'Juan', 'Ana', 'Luis',
  'Diana', 'Andrés', 'Paola', 'Santiago', 'Valentina',
];

const COLOMBIAN_LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González',
  'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez',
];

const INSURANCE_PRODUCTS = ['Vida', 'Auto', 'Hogar', 'Salud'];

/**
 * MockEngineService — Generates realistic insurance responses with Colombian mock data.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6
 */
@Injectable()
export class MockEngineService {
  private readonly logger = new Logger(MockEngineService.name);

  /**
   * Generate a realistic insurance response based on the API, endpoint, and request body.
   *
   * Requirement 4.2: Generate realistic insurance responses simulating legacy systems.
   * Requirement 4.3: Personalized mock data per partner in authenticated mode.
   * Requirement 4.6: Demo mode with generic read-only data.
   *
   * @param apiId - The API identifier
   * @param endpoint - The endpoint path (e.g., /cotizacion, /poliza, /siniestro)
   * @param body - The request body
   * @param userId - Optional user ID for personalized data (authenticated mode)
   */
  generateResponse(
    apiId: string,
    endpoint: string,
    body: Record<string, unknown>,
    userId?: string,
  ): MockResponse {
    const isDemo = !userId;
    const endpointLower = endpoint.toLowerCase();

    let responseBody: Record<string, unknown>;

    if (endpointLower.includes('cotizacion') || endpointLower.includes('quote')) {
      responseBody = this.generateQuoteResponse(apiId, body, isDemo, userId);
    } else if (endpointLower.includes('poliza') || endpointLower.includes('policy')) {
      responseBody = this.generatePolicyResponse(apiId, body, isDemo, userId);
    } else if (endpointLower.includes('siniestro') || endpointLower.includes('claim')) {
      responseBody = this.generateClaimResponse(apiId, body, isDemo, userId);
    } else {
      responseBody = this.generateGenericResponse(apiId, endpoint, body, isDemo, userId);
    }

    const latencyMs = this.simulateLatency();

    return {
      statusCode: 200,
      body: responseBody,
      headers: {
        'Content-Type': 'application/json',
        'X-Sandbox': 'true',
        'X-Mock-Engine': 'vinculo-sandbox',
        ...(isDemo ? { 'X-Demo-Mode': 'true' } : {}),
      },
      latencyMs,
    };
  }

  /**
   * Simulate an error scenario (circuit breaker, timeouts, HTTP errors).
   *
   * Requirement 4.4: Support error scenario simulation including circuit breaker,
   * timeouts, and HTTP error codes.
   */
  simulateError(scenario: ErrorScenario): MockResponse {
    const errorMap: Record<ErrorScenario, { statusCode: number; message: string }> = {
      BAD_REQUEST: {
        statusCode: 400,
        message: 'Request body malformado: campos requeridos faltantes',
      },
      UNAUTHORIZED: {
        statusCode: 401,
        message: 'Token de autenticación inválido o expirado',
      },
      FORBIDDEN: {
        statusCode: 403,
        message: 'No tiene permisos para acceder a este recurso',
      },
      NOT_FOUND: {
        statusCode: 404,
        message: 'Recurso no encontrado en el sistema',
      },
      INTERNAL_SERVER_ERROR: {
        statusCode: 500,
        message: 'Error interno del servidor — contacte soporte técnico',
      },
      SERVICE_UNAVAILABLE: {
        statusCode: 503,
        message: 'Servicio temporalmente no disponible (simulación)',
      },
      GATEWAY_TIMEOUT: {
        statusCode: 504,
        message: 'Timeout de conexión (simulación)',
      },
      CIRCUIT_BREAKER: {
        statusCode: 503,
        message: 'Circuit breaker activado: servicio temporalmente no disponible (simulación)',
      },
      TIMEOUT: {
        statusCode: 504,
        message: 'Timeout de conexión: el servicio no respondió en el tiempo esperado (simulación)',
      },
    };

    const error = errorMap[scenario];
    const latencyMs = scenario === 'TIMEOUT' || scenario === 'GATEWAY_TIMEOUT'
      ? this.randomInt(3000, 15000)
      : this.simulateLatency();

    return {
      statusCode: error.statusCode,
      body: {
        statusCode: error.statusCode,
        error: this.httpStatusText(error.statusCode),
        message: error.message,
        timestamp: new Date().toISOString(),
        sandbox: true,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Sandbox': 'true',
        'X-Error-Scenario': scenario,
      },
      latencyMs,
    };
  }

  // ─── Private response generators ─────────────────────────

  private generateQuoteResponse(
    apiId: string,
    body: Record<string, unknown>,
    isDemo: boolean,
    userId?: string,
  ): Record<string, unknown> {
    const cedula = isDemo ? '1000000001' : this.generateCedula(userId);
    const name = isDemo
      ? 'Juan Pérez (Demo)'
      : this.generateFullName(userId);
    const city = isDemo ? 'Bogotá' : this.pickFromPool(COLOMBIAN_CITIES, userId);

    return {
      cotizacionId: this.generateId('COT'),
      estado: 'GENERADA',
      fechaCotizacion: new Date().toISOString(),
      vigencia: '30 días',
      asegurado: {
        cedula,
        nombre: name,
        ciudad: city,
        email: isDemo ? 'demo@vinculo.com' : `${cedula}@aliado.com`,
      },
      producto: body.producto || INSURANCE_PRODUCTS[this.randomInt(0, INSURANCE_PRODUCTS.length - 1)],
      primaTotal: this.randomInt(150000, 5000000),
      primaMensual: this.randomInt(15000, 500000),
      moneda: 'COP',
      coberturas: [
        { nombre: 'Cobertura básica', valor: this.randomInt(50000000, 200000000) },
        { nombre: 'Asistencia 24h', valor: 'Incluida' },
      ],
      sandbox: true,
      isDemo,
    };
  }

  private generatePolicyResponse(
    apiId: string,
    body: Record<string, unknown>,
    isDemo: boolean,
    userId?: string,
  ): Record<string, unknown> {
    const cedula = isDemo ? '1000000001' : this.generateCedula(userId);
    const name = isDemo
      ? 'Juan Pérez (Demo)'
      : this.generateFullName(userId);

    return {
      polizaId: this.generateId('POL'),
      numero: `SB-${this.randomInt(100000, 999999)}`,
      estado: 'VIGENTE',
      fechaEmision: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      tomador: {
        cedula,
        nombre: name,
        nit: isDemo ? '900000001-1' : this.generateNIT(userId),
      },
      producto: body.producto || 'Auto',
      primaTotal: this.randomInt(500000, 10000000),
      moneda: 'COP',
      sandbox: true,
      isDemo,
    };
  }

  private generateClaimResponse(
    apiId: string,
    body: Record<string, unknown>,
    isDemo: boolean,
    userId?: string,
  ): Record<string, unknown> {
    const cedula = isDemo ? '1000000001' : this.generateCedula(userId);
    const city = isDemo ? 'Bogotá' : this.pickFromPool(COLOMBIAN_CITIES, userId);

    return {
      siniestroId: this.generateId('SIN'),
      numero: `SIN-${this.randomInt(10000, 99999)}`,
      estado: 'EN_PROCESO',
      fechaReporte: new Date().toISOString(),
      reclamante: {
        cedula,
        ciudad: city,
      },
      descripcion: body.descripcion || 'Siniestro reportado vía sandbox',
      montoEstimado: this.randomInt(1000000, 50000000),
      moneda: 'COP',
      sandbox: true,
      isDemo,
    };
  }

  private generateGenericResponse(
    apiId: string,
    endpoint: string,
    body: Record<string, unknown>,
    isDemo: boolean,
    userId?: string,
  ): Record<string, unknown> {
    return {
      requestId: this.generateId('REQ'),
      apiId,
      endpoint,
      status: 'OK',
      data: {
        message: 'Respuesta generada por el motor mock de VÍNCULO',
        timestamp: new Date().toISOString(),
        isDemo,
      },
      sandbox: true,
      isDemo,
    };
  }

  // ─── Colombian data generators ───────────────────────────

  /** Generate a Colombian cédula (10-digit number). */
  private generateCedula(seed?: string): string {
    const base = seed ? this.hashCode(seed) : this.randomInt(0, 999999999);
    return String(1000000000 + (Math.abs(base) % 999999999));
  }

  /** Generate a Colombian NIT (9 digits + check digit). */
  private generateNIT(seed?: string): string {
    const base = seed ? this.hashCode(seed) : this.randomInt(0, 899999999);
    const nit = 900000000 + (Math.abs(base) % 99999999);
    const checkDigit = Math.abs(base) % 10;
    return `${nit}-${checkDigit}`;
  }

  /** Generate a full Colombian name. */
  private generateFullName(seed?: string): string {
    const firstName = this.pickFromPool(COLOMBIAN_FIRST_NAMES, seed);
    const lastName = this.pickFromPool(COLOMBIAN_LAST_NAMES, seed ? seed + '_last' : undefined);
    return `${firstName} ${lastName}`;
  }

  /** Pick a deterministic item from a pool based on an optional seed. */
  private pickFromPool<T>(pool: T[], seed?: string): T {
    const idx = seed
      ? Math.abs(this.hashCode(seed)) % pool.length
      : this.randomInt(0, pool.length - 1);
    return pool[idx];
  }

  // ─── Utility helpers ─────────────────────────────────────

  /** Generate a prefixed unique ID. */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  /** Simulate realistic latency (50–300ms). */
  private simulateLatency(): number {
    return this.randomInt(50, 300);
  }

  /** Random integer between min and max (inclusive). */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Simple string hash for deterministic seed-based generation. */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash;
  }

  /** Map HTTP status code to standard text. */
  private httpStatusText(code: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return map[code] || 'Error';
  }
}
