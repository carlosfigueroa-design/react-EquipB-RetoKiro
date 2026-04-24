/**
 * TypeScript interfaces for OpenAPI 3.1 specification objects.
 * Used by OpenApiParserService for parsing, validation, and serialization.
 */

// ─── Info Object ─────────────────────────────────────────

export interface OpenApiContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OpenApiLicense {
  name: string;
  identifier?: string;
  url?: string;
}

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
  summary?: string;
  termsOfService?: string;
  contact?: OpenApiContact;
  license?: OpenApiLicense;
}

// ─── Server Object ───────────────────────────────────────

export interface OpenApiServerVariable {
  default: string;
  enum?: string[];
  description?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenApiServerVariable>;
}

// ─── Schema Object (simplified for OpenAPI 3.1) ─────────

export interface OpenApiSchema {
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  enum?: unknown[];
  default?: unknown;
  example?: unknown;
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  not?: OpenApiSchema;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | OpenApiSchema;
  [key: string]: unknown;
}

// ─── Media Type & Content ────────────────────────────────

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: Record<string, OpenApiExample>;
  encoding?: Record<string, unknown>;
}

export interface OpenApiExample {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

// ─── Parameter Object ────────────────────────────────────

export interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: Record<string, OpenApiExample>;
  content?: Record<string, OpenApiMediaType>;
}

// ─── Request Body Object ─────────────────────────────────

export interface OpenApiRequestBody {
  description?: string;
  content: Record<string, OpenApiMediaType>;
  required?: boolean;
}

// ─── Response Object ─────────────────────────────────────

export interface OpenApiResponse {
  description: string;
  headers?: Record<string, OpenApiParameter>;
  content?: Record<string, OpenApiMediaType>;
  links?: Record<string, unknown>;
}

// ─── Operation Object ────────────────────────────────────

export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody | { $ref: string };
  responses?: Record<string, OpenApiResponse | { $ref: string }>;
  deprecated?: boolean;
  security?: Record<string, string[]>[];
  servers?: OpenApiServer[];
  [key: string]: unknown;
}

// ─── Path Item Object ────────────────────────────────────

export interface OpenApiPathItem {
  summary?: string;
  description?: string;
  get?: OpenApiOperation;
  put?: OpenApiOperation;
  post?: OpenApiOperation;
  delete?: OpenApiOperation;
  options?: OpenApiOperation;
  head?: OpenApiOperation;
  patch?: OpenApiOperation;
  trace?: OpenApiOperation;
  parameters?: OpenApiParameter[];
  servers?: OpenApiServer[];
  $ref?: string;
}

// ─── Security Scheme Object ──────────────────────────────

export interface OpenApiSecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: unknown;
  openIdConnectUrl?: string;
}

// ─── Components Object ──────────────────────────────────

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchema>;
  responses?: Record<string, OpenApiResponse>;
  parameters?: Record<string, OpenApiParameter>;
  examples?: Record<string, OpenApiExample>;
  requestBodies?: Record<string, OpenApiRequestBody>;
  headers?: Record<string, OpenApiParameter>;
  securitySchemes?: Record<string, OpenApiSecurityScheme>;
  links?: Record<string, unknown>;
  callbacks?: Record<string, unknown>;
  pathItems?: Record<string, OpenApiPathItem>;
}

// ─── Tag Object ──────────────────────────────────────────

export interface OpenApiTag {
  name: string;
  description?: string;
  externalDocs?: OpenApiExternalDocs;
}

// ─── External Documentation Object ──────────────────────

export interface OpenApiExternalDocs {
  url: string;
  description?: string;
}

// ─── Webhook Object ─────────────────────────────────────

export type OpenApiWebhooks = Record<string, OpenApiPathItem>;

// ─── Root OpenAPI 3.1 Spec Object ───────────────────────

export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  paths?: Record<string, OpenApiPathItem>;
  webhooks?: OpenApiWebhooks;
  components?: OpenApiComponents;
  security?: Record<string, string[]>[];
  tags?: OpenApiTag[];
  externalDocs?: OpenApiExternalDocs;
  servers?: OpenApiServer[];
  jsonSchemaDialect?: string;
  [key: string]: unknown;
}

// ─── Validation Result ──────────────────────────────────

export interface ValidationError {
  /** Dot-separated path to the problematic field (e.g. "info.title") */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Line number in the original spec (1-based), if available */
  line?: number;
  /** Column number in the original spec (1-based), if available */
  column?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ─── Parse Result ───────────────────────────────────────

export interface ParseResult {
  success: boolean;
  spec?: OpenApiSpec;
  errors: ValidationError[];
}

// ─── Print Options ──────────────────────────────────────

export type OutputFormat = 'yaml' | 'json';

export interface PrintOptions {
  format?: OutputFormat;
  /** Number of spaces for indentation (default: 2) */
  indent?: number;
}
