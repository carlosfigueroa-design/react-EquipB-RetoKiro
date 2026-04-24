import * as fc from 'fast-check';
import { OpenApiParserService } from '../openapi-parser.service';
import { OpenApiSpec } from '../interfaces/openapi.interfaces';

/**
 * Property-Based Test: Round-Trip de Especificaciones OpenAPI
 *
 * **Validates: Requirements 7.1, 7.3, 7.4**
 *
 * Propiedad 1: Para toda especificación OpenAPI 3.1 válida representada como
 * objeto estructurado, serializar (print) y luego parsear (parse) y luego
 * serializar nuevamente SHALL producir una salida equivalente a la primera
 * serialización. Es decir: `print(parse(print(specObject))) === print(specObject)`.
 */
describe('Property 1: Round-Trip de Especificaciones OpenAPI', () => {
  let service: OpenApiParserService;

  beforeEach(() => {
    service = new OpenApiParserService();
  });

  // ─── Generators ─────────────────────────────────────────

  /**
   * Generates a safe, non-empty alphanumeric string suitable for use as
   * identifiers, titles, and descriptions in OpenAPI specs.
   */
  const safeStringArb = fc
    .stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,29}$/)
    .filter((s) => s.trim().length > 0);

  /**
   * Generates a valid semver-like version string (e.g. "1.0.0", "2.3.1").
   */
  const versionArb = fc.tuple(
    fc.integer({ min: 0, max: 99 }),
    fc.integer({ min: 0, max: 99 }),
    fc.integer({ min: 0, max: 99 }),
  ).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

  /**
   * Generates a valid HTTP status code string used in OpenAPI responses.
   */
  const httpStatusArb = fc.constantFrom('200', '201', '400', '401', '403', '404', '500');

  /**
   * Generates a valid HTTP method name for OpenAPI path items.
   */
  const httpMethodArb = fc.constantFrom('get', 'post', 'put', 'delete', 'patch');

  /**
   * Generates a valid URL path segment (e.g. "/users", "/cotizacion").
   */
  const pathSegmentArb = safeStringArb.map(
    (s) => '/' + s.trim().toLowerCase().replace(/\s+/g, '-'),
  );

  /**
   * Generates a single OpenAPI response object.
   */
  const responseArb = safeStringArb.map((desc) => ({
    description: desc,
  }));

  /**
   * Generates a responses map with 1-3 HTTP status codes.
   */
  const responsesMapArb = fc
    .uniqueArray(httpStatusArb, { minLength: 1, maxLength: 3 })
    .chain((statuses) =>
      fc.tuple(...statuses.map(() => responseArb)).map((responses) => {
        const map: Record<string, { description: string }> = {};
        statuses.forEach((status, i) => {
          map[status] = responses[i];
        });
        return map;
      }),
    );

  /**
   * Generates a single OpenAPI operation (e.g. a GET or POST handler).
   */
  const operationArb = fc.tuple(safeStringArb, responsesMapArb).map(
    ([summary, responses]) => ({
      summary,
      responses,
    }),
  );

  /**
   * Generates a path item with 1-2 HTTP methods.
   */
  const pathItemArb = fc
    .uniqueArray(httpMethodArb, { minLength: 1, maxLength: 2 })
    .chain((methods) =>
      fc.tuple(...methods.map(() => operationArb)).map((operations) => {
        const item: Record<string, unknown> = {};
        methods.forEach((method, i) => {
          item[method] = operations[i];
        });
        return item;
      }),
    );

  /**
   * Generates a paths object with 1-3 random paths.
   */
  const pathsArb = fc
    .uniqueArray(pathSegmentArb, { minLength: 1, maxLength: 3, selector: (v) => v })
    .chain((pathNames) =>
      fc.tuple(...pathNames.map(() => pathItemArb)).map((pathItems) => {
        const paths: Record<string, unknown> = {};
        pathNames.forEach((name, i) => {
          paths[name] = pathItems[i];
        });
        return paths;
      }),
    );

  /**
   * `validOpenApiSpecArb` — Generates valid OpenAPI 3.1 spec objects with:
   * - openapi: always "3.1.0"
   * - info: with random title and version
   * - paths: with 1-3 random paths, each with 1-2 HTTP methods, each with summary and responses
   */
  const validOpenApiSpecArb: fc.Arbitrary<OpenApiSpec> = fc
    .tuple(safeStringArb, versionArb, pathsArb)
    .map(([title, version, paths]) => ({
      openapi: '3.1.0' as const,
      info: {
        title,
        version,
      },
      paths,
    })) as fc.Arbitrary<OpenApiSpec>;

  // ─── Property Test ──────────────────────────────────────

  it('print(parse(print(specObject))) === print(specObject) para toda spec OpenAPI 3.1 válida', () => {
    /**
     * **Validates: Requirements 7.1, 7.3, 7.4**
     *
     * For every generated valid OpenAPI 3.1 spec object:
     * 1. Serialize it to a string with print()
     * 2. Parse that string back with parse()
     * 3. Serialize the parsed result again with print()
     * 4. The two serialized strings must be identical
     */
    fc.assert(
      fc.property(validOpenApiSpecArb, (specObject) => {
        // Step 1: First serialization
        const firstPrint = service.print(specObject);

        // Step 2: Parse the serialized string
        const parseResult = service.parse(firstPrint);

        // The parse must succeed for a valid spec
        expect(parseResult.success).toBe(true);
        expect(parseResult.spec).toBeDefined();

        // Step 3: Second serialization from the parsed object
        const secondPrint = service.print(parseResult.spec!);

        // Step 4: Both serializations must be identical (string equality)
        expect(secondPrint).toBe(firstPrint);
      }),
      { numRuns: 50 },
    );
  });
});
