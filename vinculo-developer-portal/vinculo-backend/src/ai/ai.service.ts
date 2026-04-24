import { Injectable, Logger } from '@nestjs/common';
import { SnippetGeneratorService } from '../apis/snippet-generator.service';
import { CodeLanguage } from './dto/generate-snippet.dto';
import { AssistantContext } from './dto/assistant-query.dto';

/**
 * Structure returned by generateDocs — full auto-generated API documentation.
 */
export interface GeneratedDocs {
  name: string;
  description: string;
  processType: string;
  specOpenApi: Record<string, unknown>;
  testCases: TestCase[];
  sandboxConfig: Record<string, unknown>;
  codeSnippets: { javascript: string; python: string; java: string; curl: string };
  generatedAt: string;
}

export interface TestCase {
  name: string;
  description: string;
  type: 'happy_path' | 'error';
  request: Record<string, unknown>;
  expectedStatus: number;
  expectedResponse: Record<string, unknown>;
}

/**
 * Structure returned by askAssistant / askAssistantPublic.
 */
export interface AssistantResponse {
  answer: string;
  sources: string[];
  suggestedActions?: string[];
  responseTimeMs: number;
}

/**
 * Structure returned by suggestApis.
 */
export interface ApiSuggestion {
  apiId: string;
  name: string;
  description: string;
  product: string;
  process: string;
  relevanceScore: number;
  reason: string;
}

/**
 * AIService — Mock implementation of Claude AI integration for VÍNCULO.
 *
 * All methods return realistic mock responses that simulate what Claude would return
 * for the Colombian insurance domain. When a real Claude API key is available,
 * these methods can be updated to call the actual API.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.5, 1.7, 3.7
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly snippetGenerator: SnippetGeneratorService) {}

  // ─── Generate Documentation from JSON ────────────────────

  /**
   * Generate complete API documentation from a JSON request body.
   *
   * Mock implementation: produces a realistic OpenAPI 3.1 spec, name, description,
   * process type, test cases (happy path + 3 error scenarios), sandbox config,
   * and code snippets.
   *
   * Requirements: 6.1, 6.2, 6.3, 6.4
   */
  async generateDocs(
    requestBody: Record<string, unknown>,
    apiName?: string,
    product?: string,
    context?: string,
  ): Promise<GeneratedDocs> {
    this.logger.log('Generating docs from request body (mock Claude)');
    const startTime = Date.now();

    const inferredName = apiName || this.inferApiName(requestBody);
    const inferredProduct = product || this.inferProduct(requestBody);
    const inferredProcess = this.inferProcess(requestBody);

    // Build OpenAPI 3.1 spec
    const specOpenApi = this.buildOpenApiSpec(inferredName, requestBody, inferredProduct, inferredProcess);

    // Generate test cases: 1 happy path + 3 error scenarios
    const testCases = this.buildTestCases(requestBody, inferredProcess);

    // Generate sandbox config
    const sandboxConfig = this.buildSandboxConfig(inferredName, inferredProcess, requestBody);

    // Generate code snippets using SnippetGeneratorService
    const baseUrl = 'https://api.vinculo.segurosbolivar.com/v1';
    const endpoint = `/${inferredProcess.toLowerCase()}`;
    const snippets = this.snippetGenerator.generateSnippets(
      baseUrl,
      endpoint,
      'POST',
      { Authorization: 'Bearer <your-token>', 'Content-Type': 'application/json' },
      requestBody,
    );

    const elapsed = Date.now() - startTime;
    this.logger.log(`Docs generated in ${elapsed}ms (mock)`);

    return {
      name: inferredName,
      description: context || `API de ${inferredProcess} para ${inferredProduct} — generada automáticamente por VÍNCULO IA`,
      processType: inferredProcess,
      specOpenApi,
      testCases,
      sandboxConfig,
      codeSnippets: snippets,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Contextual Assistant (Authenticated) ────────────────

  /**
   * RAG pipeline: embedding → search → prompt with context → response.
   * Mock implementation returns contextual answers based on the provided context.
   *
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
   */
  async askAssistant(query: string, context?: AssistantContext): Promise<AssistantResponse> {
    this.logger.log(`Assistant query (authenticated): "${query}"`);
    const startTime = Date.now();

    const answer = this.generateContextualAnswer(query, context);
    const sources = this.identifySources(query, context);
    const suggestedActions = this.suggestActions(query, context);

    return {
      answer,
      sources,
      suggestedActions,
      responseTimeMs: Date.now() - startTime,
    };
  }

  // ─── Public Assistant ────────────────────────────────────

  /**
   * Public version of the assistant for general API questions.
   * No authentication required. Limited to general information about available APIs.
   *
   * Requirement: 1.7
   */
  async askAssistantPublic(query: string): Promise<AssistantResponse> {
    this.logger.log(`Assistant query (public): "${query}"`);
    const startTime = Date.now();

    const answer = this.generatePublicAnswer(query);
    const sources = ['Catálogo público de APIs VÍNCULO', 'Documentación general'];

    return {
      answer,
      sources,
      responseTimeMs: Date.now() - startTime,
    };
  }

  // ─── Suggest APIs by Business Need ───────────────────────

  /**
   * Interpret a business need and return relevant APIs from the catalog.
   *
   * Requirements: 9.2, 3.7
   */
  async suggestApis(businessNeed: string, preferredProduct?: string): Promise<ApiSuggestion[]> {
    this.logger.log(`Suggesting APIs for: "${businessNeed}"`);

    const keywords = businessNeed.toLowerCase();
    const suggestions: ApiSuggestion[] = [];

    // Keyword-based matching to simulate AI interpretation
    if (keywords.includes('cotiz') || keywords.includes('quote') || keywords.includes('precio')) {
      suggestions.push({
        apiId: 'api-cotizacion-auto',
        name: 'Cotización Auto',
        description: 'API para cotizar seguros de vehículos nuevos y usados',
        product: 'Auto',
        process: 'COTIZACION',
        relevanceScore: 0.95,
        reason: 'Coincide con la necesidad de cotización mencionada',
      });
    }

    if (keywords.includes('auto') || keywords.includes('vehículo') || keywords.includes('carro')) {
      suggestions.push({
        apiId: 'api-emision-auto',
        name: 'Emisión Póliza Auto',
        description: 'API para emitir pólizas de seguro de automóviles',
        product: 'Auto',
        process: 'EMISION',
        relevanceScore: 0.88,
        reason: 'Relacionada con seguros de automóviles',
      });
    }

    if (keywords.includes('vida') || keywords.includes('life') || keywords.includes('fallecimiento')) {
      suggestions.push({
        apiId: 'api-cotizacion-vida',
        name: 'Cotización Vida',
        description: 'API para cotizar seguros de vida individual y grupal',
        product: 'Vida',
        process: 'COTIZACION',
        relevanceScore: 0.92,
        reason: 'Coincide con la necesidad de seguros de vida',
      });
    }

    if (keywords.includes('hogar') || keywords.includes('casa') || keywords.includes('vivienda')) {
      suggestions.push({
        apiId: 'api-cotizacion-hogar',
        name: 'Cotización Hogar',
        description: 'API para cotizar seguros de hogar y contenidos',
        product: 'Hogar',
        process: 'COTIZACION',
        relevanceScore: 0.90,
        reason: 'Coincide con la necesidad de seguros de hogar',
      });
    }

    if (keywords.includes('salud') || keywords.includes('health') || keywords.includes('médic')) {
      suggestions.push({
        apiId: 'api-cotizacion-salud',
        name: 'Cotización Salud',
        description: 'API para cotizar planes de salud complementarios',
        product: 'Salud',
        process: 'COTIZACION',
        relevanceScore: 0.91,
        reason: 'Coincide con la necesidad de seguros de salud',
      });
    }

    if (keywords.includes('siniestro') || keywords.includes('claim') || keywords.includes('reclamación')) {
      suggestions.push({
        apiId: 'api-siniestros',
        name: 'Gestión de Siniestros',
        description: 'API para reportar y consultar siniestros',
        product: preferredProduct || 'Auto',
        process: 'SINIESTRO',
        relevanceScore: 0.87,
        reason: 'Coincide con la necesidad de gestión de siniestros',
      });
    }

    if (keywords.includes('póliza') || keywords.includes('policy') || keywords.includes('emisi')) {
      suggestions.push({
        apiId: 'api-polizas',
        name: 'Consulta de Pólizas',
        description: 'API para consultar y gestionar pólizas vigentes',
        product: preferredProduct || 'Auto',
        process: 'POLIZA',
        relevanceScore: 0.85,
        reason: 'Coincide con la necesidad de gestión de pólizas',
      });
    }

    // If no specific match, return general suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        {
          apiId: 'api-cotizacion-auto',
          name: 'Cotización Auto',
          description: 'API más popular — cotización de seguros de vehículos',
          product: 'Auto',
          process: 'COTIZACION',
          relevanceScore: 0.60,
          reason: 'API más utilizada del catálogo VÍNCULO',
        },
        {
          apiId: 'api-cotizacion-vida',
          name: 'Cotización Vida',
          description: 'API para cotizar seguros de vida individual y grupal',
          product: 'Vida',
          process: 'COTIZACION',
          relevanceScore: 0.55,
          reason: 'Sugerencia general basada en popularidad',
        },
      );
    }

    // Filter by preferred product if specified
    const filtered = preferredProduct
      ? suggestions.filter((s) => s.product.toLowerCase() === preferredProduct.toLowerCase())
      : suggestions;

    // Sort by relevance score descending
    return (filtered.length > 0 ? filtered : suggestions)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // ─── Generate Code Snippet ───────────────────────────────

  /**
   * Generate a functional code snippet for a specific API endpoint and language.
   * Delegates to SnippetGeneratorService.
   *
   * Requirements: 9.3, 3.5
   */
  async generateSnippet(
    apiId: string,
    endpoint: string,
    language: CodeLanguage,
    method: string = 'POST',
  ): Promise<{ language: CodeLanguage; snippet: string }> {
    this.logger.log(`Generating ${language} snippet for ${apiId}:${endpoint}`);

    const baseUrl = 'https://api.vinculo.segurosbolivar.com/v1';
    const headers: Record<string, string> = {
      Authorization: 'Bearer <your-token>',
      'Content-Type': 'application/json',
    };

    const sampleBody = this.getSampleBody(endpoint);

    const snippets = this.snippetGenerator.generateSnippets(
      baseUrl,
      endpoint,
      method,
      headers,
      sampleBody,
    );

    return {
      language,
      snippet: snippets[language],
    };
  }

  // ─── Private helpers ─────────────────────────────────────

  private inferApiName(requestBody: Record<string, unknown>): string {
    const keys = Object.keys(requestBody).map((k) => k.toLowerCase());

    if (keys.some((k) => k.includes('cotizacion') || k.includes('quote') || k.includes('precio'))) {
      return 'API de Cotización';
    }
    if (keys.some((k) => k.includes('poliza') || k.includes('policy'))) {
      return 'API de Pólizas';
    }
    if (keys.some((k) => k.includes('siniestro') || k.includes('claim'))) {
      return 'API de Siniestros';
    }
    if (keys.some((k) => k.includes('producto'))) {
      const producto = String(requestBody.producto || '');
      return `API de ${producto || 'Seguros'}`;
    }
    return 'API de Seguros VÍNCULO';
  }

  private inferProduct(requestBody: Record<string, unknown>): string {
    const producto = String(requestBody.producto || requestBody.product || '').toLowerCase();
    if (producto.includes('auto') || producto.includes('vehic')) return 'Auto';
    if (producto.includes('vida') || producto.includes('life')) return 'Vida';
    if (producto.includes('hogar') || producto.includes('home')) return 'Hogar';
    if (producto.includes('salud') || producto.includes('health')) return 'Salud';
    return 'Auto';
  }

  private inferProcess(requestBody: Record<string, unknown>): string {
    const keys = Object.keys(requestBody).join(' ').toLowerCase();
    if (keys.includes('cotizacion') || keys.includes('quote') || keys.includes('precio') || keys.includes('valorasegurado')) {
      return 'COTIZACION';
    }
    if (keys.includes('poliza') || keys.includes('policy') || keys.includes('emision')) {
      return 'EMISION';
    }
    if (keys.includes('siniestro') || keys.includes('claim')) {
      return 'SINIESTRO';
    }
    return 'COTIZACION';
  }

  private buildOpenApiSpec(
    name: string,
    requestBody: Record<string, unknown>,
    product: string,
    process: string,
  ): Record<string, unknown> {
    const endpoint = `/${process.toLowerCase()}`;
    const properties: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(requestBody)) {
      properties[key] = {
        type: typeof value === 'number' ? 'number' : 'string',
        example: value,
      };
    }

    return {
      openapi: '3.1.0',
      info: {
        title: name,
        description: `${name} — Seguros Bolívar (${product})`,
        version: '1.0.0',
        contact: {
          name: 'Equipo VÍNCULO',
          email: 'vinculo@segurosbolivar.com',
        },
      },
      servers: [
        {
          url: 'https://api.vinculo.segurosbolivar.com/v1',
          description: 'Producción',
        },
        {
          url: 'https://sandbox.vinculo.segurosbolivar.com/v1',
          description: 'Sandbox',
        },
      ],
      paths: {
        [endpoint]: {
          post: {
            summary: `Ejecutar ${process.toLowerCase()}`,
            operationId: `${process.toLowerCase()}Create`,
            tags: [product],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties,
                    required: Object.keys(requestBody),
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Operación exitosa',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: `${process.substring(0, 3)}-001` },
                        estado: { type: 'string', example: 'GENERADA' },
                        fechaCreacion: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
              '400': { description: 'Request body malformado' },
              '401': { description: 'No autenticado' },
              '500': { description: 'Error interno del servidor' },
            },
          },
        },
      },
    };
  }

  private buildTestCases(requestBody: Record<string, unknown>, process: string): TestCase[] {
    return [
      {
        name: `Happy Path — ${process}`,
        description: `Solicitud exitosa de ${process.toLowerCase()} con datos válidos`,
        type: 'happy_path',
        request: requestBody,
        expectedStatus: 200,
        expectedResponse: {
          estado: 'GENERADA',
          mensaje: 'Operación completada exitosamente',
        },
      },
      {
        name: 'Error — Campos requeridos faltantes',
        description: 'Request body sin campos obligatorios',
        type: 'error',
        request: {},
        expectedStatus: 400,
        expectedResponse: {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Campos requeridos faltantes',
        },
      },
      {
        name: 'Error — Token inválido',
        description: 'Solicitud sin autenticación o con token expirado',
        type: 'error',
        request: requestBody,
        expectedStatus: 401,
        expectedResponse: {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Token de autenticación inválido o expirado',
        },
      },
      {
        name: 'Error — Datos inválidos',
        description: 'Request body con tipos de datos incorrectos',
        type: 'error',
        request: { ...requestBody, cedula: 12345 },
        expectedStatus: 422,
        expectedResponse: {
          statusCode: 422,
          error: 'Unprocessable Entity',
          message: 'Tipo de dato inválido para el campo cedula',
        },
      },
    ];
  }

  private buildSandboxConfig(
    name: string,
    process: string,
    requestBody: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      enabled: true,
      demoMode: true,
      defaultEndpoint: `/${process.toLowerCase()}`,
      defaultMethod: 'POST',
      defaultBody: requestBody,
      latencyRange: { min: 50, max: 300 },
      errorScenarios: ['BAD_REQUEST', 'UNAUTHORIZED', 'TIMEOUT', 'CIRCUIT_BREAKER'],
    };
  }

  private generateContextualAnswer(query: string, context?: AssistantContext): string {
    const queryLower = query.toLowerCase();
    const apiName = context?.apiName || 'la API';
    const screen = context?.currentScreen || '';

    if (queryLower.includes('integr') || queryLower.includes('cómo')) {
      return (
        `Para integrar ${apiName}, sigue estos pasos:\n\n` +
        `1. Obtén tu token JWT mediante el flujo de autenticación OTP\n` +
        `2. Usa el sandbox interactivo para probar los endpoints\n` +
        `3. Revisa los snippets de código en tu lenguaje preferido\n` +
        `4. Implementa la integración en tu aplicación\n` +
        `5. Solicita acceso a producción cuando estés listo\n\n` +
        `¿Necesitas ayuda con algún paso específico?`
      );
    }

    if (queryLower.includes('error') || queryLower.includes('problema') || queryLower.includes('falla')) {
      return (
        `Para resolver errores de integración con ${apiName}:\n\n` +
        `1. Verifica que tu token JWT no haya expirado (duración: 8 horas)\n` +
        `2. Confirma que el request body cumple con el esquema OpenAPI\n` +
        `3. Revisa los códigos de error HTTP en la documentación\n` +
        `4. Usa el trace ID del sandbox para depurar la solicitud\n\n` +
        `Si el error persiste, contacta al equipo de soporte técnico.`
      );
    }

    if (queryLower.includes('snippet') || queryLower.includes('código') || queryLower.includes('ejemplo')) {
      return (
        `Puedo generar snippets de código para ${apiName} en JavaScript, Python, Java y cURL. ` +
        `Cada snippet incluye la URL correcta, headers de autenticación y un request body de ejemplo. ` +
        `¿En qué lenguaje prefieres el snippet?`
      );
    }

    if (queryLower.includes('sandbox') || queryLower.includes('probar') || queryLower.includes('test')) {
      return (
        `El sandbox de ${apiName} te permite probar los endpoints con datos mock realistas de seguros colombianos. ` +
        `Puedes ejecutar llamadas en modo demo (sin autenticación) o en modo completo (con tu token JWT). ` +
        `También puedes simular escenarios de error como timeouts y circuit breakers.`
      );
    }

    if (screen.includes('catalog')) {
      return (
        `Estás en el catálogo de APIs de VÍNCULO. Aquí puedes explorar todas las APIs disponibles ` +
        `filtradas por producto (Vida, Auto, Hogar, Salud), proceso y estado. ` +
        `Selecciona una API para ver su documentación completa y probarla en el sandbox.`
      );
    }

    return (
      `Soy el asistente IA de VÍNCULO. Puedo ayudarte con:\n\n` +
      `• Integración de APIs de seguros\n` +
      `• Generación de snippets de código\n` +
      `• Resolución de errores de integración\n` +
      `• Navegación por el catálogo de APIs\n` +
      `• Uso del sandbox interactivo\n\n` +
      `¿En qué puedo ayudarte?`
    );
  }

  private generatePublicAnswer(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('api') && (queryLower.includes('disponible') || queryLower.includes('catálogo') || queryLower.includes('qué'))) {
      return (
        `VÍNCULO ofrece APIs de seguros en las siguientes líneas de producto:\n\n` +
        `• **Vida**: Cotización, emisión y gestión de pólizas de vida\n` +
        `• **Auto**: Cotización, emisión y siniestros de seguros vehiculares\n` +
        `• **Hogar**: Cotización y gestión de seguros de hogar\n` +
        `• **Salud**: Planes de salud complementarios\n\n` +
        `Regístrate para acceder al sandbox interactivo y probar las APIs con datos reales.`
      );
    }

    // Check sandbox/demo/probar BEFORE registration — "probar sin registrarme" is a sandbox question
    if (queryLower.includes('sandbox') || queryLower.includes('probar') || queryLower.includes('demo')) {
      return (
        `Puedes probar las APIs en modo demo sin registrarte. ` +
        `El sandbox genera respuestas realistas de seguros con datos mock colombianos. ` +
        `Para acceder al modo completo con datos personalizados, regístrate con tu email.`
      );
    }

    if (queryLower.includes('registr') || queryLower.includes('cuenta') || queryLower.includes('acceso')) {
      return (
        `Para registrarte en VÍNCULO solo necesitas tu email corporativo. ` +
        `El proceso toma menos de 2 minutos:\n\n` +
        `1. Ingresa tu email en el formulario de registro\n` +
        `2. Recibe un código OTP de 6 dígitos en tu correo\n` +
        `3. Ingresa el código y accede al portal completo\n\n` +
        `No se requiere contraseña — usamos autenticación segura con OTP.`
      );
    }

    return (
      `Bienvenido a VÍNCULO, el portal de desarrolladores de Seguros Bolívar. ` +
      `Aquí puedes explorar y probar APIs de seguros para integrarlas en tu plataforma. ` +
      `¿Te gustaría saber sobre las APIs disponibles, cómo registrarte, o probar el sandbox?`
    );
  }

  private identifySources(query: string, context?: AssistantContext): string[] {
    const sources: string[] = [];

    if (context?.apiId) {
      sources.push(`Documentación de ${context.apiName || context.apiId}`);
    }

    sources.push('Catálogo de APIs VÍNCULO');
    sources.push('Guía de integración VÍNCULO');

    return sources;
  }

  private suggestActions(query: string, context?: AssistantContext): string[] {
    const actions: string[] = [];
    const queryLower = query.toLowerCase();

    if (queryLower.includes('integr')) {
      actions.push('Ver snippets de código');
      actions.push('Abrir sandbox interactivo');
    }

    if (queryLower.includes('error') || queryLower.includes('problema')) {
      actions.push('Revisar documentación de errores');
      actions.push('Consultar trace ID en sandbox');
    }

    if (context?.apiId) {
      actions.push(`Ver documentación de ${context.apiName || 'la API'}`);
      actions.push('Probar en sandbox');
    }

    if (actions.length === 0) {
      actions.push('Explorar catálogo de APIs');
      actions.push('Probar sandbox en modo demo');
    }

    return actions;
  }

  private getSampleBody(endpoint: string): Record<string, unknown> {
    const endpointLower = endpoint.toLowerCase();

    if (endpointLower.includes('cotizacion') || endpointLower.includes('quote')) {
      return {
        producto: 'Auto',
        cedula: '1000000001',
        ciudad: 'Bogotá',
        valorAsegurado: 50000000,
      };
    }

    if (endpointLower.includes('poliza') || endpointLower.includes('policy')) {
      return {
        producto: 'Vida',
        cedula: '1000000002',
        tipoPoliza: 'Individual',
      };
    }

    if (endpointLower.includes('siniestro') || endpointLower.includes('claim')) {
      return {
        polizaId: 'POL-001',
        descripcion: 'Siniestro reportado',
        fechaOcurrencia: '2024-01-15',
      };
    }

    return {
      ejemplo: 'datos de prueba',
      timestamp: new Date().toISOString(),
    };
  }
}
