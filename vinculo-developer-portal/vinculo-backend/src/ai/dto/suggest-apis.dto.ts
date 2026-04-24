import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for suggesting APIs based on a business need description.
 *
 * Requirements: 9.2, 3.7
 */
export class SuggestApisDto {
  @ApiProperty({
    description: 'Descripción de la necesidad de negocio en lenguaje natural',
    example: 'Necesito cotizar seguros de auto para mi plataforma fintech',
  })
  @IsString()
  @IsNotEmpty()
  businessNeed!: string;

  @ApiPropertyOptional({
    description: 'Línea de producto preferida (opcional)',
    example: 'Auto',
  })
  @IsOptional()
  @IsString()
  preferredProduct?: string;
}
