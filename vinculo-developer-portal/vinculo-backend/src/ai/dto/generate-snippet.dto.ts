import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Supported languages for AI-generated code snippets.
 */
export type CodeLanguage = 'javascript' | 'python' | 'java' | 'curl';

/**
 * DTO for generating code snippets via AI.
 *
 * Requirements: 9.3, 3.5
 */
export class GenerateSnippetDto {
  @ApiProperty({ description: 'ID de la API (UUID)' })
  @IsString()
  @IsNotEmpty()
  apiId!: string;

  @ApiProperty({ description: 'Endpoint de la API (e.g., /cotizacion)', example: '/cotizacion' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({
    description: 'Lenguaje de programación para el snippet',
    enum: ['javascript', 'python', 'java', 'curl'],
    example: 'javascript',
  })
  @IsString()
  @IsIn(['javascript', 'python', 'java', 'curl'])
  language!: CodeLanguage;

  @ApiPropertyOptional({
    description: 'Método HTTP (default: POST)',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    default: 'POST',
  })
  @IsOptional()
  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string;
}
