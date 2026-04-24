import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for filtering APIs in the catalog.
 * Supports cursor-based pagination and filtering by product, process, version, and state.
 *
 * Requirements: 3.1, 12.3
 */
export class ApiFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por línea de producto',
    enum: ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
    example: 'AUTO',
  })
  @IsOptional()
  @IsEnum(
    ['VIDA', 'AUTO', 'HOGAR', 'SALUD', 'OPEN_FINANCE', 'IDENTITY_SECURITY'],
    { message: 'El producto debe ser uno de: VIDA, AUTO, HOGAR, SALUD, OPEN_FINANCE, IDENTITY_SECURITY' },
  )
  product?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por proceso de negocio',
    enum: [
      'COTIZACION', 'EMISION', 'POLIZA', 'RENOVACION', 'SINIESTRO',
      'VALIDACION', 'BRIDGE', 'SCORING', 'PAGOS', 'AUTH', 'KYC',
    ],
    example: 'COTIZACION',
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
    description: 'Filtrar por versión de la API',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString({ message: 'La versión debe ser una cadena de texto' })
  version?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del ciclo de vida',
    enum: ['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(
    ['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUNSET'],
    { message: 'El estado debe ser uno de: DRAFT, ACTIVE, DEPRECATED, SUNSET' },
  )
  lifecycleState?: string;

  @ApiPropertyOptional({
    description: 'Búsqueda por texto en nombre o descripción',
    example: 'cotización',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser una cadena de texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Cursor para paginación (ID de la última API recibida)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString({ message: 'El cursor debe ser una cadena de texto' })
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Número de resultados por página',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero' })
  @Min(1, { message: 'El tamaño de página mínimo es 1' })
  @Max(100, { message: 'El tamaño de página máximo es 100' })
  take?: number;
}
