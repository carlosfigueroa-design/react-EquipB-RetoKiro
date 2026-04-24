import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new API version.
 * The version URL is auto-generated from the version string (e.g., "2.0.0" → "/v2/").
 *
 * Requirements: 13.2
 */
export class CreateVersionDto {
  @ApiProperty({
    description: 'Versión semántica de la API',
    example: '2.0.0',
  })
  @IsString({ message: 'La versión debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La versión es requerida' })
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'La versión debe seguir el formato semántico (e.g., 1.0.0, 2.1.3)',
  })
  version!: string;

  @ApiPropertyOptional({
    description: 'Changelog de la versión',
    example: 'Mejoras en validación de datos y nuevos endpoints de consulta',
  })
  @IsOptional()
  @IsString({ message: 'El changelog debe ser una cadena de texto' })
  changelog?: string;
}
