import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for global search queries with filters.
 *
 * Requirements: 1.4, 1.5, 3.1, 12.1, 12.2, 12.3
 */
export class SearchQueryDto {
  @ApiProperty({
    description: 'Término de búsqueda (nombre de API, producto, proceso o caso de uso)',
    example: 'cotización auto',
  })
  @IsString()
  @IsNotEmpty({ message: 'El término de búsqueda no puede estar vacío' })
  @MaxLength(200, { message: 'El término de búsqueda no puede exceder 200 caracteres' })
  query!: string;

  @ApiPropertyOptional({
    description: 'Filtrar por producto',
    enum: ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'])
  product?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por proceso',
    enum: [
      'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
      'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
    'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
  ])
  process?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por versión (e.g., "1.0.0")',
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del ciclo de vida',
    enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET'])
  state?: string;

  @ApiPropertyOptional({ description: 'Página (default: 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Elementos por página (default: 20, max: 100)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * DTO for semantic search requests.
 *
 * Requirement: 12.4
 */
export class SemanticSearchDto {
  @ApiProperty({
    description: 'Consulta en lenguaje natural para búsqueda semántica',
    example: 'Necesito una API para cotizar seguros de auto en Bogotá',
  })
  @IsString()
  @IsNotEmpty({ message: 'La consulta no puede estar vacía' })
  @MaxLength(500, { message: 'La consulta no puede exceder 500 caracteres' })
  query!: string;
}

/**
 * DTO for autocomplete suggestions.
 *
 * Requirement: 12.1
 */
export class SuggestionsQueryDto {
  @ApiProperty({
    description: 'Término parcial para autocompletado',
    example: 'coti',
  })
  @IsString()
  @IsNotEmpty({ message: 'El término de búsqueda no puede estar vacío' })
  @MaxLength(100, { message: 'El término no puede exceder 100 caracteres' })
  query!: string;
}
