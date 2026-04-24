import { IsString, IsNotEmpty, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorScenario } from '../mock-engine.service';

/**
 * DTO for executing a sandbox call.
 *
 * Requirements: 4.1, 4.2, 4.4
 */
export class ExecuteSandboxDto {
  @ApiProperty({ description: 'ID de la API a ejecutar (UUID)' })
  @IsString()
  @IsNotEmpty()
  apiId!: string;

  @ApiProperty({ description: 'Endpoint a invocar (e.g., /cotizacion, /poliza)' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiPropertyOptional({
    description: 'Método HTTP (default: POST)',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    default: 'POST',
  })
  @IsOptional()
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string;

  @ApiPropertyOptional({ description: 'Request body en formato JSON' })
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Headers adicionales' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Escenario de error a simular',
    enum: [
      'CIRCUIT_BREAKER', 'TIMEOUT', 'BAD_REQUEST', 'UNAUTHORIZED',
      'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_SERVER_ERROR',
      'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT',
    ],
  })
  @IsOptional()
  @IsString()
  errorScenario?: ErrorScenario;
}
