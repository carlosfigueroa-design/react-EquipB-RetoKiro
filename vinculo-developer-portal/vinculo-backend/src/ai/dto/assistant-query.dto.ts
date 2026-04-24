import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Context object for the AI assistant — includes current screen and API info.
 */
export class AssistantContext {
  @ApiPropertyOptional({ description: 'Pantalla actual del usuario', example: '/catalog/api-123' })
  @IsOptional()
  @IsString()
  currentScreen?: string;

  @ApiPropertyOptional({ description: 'ID de la API que el usuario está visualizando' })
  @IsOptional()
  @IsString()
  apiId?: string;

  @ApiPropertyOptional({ description: 'Nombre de la API actual' })
  @IsOptional()
  @IsString()
  apiName?: string;

  @ApiPropertyOptional({ description: 'Endpoint específico que el usuario está revisando' })
  @IsOptional()
  @IsString()
  endpoint?: string;
}

/**
 * DTO for contextual assistant queries (authenticated users).
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export class AssistantQueryDto {
  @ApiProperty({
    description: 'Pregunta o consulta del usuario al asistente IA',
    example: '¿Cómo puedo integrar la API de cotización de Auto?',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({
    description: 'Contexto de la pantalla y API actual del usuario',
    type: AssistantContext,
  })
  @IsOptional()
  @IsObject()
  context?: AssistantContext;
}

/**
 * DTO for public assistant queries (no authentication required).
 *
 * Requirement: 1.7
 */
export class PublicAssistantQueryDto {
  @ApiProperty({
    description: 'Pregunta general sobre las APIs disponibles en VÍNCULO',
    example: '¿Qué APIs de seguros están disponibles?',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;
}
