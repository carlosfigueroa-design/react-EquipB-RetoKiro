import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsEmail,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing API.
 * All fields are optional — only provided fields are updated.
 *
 * Requirements: 3.2, 3.6
 */
export class UpdateApiDto {
  @ApiPropertyOptional({
    description: 'Nombre de la API',
    example: 'Cotización Auto v2',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la API en español',
    example: 'API mejorada para cotización de seguros de automóvil',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la API en inglés',
    example: 'Improved API for automobile insurance quotation',
  })
  @IsOptional()
  @IsString({ message: 'La descripción en inglés debe ser una cadena de texto' })
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Línea de producto',
    enum: ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
  })
  @IsOptional()
  @IsEnum(
    ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
    { message: 'El producto debe ser uno de: VIDA, AUTO, HOGAR, SALUD, OPEN_FINANCE, IDENTITY_SECURITY' },
  )
  product?: string;

  @ApiPropertyOptional({
    description: 'Proceso de negocio',
    enum: [
      'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
      'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
    ],
  })
  @IsOptional()
  @IsEnum(
    [
      'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
      'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
    ],
    { message: 'El proceso debe ser uno de los procesos válidos del sistema' },
  )
  process?: string;

  @ApiPropertyOptional({
    description: 'Versión actual de la API',
    example: '2.0.0',
  })
  @IsOptional()
  @IsString({ message: 'La versión debe ser una cadena de texto' })
  currentVersion?: string;

  @ApiPropertyOptional({
    description: 'SLA de uptime (porcentaje)',
    example: 99.95,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El SLA debe ser un número' })
  @Min(0, { message: 'El SLA no puede ser negativo' })
  @Max(100, { message: 'El SLA no puede ser mayor a 100' })
  slaUptime?: number;

  @ApiPropertyOptional({
    description: 'Casos de prueba en formato JSON',
  })
  @IsOptional()
  @IsObject({ message: 'Los casos de prueba deben ser un objeto JSON' })
  testCases?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Configuración del sandbox en formato JSON',
  })
  @IsOptional()
  @IsObject({ message: 'La configuración del sandbox debe ser un objeto JSON' })
  sandboxConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Snippets de código en formato JSON',
  })
  @IsOptional()
  @IsObject({ message: 'Los snippets de código deben ser un objeto JSON' })
  codeSnippets?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Nombre del contacto técnico',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString({ message: 'El nombre de contacto debe ser una cadena de texto' })
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Email del contacto técnico',
    example: 'juan.perez@segurosbolivar.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email de contacto no es válido' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Canal de Slack del contacto técnico',
    example: '#api-cotizacion-auto',
  })
  @IsOptional()
  @IsString({ message: 'El canal de Slack debe ser una cadena de texto' })
  contactSlack?: string;
}
