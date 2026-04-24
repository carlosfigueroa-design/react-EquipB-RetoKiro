import { Injectable } from '@nestjs/common';
import * as YAML from 'yaml';
import {
  OpenApiSpec,
  ParseResult,
  ValidationResult,
  ValidationError,
  PrintOptions,
  OutputFormat,
} from './interfaces/openapi.interfaces';

/**
 * Service for parsing, validating, printing, and round-tripping OpenAPI 3.1 specifications.
 *
 * Supports both YAML and JSON input formats.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
@Injectable()
export class OpenApiParserService {
  /**
   * Parse an OpenAPI 3.1 specification string (YAML or JSON) into a structured object.
   * Validates the parsed object against required OpenAPI 3.1 fields.
   *
   * Requirement 7.1: Parse valid OpenAPI 3.1 specs into structured objects.
   * Requirement 7.2: Return descriptive errors with location for invalid specs.
   */
  parse(spec: string | Buffer): ParseResult {
    const input = Buffer.isBuffer(spec) ? spec.toString('utf-8') : spec;

    if (!input.trim()) {
      return {
        success: false,
        errors: [
          {
            path: '',
            message: 'Empty specification provided',
          },
        ],
      };
    }

    let parsed: unknown;
    try {
      parsed = this.parseRaw(input);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to parse specification';
      return {
        success: false,
        errors: [
          {
            path: '',
            message: `Syntax error: ${message}`,
          },
        ],
      };
    }

    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      return {
        success: false,
        errors: [
          {
            path: '',
            message:
              'Specification must be a valid YAML or JSON object, got ' +
              (parsed === null ? 'null' : typeof parsed),
          },
        ],
      };
    }

    const validationResult = this.validateStructure(parsed as Record<string, unknown>);

    if (!validationResult.valid) {
      return {
        success: false,
        errors: validationResult.errors,
      };
    }

    return {
      success: true,
      spec: parsed as OpenApiSpec,
      errors: [],
    };
  }

  /**
   * Serialize an OpenAPI spec object back to a valid OpenAPI 3.1 string (YAML or JSON).
   *
   * Requirement 7.3: Format spec objects back to valid OpenAPI 3.1 specs.
   */
  print(specObject: OpenApiSpec, options?: PrintOptions): string {
    const format: OutputFormat = options?.format ?? 'yaml';
    const indent = options?.indent ?? 2;

    if (format === 'json') {
      return JSON.stringify(specObject, null, indent);
    }

    return YAML.stringify(specObject, {
      indent,
      lineWidth: 0,
      defaultKeyType: 'PLAIN',
      defaultStringType: 'PLAIN',
    });
  }

  /**
   * Validate an OpenAPI specification string without fully parsing it into a typed object.
   * Returns a list of validation errors with line and column information when possible.
   *
   * Requirement 7.2: Return descriptive errors indicating location and nature of problems.
   */
  validate(spec: string | Buffer): ValidationResult {
    const input = Buffer.isBuffer(spec) ? spec.toString('utf-8') : spec;

    if (!input.trim()) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: 'Empty specification provided',
          },
        ],
      };
    }

    // Try to parse with line/column info using YAML library
    const isJson = this.detectFormat(input) === 'json';
    let parsed: unknown;

    if (isJson) {
      try {
        parsed = JSON.parse(input);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid JSON';
        return {
          valid: false,
          errors: [
            {
              path: '',
              message: `JSON syntax error: ${message}`,
            },
          ],
        };
      }
    } else {
      try {
        const doc = YAML.parseDocument(input);
        const yamlErrors = doc.errors;

        if (yamlErrors.length > 0) {
          return {
            valid: false,
            errors: yamlErrors.map((err) => ({
              path: '',
              message: `YAML syntax error: ${err.message}`,
              line: err.pos ? this.getLineFromOffset(input, err.pos[0]) : undefined,
              column: err.pos
                ? this.getColumnFromOffset(input, err.pos[0])
                : undefined,
            })),
          };
        }

        parsed = doc.toJS();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid YAML';
        return {
          valid: false,
          errors: [
            {
              path: '',
              message: `YAML syntax error: ${message}`,
            },
          ],
        };
      }
    }

    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message:
              'Specification must be a valid YAML or JSON object, got ' +
              (parsed === null ? 'null' : typeof parsed),
          },
        ],
      };
    }

    // Validate structure and enrich with line/column info
    const structureResult = this.validateStructure(parsed as Record<string, unknown>);

    if (!structureResult.valid && !isJson) {
      // Enrich errors with line/column from YAML document
      const enrichedErrors = structureResult.errors.map((err) => {
        const location = this.findFieldLocation(input, err.path);
        return {
          ...err,
          line: location?.line,
          column: location?.column,
        };
      });

      return {
        valid: false,
        errors: enrichedErrors,
      };
    }

    return structureResult;
  }

  /**
   * Verify round-trip integrity: parse(print(parse(spec))) deep-equals parse(spec).
   *
   * Requirement 7.4: Guarantee round-trip integrity for valid specs.
   */
  roundTrip(spec: string): boolean {
    const firstParse = this.parse(spec);

    if (!firstParse.success || !firstParse.spec) {
      return false;
    }

    const printed = this.print(firstParse.spec);
    const secondParse = this.parse(printed);

    if (!secondParse.success || !secondParse.spec) {
      return false;
    }

    return this.deepEqual(firstParse.spec, secondParse.spec);
  }

  // ─── Private Helpers ──────────────────────────────────

  /**
   * Parse raw input string, auto-detecting YAML vs JSON format.
   */
  private parseRaw(input: string): unknown {
    const format = this.detectFormat(input);

    if (format === 'json') {
      return JSON.parse(input);
    }

    return YAML.parse(input);
  }

  /**
   * Detect whether the input is JSON or YAML based on content.
   */
  private detectFormat(input: string): OutputFormat {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }
    return 'yaml';
  }

  /**
   * Validate the structural requirements of an OpenAPI 3.1 specification.
   * Checks required fields: openapi (must be "3.1.x"), info (with title and version), paths.
   */
  private validateStructure(obj: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    // Check 'openapi' field
    if (!('openapi' in obj) || obj['openapi'] === undefined || obj['openapi'] === null) {
      errors.push({
        path: 'openapi',
        message: 'Missing required field "openapi". Must be a string matching "3.1.x".',
      });
    } else if (typeof obj['openapi'] !== 'string') {
      errors.push({
        path: 'openapi',
        message: `Field "openapi" must be a string, got ${typeof obj['openapi']}.`,
      });
    } else if (!this.isValidOpenApi31Version(obj['openapi'])) {
      errors.push({
        path: 'openapi',
        message: `Field "openapi" must match "3.1.x" (e.g., "3.1.0"), got "${obj['openapi']}".`,
      });
    }

    // Check 'info' field
    if (!('info' in obj) || obj['info'] === undefined || obj['info'] === null) {
      errors.push({
        path: 'info',
        message: 'Missing required field "info". Must be an object with "title" and "version".',
      });
    } else if (typeof obj['info'] !== 'object' || Array.isArray(obj['info'])) {
      errors.push({
        path: 'info',
        message: 'Field "info" must be an object.',
      });
    } else {
      const info = obj['info'] as Record<string, unknown>;

      if (!('title' in info) || typeof info['title'] !== 'string' || !info['title']) {
        errors.push({
          path: 'info.title',
          message: 'Missing required field "info.title". Must be a non-empty string.',
        });
      }

      if (
        !('version' in info) ||
        typeof info['version'] !== 'string' ||
        !info['version']
      ) {
        errors.push({
          path: 'info.version',
          message: 'Missing required field "info.version". Must be a non-empty string.',
        });
      }
    }

    // Check 'paths' field (required in OpenAPI 3.1 unless webhooks are present)
    if (
      !('paths' in obj || 'webhooks' in obj) ||
      (obj['paths'] === undefined && obj['webhooks'] === undefined)
    ) {
      errors.push({
        path: 'paths',
        message:
          'Missing required field "paths" (or "webhooks"). At least one must be present.',
      });
    } else if ('paths' in obj && obj['paths'] !== undefined && obj['paths'] !== null) {
      if (typeof obj['paths'] !== 'object' || Array.isArray(obj['paths'])) {
        errors.push({
          path: 'paths',
          message: 'Field "paths" must be an object.',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if the openapi version string matches the 3.1.x pattern.
   */
  private isValidOpenApi31Version(version: string): boolean {
    return /^3\.1\.\d+$/.test(version);
  }

  /**
   * Deep equality comparison for two values.
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj).sort();
    const bKeys = Object.keys(bObj).sort();

    if (aKeys.length !== bKeys.length) return false;
    if (!aKeys.every((key, i) => key === bKeys[i])) return false;

    return aKeys.every((key) => this.deepEqual(aObj[key], bObj[key]));
  }

  /**
   * Get line number (1-based) from a character offset in a string.
   */
  private getLineFromOffset(input: string, offset: number): number {
    const substring = input.substring(0, offset);
    return substring.split('\n').length;
  }

  /**
   * Get column number (1-based) from a character offset in a string.
   */
  private getColumnFromOffset(input: string, offset: number): number {
    const substring = input.substring(0, offset);
    const lastNewline = substring.lastIndexOf('\n');
    return offset - lastNewline;
  }

  /**
   * Try to find the line/column of a field path in a YAML document.
   */
  private findFieldLocation(
    input: string,
    fieldPath: string,
  ): { line: number; column: number } | undefined {
    if (!fieldPath) return undefined;

    try {
      const doc = YAML.parseDocument(input);
      const pathParts = fieldPath.split('.');
      let node: YAML.Node | YAML.Document | null | undefined = doc;

      for (const part of pathParts) {
        if (!node) return undefined;

        if (YAML.isDocument(node)) {
          node = (node as YAML.Document).get(part, true) as
            | YAML.Node
            | null
            | undefined;
        } else if (YAML.isMap(node)) {
          node = node.get(part, true) as YAML.Node | null | undefined;
        } else {
          return undefined;
        }
      }

      // If the node wasn't found, try to find the parent and report its location
      if (!node) {
        // Find the parent node location for missing fields
        const parentPath = pathParts.slice(0, -1);
        let parentNode: YAML.Node | YAML.Document | null | undefined = doc;

        for (const part of parentPath) {
          if (!parentNode) return undefined;
          if (YAML.isDocument(parentNode)) {
            parentNode = (parentNode as YAML.Document).get(part, true) as
              | YAML.Node
              | null
              | undefined;
          } else if (YAML.isMap(parentNode)) {
            parentNode = parentNode.get(part, true) as YAML.Node | null | undefined;
          } else {
            return undefined;
          }
        }

        if (parentNode && 'range' in parentNode && parentNode.range) {
          return {
            line: this.getLineFromOffset(input, parentNode.range[0]),
            column: this.getColumnFromOffset(input, parentNode.range[0]),
          };
        }

        return undefined;
      }

      if ('range' in node && node.range) {
        return {
          line: this.getLineFromOffset(input, node.range[0]),
          column: this.getColumnFromOffset(input, node.range[0]),
        };
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
