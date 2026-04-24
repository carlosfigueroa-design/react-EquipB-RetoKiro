import * as fc from 'fast-check';
import { SnippetGeneratorService, SnippetResult } from '../snippet-generator.service';

/**
 * Property-Based Test: Generación de Snippets de Código
 *
 * **Validates: Requirements 3.5**
 *
 * Propiedad 19: Para todo endpoint de API con especificación OpenAPI válida,
 * el sistema SHALL generar snippets funcionales en los 4 lenguajes soportados
 * (JavaScript, Python, Java, cURL), y cada snippet SHALL contener la URL
 * correcta del endpoint, el método HTTP y los headers requeridos.
 */
describe('Property 19: Generación de Snippets de Código', () => {
  let service: SnippetGeneratorService;

  beforeEach(() => {
    service = new SnippetGeneratorService();
  });

  // ─── Generators ─────────────────────────────────────────

  /**
   * Generates a base URL from a fixed set of realistic API base URLs.
   */
  const baseUrlArb = fc.constantFrom(
    'https://api.example.com/v1',
    'https://sandbox.vinculo.com',
    'https://api.segurosbolivar.com/v2',
    'https://openx.vinculo.com',
  );

  /**
   * Generates an API endpoint path from a fixed set of realistic paths.
   */
  const endpointArb = fc.constantFrom(
    '/cotizacion',
    '/poliza',
    '/siniestro',
    '/users',
    '/health',
  );

  /**
   * Generates an HTTP method from the standard set.
   */
  const methodArb = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

  /**
   * Generates a dictionary of HTTP headers using common header names
   * and arbitrary string values.
   */
  const headersArb = fc.dictionary(
    fc.constantFrom('Authorization', 'X-Request-Id', 'Accept'),
    fc.string({ minLength: 1, maxLength: 30 }),
    { minKeys: 0, maxKeys: 3 },
  );

  // ─── Helpers ────────────────────────────────────────────

  const LANGUAGES: (keyof SnippetResult)[] = ['javascript', 'python', 'java', 'curl'];

  /**
   * Builds the expected full URL the same way the service does:
   * strips trailing slash from base, ensures leading slash on endpoint.
   */
  function expectedFullUrl(baseUrl: string, endpoint: string): string {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  // ─── Property Test ──────────────────────────────────────

  it('genera snippets no vacíos en 4 lenguajes con URL, método HTTP y headers correctos', () => {
    /**
     * **Validates: Requirements 3.5**
     *
     * For every valid combination of (baseUrl, endpoint, method, headers):
     * 1. All 4 snippets (javascript, python, java, curl) are non-empty strings
     * 2. All 4 snippets contain the full URL (baseUrl + endpoint)
     * 3. All 4 snippets contain the HTTP method
     * 4. All 4 snippets contain each header key
     */
    fc.assert(
      fc.property(
        baseUrlArb,
        endpointArb,
        methodArb,
        headersArb,
        (baseUrl, endpoint, method, headers) => {
          const result = service.generateSnippets(baseUrl, endpoint, method, headers);
          const fullUrl = expectedFullUrl(baseUrl, endpoint);

          for (const lang of LANGUAGES) {
            const snippet = result[lang];

            // 1. Snippet is a non-empty string
            expect(typeof snippet).toBe('string');
            expect(snippet.length).toBeGreaterThan(0);

            // 2. Snippet contains the full URL
            expect(snippet).toContain(fullUrl);

            // 3. Snippet contains the HTTP method
            //    Python uses lowercase method names (requests.get, requests.post, etc.)
            //    so we check case-insensitively
            expect(snippet.toUpperCase()).toContain(method.toUpperCase());

            // 4. Snippet contains each header key
            for (const headerKey of Object.keys(headers)) {
              expect(snippet).toContain(headerKey);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
