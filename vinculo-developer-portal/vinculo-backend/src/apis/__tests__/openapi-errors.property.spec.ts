import * as fc from 'fast-check';
import * as YAML from 'yaml';
import { OpenApiParserService } from '../openapi-parser.service';

/**
 * Property-Based Test: Reporte de Errores del Parser OpenAPI
 *
 * **Validates: Requirements 7.2**
 *
 * Propiedad 2: Para toda especificación OpenAPI 3.1 inválida (campos requeridos
 * faltantes, tipos incorrectos, estructura malformada), el Parser_OpenAPI SHALL
 * retornar un resultado de error que contenga al menos un mensaje descriptivo
 * indicando la naturaleza del problema, y nunca SHALL retornar un objeto de
 * especificación válido.
 */
describe('Property 2: Reporte de Errores del Parser OpenAPI', () => {
  let service: OpenApiParserService;

  beforeEach(() => {
    service = new OpenApiParserService();
  });

  // ─── Helper ─────────────────────────────────────────────

  /**
   * Builds a valid base OpenAPI 3.1 spec object for selective field removal.
   */
  const buildValidBase = () => ({
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
  });

  // ─── Generators ─────────────────────────────────────────

  /**
   * Generates a safe non-empty string for use in spec fields.
   */
  const safeStringArb = fc
    .stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/)
    .filter((s) => s.trim().length > 0);

  /**
   * Generates a semver-like version string.
   */
  const versionArb = fc
    .tuple(
      fc.integer({ min: 0, max: 99 }),
      fc.integer({ min: 0, max: 99 }),
      fc.integer({ min: 0, max: 99 }),
    )
    .map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

  /**
   * Generates a spec missing the `openapi` field entirely.
   */
  const missingOpenapiFieldArb = fc
    .tuple(safeStringArb, versionArb)
    .map(([title, version]) => ({
      info: { title, version },
      paths: {},
    }));

  /**
   * Generates a spec with an invalid openapi version (not 3.1.x).
   */
  const wrongOpenapiVersionArb = fc
    .tuple(
      fc.constantFrom('2.0.0', '3.0.0', '3.0.3', '4.0.0', '1.0.0', '3.2.0'),
      safeStringArb,
      versionArb,
    )
    .map(([openapiVersion, title, version]) => ({
      openapi: openapiVersion,
      info: { title, version },
      paths: {},
    }));

  /**
   * Generates a spec missing the `info` field entirely.
   */
  const missingInfoFieldArb = fc.constant({
    openapi: '3.1.0',
    paths: {},
  });

  /**
   * Generates a spec missing `info.title`.
   */
  const missingInfoTitleArb = fc.tuple(versionArb).map(([version]) => ({
    openapi: '3.1.0',
    info: { version },
    paths: {},
  }));

  /**
   * Generates a spec missing `info.version`.
   */
  const missingInfoVersionArb = fc.tuple(safeStringArb).map(([title]) => ({
    openapi: '3.1.0',
    info: { title },
    paths: {},
  }));

  /**
   * Generates a spec missing both `paths` and `webhooks`.
   */
  const missingPathsAndWebhooksArb = fc
    .tuple(safeStringArb, versionArb)
    .map(([title, version]) => ({
      openapi: '3.1.0',
      info: { title, version },
    }));

  /**
   * Generates non-object types that are not valid OpenAPI specs.
   * These are serialized as YAML scalars or arrays.
   */
  const nonObjectTypeArb = fc.oneof(
    safeStringArb,
    fc.integer({ min: -1000, max: 1000 }),
    fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 3 }),
  );

  /**
   * `invalidOpenApiSpecArb` — Generates invalid OpenAPI specs with various defects:
   * - Missing openapi field
   * - Wrong openapi version (e.g., "2.0.0", "3.0.0")
   * - Missing info field
   * - Missing info.title
   * - Missing info.version
   * - Missing paths and webhooks
   * - Non-object types (strings, numbers, arrays)
   */
  const invalidOpenApiSpecArb: fc.Arbitrary<{ value: unknown; defect: string }> =
    fc.oneof(
      missingOpenapiFieldArb.map((v) => ({ value: v, defect: 'missing openapi field' })),
      wrongOpenapiVersionArb.map((v) => ({ value: v, defect: 'wrong openapi version' })),
      missingInfoFieldArb.map((v) => ({ value: v, defect: 'missing info field' })),
      missingInfoTitleArb.map((v) => ({ value: v, defect: 'missing info.title' })),
      missingInfoVersionArb.map((v) => ({ value: v, defect: 'missing info.version' })),
      missingPathsAndWebhooksArb.map((v) => ({
        value: v,
        defect: 'missing paths and webhooks',
      })),
      nonObjectTypeArb.map((v) => ({ value: v, defect: 'non-object type' })),
    );

  // ─── Property Test ──────────────────────────────────────

  it('parse() retorna success: false para toda spec OpenAPI 3.1 inválida', () => {
    /**
     * **Validates: Requirements 7.2**
     *
     * For every generated invalid OpenAPI spec:
     * 1. parse() returns success: false
     * 2. parse() returns at least one error with a descriptive message
     * 3. parse() never returns a valid spec object
     */
    fc.assert(
      fc.property(invalidOpenApiSpecArb, ({ value, defect }) => {
        const yamlString = YAML.stringify(value);
        const result = service.parse(yamlString);

        // 1. parse() must return success: false
        expect(result.success).toBe(false);

        // 2. parse() must return at least one error with a descriptive message
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
        result.errors.forEach((error) => {
          expect(typeof error.message).toBe('string');
          expect(error.message.length).toBeGreaterThan(0);
        });

        // 3. parse() must never return a valid spec object
        expect(result.spec).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });
});
