import { AiService } from './ai.service';
import { SnippetGeneratorService } from '../apis/snippet-generator.service';

/**
 * Unit tests for AiService.
 *
 * Tests: doc generation from JSON, contextual assistant response,
 * API suggestion by business need, snippet generation in 4 languages,
 * and public assistant mode.
 *
 * Requirements: 6.1–6.5, 9.1–9.5
 */
describe('AiService', () => {
  let service: AiService;
  let snippetGenerator: SnippetGeneratorService;

  beforeEach(() => {
    snippetGenerator = new SnippetGeneratorService();
    service = new AiService(snippetGenerator);
  });

  // ─── Doc generation from JSON ────────────────────────────

  describe('generateDocs', () => {
    const sampleRequestBody = {
      producto: 'Auto',
      cedula: '1000000001',
      ciudad: 'Bogotá',
      valorAsegurado: 50000000,
    };

    it('should generate complete documentation from a request body', async () => {
      const result = await service.generateDocs(sampleRequestBody);

      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.processType).toBeDefined();
      expect(result.specOpenApi).toBeDefined();
      expect(result.testCases).toBeDefined();
      expect(result.sandboxConfig).toBeDefined();
      expect(result.codeSnippets).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should generate a valid OpenAPI 3.1 spec structure', async () => {
      const result = await service.generateDocs(sampleRequestBody);
      const spec = result.specOpenApi;

      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info).toBeDefined();
      expect(spec.paths).toBeDefined();
      expect(spec.servers).toBeDefined();
    });

    it('should generate test cases with happy path and 3 error scenarios', async () => {
      const result = await service.generateDocs(sampleRequestBody);

      expect(result.testCases.length).toBe(4);

      const happyPath = result.testCases.filter((tc) => tc.type === 'happy_path');
      const errors = result.testCases.filter((tc) => tc.type === 'error');

      expect(happyPath.length).toBe(1);
      expect(errors.length).toBe(3);
    });

    it('should use provided apiName when given', async () => {
      const result = await service.generateDocs(
        sampleRequestBody,
        'Mi API Personalizada',
      );

      expect(result.name).toBe('Mi API Personalizada');
    });

    it('should infer product from request body', async () => {
      const result = await service.generateDocs({ producto: 'Vida', cedula: '123' });

      expect(result.processType).toBeDefined();
    });

    it('should generate sandbox config with default settings', async () => {
      const result = await service.generateDocs(sampleRequestBody);

      expect(result.sandboxConfig.enabled).toBe(true);
      expect(result.sandboxConfig.demoMode).toBe(true);
      expect(result.sandboxConfig.defaultMethod).toBe('POST');
    });

    it('should generate code snippets in all 4 languages', async () => {
      const result = await service.generateDocs(sampleRequestBody);

      expect(result.codeSnippets.javascript).toBeDefined();
      expect(result.codeSnippets.python).toBeDefined();
      expect(result.codeSnippets.java).toBeDefined();
      expect(result.codeSnippets.curl).toBeDefined();
    });

    it('should use provided context as description', async () => {
      const context = 'API para cotización de seguros de vehículos nuevos';
      const result = await service.generateDocs(sampleRequestBody, undefined, undefined, context);

      expect(result.description).toBe(context);
    });
  });

  // ─── Contextual assistant response ───────────────────────

  describe('askAssistant', () => {
    it('should return a response with answer, sources, and suggested actions', async () => {
      const result = await service.askAssistant('¿Cómo integro la API?', {
        currentScreen: '/catalog/api-123',
        apiId: 'api-123',
        apiName: 'Cotización Auto',
      });

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
      expect(result.responseTimeMs).toBeDefined();
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should provide integration-related answer for integration queries', async () => {
      const result = await service.askAssistant('¿Cómo puedo integrar esta API?');

      expect(result.answer).toContain('integrar');
    });

    it('should provide error-related answer for error queries', async () => {
      const result = await service.askAssistant('Tengo un error de autenticación');

      expect(result.answer).toContain('error');
    });

    it('should provide snippet-related answer for code queries', async () => {
      const result = await service.askAssistant('Necesito un snippet de código');

      expect(result.answer.toLowerCase()).toContain('snippet');
    });

    it('should provide sandbox-related answer for testing queries', async () => {
      const result = await service.askAssistant('¿Cómo puedo probar la API?');

      expect(result.answer.toLowerCase()).toContain('sandbox');
    });

    it('should include API-specific sources when context has apiId', async () => {
      const result = await service.askAssistant('Ayuda', {
        apiId: 'api-123',
        apiName: 'Cotización Auto',
      });

      expect(result.sources.some((s) => s.includes('Cotización Auto'))).toBe(true);
    });

    it('should include suggested actions', async () => {
      const result = await service.askAssistant('¿Cómo integro la API?', {
        apiId: 'api-123',
        apiName: 'Cotización Auto',
      });

      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions!.length).toBeGreaterThan(0);
    });
  });

  // ─── API suggestion by business need ─────────────────────

  describe('suggestApis', () => {
    it('should suggest auto-related APIs for auto insurance needs', async () => {
      const result = await service.suggestApis(
        'Necesito cotizar seguros de auto para mi plataforma',
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.product === 'Auto')).toBe(true);
    });

    it('should suggest vida-related APIs for life insurance needs', async () => {
      const result = await service.suggestApis(
        'Quiero ofrecer seguros de vida a mis clientes',
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.product === 'Vida')).toBe(true);
    });

    it('should suggest hogar-related APIs for home insurance needs', async () => {
      const result = await service.suggestApis(
        'Necesito seguros de hogar para mi app inmobiliaria',
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.product === 'Hogar')).toBe(true);
    });

    it('should suggest salud-related APIs for health insurance needs', async () => {
      const result = await service.suggestApis(
        'Quiero integrar seguros de salud complementarios',
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.product === 'Salud')).toBe(true);
    });

    it('should return suggestions sorted by relevance score', async () => {
      const result = await service.suggestApis('Necesito cotizar seguros de auto');

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          result[i].relevanceScore,
        );
      }
    });

    it('should filter by preferred product when specified', async () => {
      const result = await service.suggestApis(
        'Necesito gestionar siniestros y pólizas',
        'Auto',
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.product === 'Auto')).toBe(true);
    });

    it('should return general suggestions when no specific match', async () => {
      const result = await service.suggestApis('algo completamente diferente');

      expect(result.length).toBeGreaterThan(0);
    });

    it('should include reason for each suggestion', async () => {
      const result = await service.suggestApis('Necesito cotizar seguros');

      result.forEach((suggestion) => {
        expect(suggestion.reason).toBeDefined();
        expect(suggestion.reason.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── Snippet generation in 4 languages ──────────────────

  describe('generateSnippet', () => {
    it('should generate a JavaScript snippet', async () => {
      const result = await service.generateSnippet(
        'api-123',
        '/cotizacion',
        'javascript',
      );

      expect(result.language).toBe('javascript');
      expect(result.snippet).toContain('fetch');
      expect(result.snippet).toContain('/cotizacion');
    });

    it('should generate a Python snippet', async () => {
      const result = await service.generateSnippet(
        'api-123',
        '/cotizacion',
        'python',
      );

      expect(result.language).toBe('python');
      expect(result.snippet).toContain('requests');
      expect(result.snippet).toContain('/cotizacion');
    });

    it('should generate a Java snippet', async () => {
      const result = await service.generateSnippet(
        'api-123',
        '/cotizacion',
        'java',
      );

      expect(result.language).toBe('java');
      expect(result.snippet).toContain('HttpClient');
      expect(result.snippet).toContain('/cotizacion');
    });

    it('should generate a cURL snippet', async () => {
      const result = await service.generateSnippet(
        'api-123',
        '/cotizacion',
        'curl',
      );

      expect(result.language).toBe('curl');
      expect(result.snippet).toContain('curl');
      expect(result.snippet).toContain('/cotizacion');
    });

    it('should include authorization header in snippets', async () => {
      const result = await service.generateSnippet(
        'api-123',
        '/cotizacion',
        'javascript',
      );

      expect(result.snippet).toContain('Authorization');
      expect(result.snippet).toContain('Bearer');
    });

    it('should use the correct HTTP method', async () => {
      const result = await service.generateSnippet(
        'api-123',
        '/cotizacion',
        'curl',
        'GET',
      );

      expect(result.snippet).toContain('GET');
    });
  });

  // ─── Public assistant mode ───────────────────────────────

  describe('askAssistantPublic', () => {
    it('should return a response for API availability questions', async () => {
      const result = await service.askAssistantPublic(
        '¿Qué APIs están disponibles?',
      );

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return registration info for registration questions', async () => {
      const result = await service.askAssistantPublic(
        '¿Cómo me registro en VÍNCULO?',
      );

      expect(result.answer).toContain('email');
    });

    it('should return sandbox info for demo questions', async () => {
      const result = await service.askAssistantPublic(
        '¿Puedo probar las APIs sin registrarme?',
      );

      expect(result.answer.toLowerCase()).toContain('demo');
    });

    it('should return a welcome message for general questions', async () => {
      const result = await service.askAssistantPublic('Hola');

      expect(result.answer).toContain('VÍNCULO');
    });

    it('should include public sources', async () => {
      const result = await service.askAssistantPublic('¿Qué APIs hay?');

      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources.some((s) => s.includes('público') || s.includes('Catálogo'))).toBe(true);
    });
  });
});
