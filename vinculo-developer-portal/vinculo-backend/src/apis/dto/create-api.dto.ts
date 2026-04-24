import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new API.
 * The API is created in DRAFT state by default.
 *
 * Requirements: 3.1, 6.1
 */
export class CreateApiDto {
  @ApiProperty({
    description: 'Nombre de la API',
    example: 'Cotización Auto',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name!: string;

  @ApiProperty({
    description: 'Descripción de la API en español',
    example: 'API para cotización de seguros de automóvil',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  description!: string;

  @ApiPropertyOptional({
    description: 'Descripción de la API en inglés',
    example: 'API for automobile insurance quotation',
  })
  @IsOptional()
  @IsString({ message: 'La descripción en inglés debe ser una cadena de texto' })
  descriptionEn?: string;

  @ApiProperty({
    description: 'Línea de producto',
    enum: ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
    example: 'AUTO',
  })
  @IsEnum(
    ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
    { message: 'El producto debe ser uno de: VIDA, AUTO, HOGAR, SALUD, OPEN_FINANCE, IDENTITY_SECURITY' },
  )
  @IsNotEmpty({ message: 'El producto es requerido' })
  product!: string;

  @ApiProperty({
    description: 'Proceso de negocio',
    enum: [
      'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
      'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
    ],
    example: 'COTIZACION',
  })
  @IsEnum(
    [
      'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
      'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
    ],
    { message: 'El proceso debe ser uno de los procesos válidos del sistema' },
  )
  @IsNotEmpty({ message: 'El proceso es requerido' })
  process!: string;

  @ApiPropertyOptional({
    description: 'Versión inicial de la API',
    example: '1.0.0',
    default: '1.0.0',
  })
  @IsOptional()
  @IsString({ message: 'La versión debe ser una cadena de texto' })
  currentVersion?: string;

  @ApiPropertyOptional({
    description: 'SLA de uptime (porcentaje)',
    example: 99.9,
    default: 99.9,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El SLA debe ser un número' })
  @Min(0, { message: 'El SLA no puede ser negativo' })
  @Max(100, { message: 'El SLA no puede ser mayor a 100' })
  slaUptime?: number;

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
