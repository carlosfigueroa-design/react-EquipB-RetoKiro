import { Injectable, Logger } from '@nestjs/common';
import { MockEngineService, MockResponse } from '../sandbox/mock-engine.service';

/**
 * AiMockEngineService — Lightweight wrapper that enhances MockEngineService
 * responses with AI-generated realistic Colombian insurance data.
 *
 * Connects MockEngineService with AI for more contextual and realistic responses.
 * In production, this would call Claude to generate dynamic responses.
 * Currently uses enhanced mock data patterns.
 *
 * Requirements: 4.2, 4.3
 */
@Injectable()
export class AiMockEngineService {
  private readonly logger = new Logger(AiMockEngineService.name);

  constructor(private readonly mockEngine: MockEngineService) {}

  /**
   * Generate an AI-enhanced mock response for insurance operations.
   *
   * Wraps MockEngineService.generateResponse with additional contextual data
   * that simulates what an AI model would add (richer descriptions, more
   * realistic Colombian insurance data, contextual recommendations).
   *
   * @param apiId - The API identifier
   * @param endpoint - The endpoint path
   * @param body - The request body
   * @param userId - Optional user ID for personalized data
   */
  generateEnhancedResponse(
    apiId: string,
    endpoint: string,
    body: Record<string, unknown>,
    userId?: string,
  ): MockResponse {
    // Get base response from MockEngineService
    const baseResponse = this.mockEngine.generateResponse(apiId, endpoint, body, userId);

    // Enhance with AI-generated contextual data
    const enhanced = this.enhanceWithAiContext(baseResponse, endpoint, body);

    this.logger.log(`AI-enhanced response generated for ${endpoint}`);
    return enhanced;
  }

  /**
   * Generate mock data for quotes with realistic Colombian insurance details.
   */
  generateQuoteMockData(body: Record<string, unknown>): Record<string, unknown> {
    const producto = String(body.producto || 'Auto');
    const ciudad = String(body.ciudad || 'Bogotá');
    const cedula = String(body.cedula || '1000000001');

    return {
      cotizacionId: `COT-${Date.now().toString(36)}`,
      estado: 'GENERADA',
      fechaCotizacion: new Date().toISOString(),
      vigencia: '30 días',
      asegurado: {
        tipoDocumento: 'CC',
        numeroDocumento: cedula,
        ciudad,
      },
      producto,
      plan: this.getInsurancePlan(producto),
      primaTotal: this.calculatePremium(producto, body),
      primaMensual: Math.round(this.calculatePremium(producto, body) / 12),
      moneda: 'COP',
      coberturas: this.getCoverages(producto),
      descuentos: this.getDiscounts(producto),
      condiciones: {
        deducible: this.getDeductible(producto),
        periodoCarencia: '30 días',
        renovacionAutomatica: true,
      },
      recomendacionIA: `Basado en el perfil del asegurado en ${ciudad}, ` +
        `recomendamos el plan ${this.getInsurancePlan(producto)} con cobertura ampliada.`,
    };
  }

  /**
   * Generate mock data for policies with realistic Colombian details.
   */
  generatePolicyMockData(body: Record<string, unknown>): Record<string, unknown> {
    const producto = String(body.producto || 'Auto');
    const cedula = String(body.cedula || '1000000001');

    return {
      polizaId: `POL-${Date.now().toString(36)}`,
      numero: `SB-${Math.floor(100000 + Math.random() * 899999)}`,
      estado: 'VIGENTE',
      fechaEmision: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      tomador: {
        tipoDocumento: 'CC',
        numeroDocumento: cedula,
        nit: `900${Math.floor(100000 + Math.random() * 899999)}-${Math.floor(Math.random() * 10)}`,
      },
      producto,
      plan: this.getInsurancePlan(producto),
      primaTotal: this.calculatePremium(producto, body),
      moneda: 'COP',
      coberturas: this.getCoverages(producto),
      beneficiarios: [
        { nombre: 'Beneficiario Principal', porcentaje: 100 },
      ],
    };
  }

  /**
   * Generate mock data for claims with realistic Colombian details.
   */
  generateClaimMockData(body: Record<string, unknown>): Record<string, unknown> {
    return {
      siniestroId: `SIN-${Date.now().toString(36)}`,
      numero: `SIN-${Math.floor(10000 + Math.random() * 89999)}`,
      estado: 'EN_PROCESO',
      fechaReporte: new Date().toISOString(),
      fechaOcurrencia: String(body.fechaOcurrencia || new Date().toISOString()),
      descripcion: String(body.descripcion || 'Siniestro reportado vía sandbox'),
      montoEstimado: Math.floor(1000000 + Math.random() * 49000000),
      moneda: 'COP',
      documentosRequeridos: [
        'Cédula de ciudadanía',
        'Denuncia ante autoridades (si aplica)',
        'Fotos del siniestro',
        'Factura de reparación (si aplica)',
      ],
      tiempoEstimadoResolucion: '15 días hábiles',
      ajustadorAsignado: {
        nombre: 'Ajustador VÍNCULO',
        telefono: '+57 601 000 0000',
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────────

  private enhanceWithAiContext(
    baseResponse: MockResponse,
    endpoint: string,
    body: Record<string, unknown>,
  ): MockResponse {
    const endpointLower = endpoint.toLowerCase();

    let aiMetadata: Record<string, unknown> = {};

    if (endpointLower.includes('cotizacion') || endpointLower.includes('quote')) {
      aiMetadata = {
        aiEnhanced: true,
        recomendacion: 'Considere agregar cobertura de asistencia en viaje para mayor protección',
        comparativa: 'Esta cotización es un 15% más competitiva que el promedio del mercado',
      };
    } else if (endpointLower.includes('poliza') || endpointLower.includes('policy')) {
      aiMetadata = {
        aiEnhanced: true,
        alertas: ['Renovación automática programada en 30 días'],
        sugerencia: 'Revise las coberturas adicionales disponibles para este producto',
      };
    } else if (endpointLower.includes('siniestro') || endpointLower.includes('claim')) {
      aiMetadata = {
        aiEnhanced: true,
        pasosSiguientes: [
          'Adjuntar documentación requerida',
          'Esperar asignación de ajustador',
          'Seguimiento por portal o app',
        ],
      };
    }

    return {
      ...baseResponse,
      body: {
        ...baseResponse.body,
        ...aiMetadata,
      },
      headers: {
        ...baseResponse.headers,
        'X-AI-Enhanced': 'true',
      },
    };
  }

  private getInsurancePlan(producto: string): string {
    const plans: Record<string, string> = {
      Auto: 'Plan Todo Riesgo Premium',
      Vida: 'Plan Vida Protección Total',
      Hogar: 'Plan Hogar Integral',
      Salud: 'Plan Salud Complementario Plus',
    };
    return plans[producto] || 'Plan Estándar';
  }

  private calculatePremium(producto: string, body: Record<string, unknown>): number {
    const basePremiums: Record<string, number> = {
      Auto: 1500000,
      Vida: 800000,
      Hogar: 600000,
      Salud: 1200000,
    };
    const base = basePremiums[producto] || 1000000;
    const valorAsegurado = Number(body.valorAsegurado || 50000000);
    const factor = valorAsegurado / 50000000;
    return Math.round(base * Math.max(factor, 0.5));
  }

  private getCoverages(producto: string): Array<{ nombre: string; valor: string | number }> {
    const coverageMap: Record<string, Array<{ nombre: string; valor: string | number }>> = {
      Auto: [
        { nombre: 'Daños propios', valor: 50000000 },
        { nombre: 'Responsabilidad civil', valor: 100000000 },
        { nombre: 'Asistencia en carretera', valor: 'Incluida' },
        { nombre: 'Hurto total', valor: 50000000 },
      ],
      Vida: [
        { nombre: 'Fallecimiento', valor: 200000000 },
        { nombre: 'Incapacidad total', valor: 100000000 },
        { nombre: 'Enfermedades graves', valor: 50000000 },
      ],
      Hogar: [
        { nombre: 'Estructura', valor: 150000000 },
        { nombre: 'Contenidos', valor: 30000000 },
        { nombre: 'Responsabilidad civil', valor: 50000000 },
      ],
      Salud: [
        { nombre: 'Hospitalización', valor: 100000000 },
        { nombre: 'Cirugía', valor: 80000000 },
        { nombre: 'Medicamentos', valor: 20000000 },
      ],
    };
    return coverageMap[producto] || [{ nombre: 'Cobertura básica', valor: 50000000 }];
  }

  private getDiscounts(producto: string): Array<{ nombre: string; porcentaje: number }> {
    return [
      { nombre: 'Descuento por pago anual', porcentaje: 10 },
      { nombre: 'Descuento por buen historial', porcentaje: 5 },
    ];
  }

  private getDeductible(producto: string): string {
    const deductibles: Record<string, string> = {
      Auto: '10% del valor del siniestro (mínimo 1 SMMLV)',
      Vida: 'Sin deducible',
      Hogar: '5% del valor del siniestro',
      Salud: 'Copago según plan',
    };
    return deductibles[producto] || '10% del valor del siniestro';
  }
}
