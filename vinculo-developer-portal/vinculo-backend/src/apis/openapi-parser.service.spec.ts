import { OpenApiParserService } from './openapi-parser.service';
import { OpenApiSpec } from './interfaces/openapi.interfaces';

describe('OpenApiParserService', () => {
  let service: OpenApiParserService;

  beforeEach(() => {
    service = new OpenApiParserService();
  });

  // ─── Valid YAML Spec ──────────────────────────────────

  const validYamlSpec = `
openapi: "3.1.0"
info:
  title: Cotización Auto API
  version: "1.0.0"
  description: API para cotización de seguros de auto
paths:
  /cotizacion:
    post:
      summary: Crear cotización
      operationId: crearCotizacion
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                cedula:
                  type: string
                placa:
                  type: string
      responses:
        "200":
          description: Cotización creada exitosamente
        "400":
          description: Datos inválidos
`;

  // ─── Valid JSON Spec ──────────────────────────────────

  const validJsonSpec = JSON.stringify(
    {
      openapi: '3.1.0',
      info: {
        title: 'Póliza Vida API',
        version: '2.0.0',
      },
      paths: {
        '/poliza': {
          get: {
            summary: 'Consultar póliza',
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    },
    null,
    2,
  );

  // ─── parse() ──────────────────────────────────────────

  describe('parse()', () => {
    it('should parse a valid YAML spec into a structured object', () => {
      const result = service.parse(validYamlSpec);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.spec).toBeDefined();
      expect(result.spec!.openapi).toBe('3.1.0');
      expect(result.spec!.info.title).toBe('Cotización Auto API');
      expect(result.spec!.info.version).toBe('1.0.0');
      expect(result.spec!.paths).toBeDefined();
      expect(result.spec!.paths!['/cotizacion']).toBeDefined();
    });

    it('should parse a valid JSON spec into a structured object', () => {
      const result = service.parse(validJsonSpec);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.spec).toBeDefined();
      expect(result.spec!.openapi).toBe('3.1.0');
      expect(result.spec!.info.title).toBe('Póliza Vida API');
    });

    it('should parse a Buffer input', () => {
      const buffer = Buffer.from(validYamlSpec, 'utf-8');
      const result = service.parse(buffer);

      expect(result.success).toBe(true);
      expect(result.spec).toBeDefined();
    });

    it('should return error for empty input', () => {
      const result = service.parse('');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Empty specification');
    });

    it('should return error for invalid YAML syntax', () => {
      const result = service.parse('{ invalid yaml: [}');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Syntax error');
    });

    it('should return error when openapi field is missing', () => {
      const spec = `
info:
  title: Test
  version: "1.0.0"
paths: {}
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'openapi')).toBe(true);
    });

    it('should return error when openapi version is not 3.1.x', () => {
      const spec = `
openapi: "3.0.0"
info:
  title: Test
  version: "1.0.0"
paths: {}
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'openapi')).toBe(true);
      expect(result.errors[0].message).toContain('3.1.x');
    });

    it('should return error when info field is missing', () => {
      const spec = `
openapi: "3.1.0"
paths: {}
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'info')).toBe(true);
    });

    it('should return error when info.title is missing', () => {
      const spec = `
openapi: "3.1.0"
info:
  version: "1.0.0"
paths: {}
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'info.title')).toBe(true);
    });

    it('should return error when info.version is missing', () => {
      const spec = `
openapi: "3.1.0"
info:
  title: Test API
paths: {}
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'info.version')).toBe(true);
    });

    it('should return error when both paths and webhooks are missing', () => {
      const spec = `
openapi: "3.1.0"
info:
  title: Test API
  version: "1.0.0"
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.path === 'paths')).toBe(true);
    });

    it('should accept spec with webhooks instead of paths', () => {
      const spec = `
openapi: "3.1.0"
info:
  title: Webhook API
  version: "1.0.0"
webhooks:
  newEvent:
    post:
      summary: New event
      responses:
        "200":
          description: OK
`;
      const result = service.parse(spec);

      expect(result.success).toBe(true);
    });

    it('should return multiple errors for multiple missing fields', () => {
      const spec = `
info:
  description: No title or version
`;
      const result = service.parse(spec);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should return error for non-object input', () => {
      const result = service.parse('just a string');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ─── print() ──────────────────────────────────────────

  describe('print()', () => {
    const specObject: OpenApiSpec = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    };

    it('should serialize to YAML by default', () => {
      const output = service.print(specObject);

      expect(output).toContain('openapi:');
      expect(output).toContain('info:');
      expect(output).toContain('title: Test API');
    });

    it('should serialize to JSON when format is json', () => {
      const output = service.print(specObject, { format: 'json' });
      const parsed = JSON.parse(output);

      expect(parsed.openapi).toBe('3.1.0');
      expect(parsed.info.title).toBe('Test API');
    });

    it('should respect custom indentation', () => {
      const output = service.print(specObject, { format: 'json', indent: 4 });

      expect(output).toContain('    "openapi"');
    });

    it('should produce valid YAML that can be re-parsed', () => {
      const output = service.print(specObject);
      const result = service.parse(output);

      expect(result.success).toBe(true);
      expect(result.spec!.info.title).toBe('Test API');
    });

    it('should produce valid JSON that can be re-parsed', () => {
      const output = service.print(specObject, { format: 'json' });
      const result = service.parse(output);

      expect(result.success).toBe(true);
      expect(result.spec!.info.title).toBe('Test API');
    });
  });

  // ─── validate() ───────────────────────────────────────

  describe('validate()', () => {
    it('should return valid for a correct YAML spec', () => {
      const result = service.validate(validYamlSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for a correct JSON spec', () => {
      const result = service.validate(validJsonSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors with path for missing fields', () => {
      const spec = `
openapi: "3.0.0"
info:
  title: Test
paths: {}
`;
      const result = service.validate(spec);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.path.length > 0)).toBe(true);
    });

    it('should return errors for invalid JSON syntax', () => {
      const result = service.validate('{ "openapi": }');

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('JSON syntax error');
    });

    it('should return errors for empty input', () => {
      const result = service.validate('  ');

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Empty specification');
    });

    it('should include line/column info for YAML validation errors when possible', () => {
      const spec = `openapi: "2.0.0"
info:
  title: Test
  version: "1.0.0"
paths: {}
`;
      const result = service.validate(spec);

      expect(result.valid).toBe(false);
      // The openapi field error should have line info
      const openapiError = result.errors.find((e) => e.path === 'openapi');
      expect(openapiError).toBeDefined();
      expect(openapiError!.line).toBeDefined();
    });
  });

  // ─── roundTrip() ──────────────────────────────────────

  describe('roundTrip()', () => {
    it('should return true for a valid YAML spec', () => {
      expect(service.roundTrip(validYamlSpec)).toBe(true);
    });

    it('should return true for a valid JSON spec', () => {
      expect(service.roundTrip(validJsonSpec)).toBe(true);
    });

    it('should return false for an invalid spec', () => {
      expect(service.roundTrip('not a valid spec')).toBe(false);
    });

    it('should return false for empty input', () => {
      expect(service.roundTrip('')).toBe(false);
    });

    it('should preserve complex spec structure through round-trip', () => {
      const complexSpec = `
openapi: "3.1.0"
info:
  title: Complex API
  version: "1.0.0"
  description: A complex API with multiple features
  contact:
    name: API Support
    email: support@example.com
servers:
  - url: https://api.example.com/v1
    description: Production
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/User"
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUser"
      responses:
        "201":
          description: Created
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
      required:
        - id
        - name
    CreateUser:
      type: object
      properties:
        name:
          type: string
        email:
          type: string
      required:
        - name
        - email
`;
      expect(service.roundTrip(complexSpec)).toBe(true);
    });
  });
});
