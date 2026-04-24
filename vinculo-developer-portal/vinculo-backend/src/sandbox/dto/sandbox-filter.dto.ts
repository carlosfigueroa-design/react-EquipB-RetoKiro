import { IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for filtering sandbox execution history.
 *
 * Requirement 4.5: Execution history with trace ID for debugging.
 */
export class SandboxFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por API ID' })
  @IsOptional()
  @IsString()
  apiId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por endpoint' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Filtrar por código de respuesta HTTP' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  responseStatus?: number;

  @ApiPropertyOptional({ description: 'Fecha de inicio (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Página (default: 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Elementos por página (default: 20, max: 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
