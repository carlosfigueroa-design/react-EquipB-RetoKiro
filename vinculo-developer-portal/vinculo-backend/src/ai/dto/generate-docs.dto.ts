import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for generating API documentation from a JSON request body using AI.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export class GenerateDocsDto {
  @ApiProperty({
    description: 'JSON del request body de la API a documentar',
    example: {
      producto: 'Auto',
      cedula: '1000000001',
      ciudad: 'Bogotá',
      valorAsegurado: 50000000,
    },
  })
  @IsObject()
  @IsNotEmpty()
  requestBody!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Nombre sugerido para la API (opcional, la IA puede generarlo)',
    example: 'Cotización Auto',
  })
  @IsOptional()
  @IsString()
  apiName?: string;

  @ApiPropertyOptional({
    description: 'Línea de producto (Vida, Auto, Hogar, Salud)',
    example: 'Auto',
  })
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional({
    description: 'Contexto adicional para la generación de documentación',
    example: 'API para cotización de seguros de vehículos nuevos y usados',
  })
  @IsOptional()
  @IsString()
  context?: string;
}
