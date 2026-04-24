import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateDocsDto } from './dto/generate-docs.dto';
import { AssistantQueryDto, PublicAssistantQueryDto } from './dto/assistant-query.dto';
import { SuggestApisDto } from './dto/suggest-apis.dto';
import { GenerateSnippetDto } from './dto/generate-snippet.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * AIController — REST endpoints for AI-powered features.
 *
 * - POST /ai/generate-docs:     Generate documentation from JSON (ADMIN)
 * - POST /ai/assistant:         Contextual assistant query (Authenticated)
 * - POST /ai/assistant/public:  Public assistant query (PUBLICO)
 * - POST /ai/suggest-apis:      Suggest APIs by use case (Authenticated)
 * - POST /ai/generate-snippet:  Generate code snippet (Authenticated)
 *
 * Requirements: 6.1, 9.1–9.5
 */
@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ─── Generate documentation from JSON (ADMIN) ───────────

  @Post('generate-docs')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar documentación desde JSON',
    description:
      'Genera documentación completa de una API a partir de un JSON de request body. ' +
      'Incluye especificación OpenAPI 3.1, casos de prueba, configuración de sandbox ' +
      'y snippets de código. Solo accesible para ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Documentación generada exitosamente' })
  @ApiResponse({ status: 400, description: 'Request body inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado — se requiere rol ADMIN' })
  async generateDocs(@Body() dto: GenerateDocsDto) {
    return this.aiService.generateDocs(
      dto.requestBody,
      dto.apiName,
      dto.product,
      dto.context,
    );
  }

  // ─── Contextual assistant query (Authenticated) ──────────

  @Post('assistant')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulta al asistente contextual',
    description:
      'Envía una pregunta al asistente IA contextual. La respuesta se genera ' +
      'considerando la pantalla y API que el usuario está visualizando. ' +
      'Requiere autenticación (EXTERNO, LIDER_TECNICO, ADMIN).',
  })
  @ApiResponse({ status: 200, description: 'Respuesta del asistente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async askAssistant(@Body() dto: AssistantQueryDto) {
    return this.aiService.askAssistant(dto.query, dto.context);
  }

  // ─── Public assistant query (PUBLICO) ────────────────────

  @Post('assistant/public')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulta pública al asistente',
    description:
      'Envía una pregunta general al asistente IA. No requiere autenticación. ' +
      'Limitado a preguntas generales sobre las APIs disponibles en VÍNCULO.',
  })
  @ApiResponse({ status: 200, description: 'Respuesta del asistente público' })
  async askAssistantPublic(@Body() dto: PublicAssistantQueryDto) {
    return this.aiService.askAssistantPublic(dto.query);
  }

  // ─── Suggest APIs by use case (Authenticated) ───────────

  @Post('suggest-apis')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sugerir APIs por caso de uso',
    description:
      'Interpreta una necesidad de negocio descrita en lenguaje natural y retorna ' +
      'APIs relevantes del catálogo VÍNCULO. Requiere autenticación.',
  })
  @ApiResponse({ status: 200, description: 'Lista de APIs sugeridas con relevancia' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async suggestApis(@Body() dto: SuggestApisDto) {
    return this.aiService.suggestApis(dto.businessNeed, dto.preferredProduct);
  }

  // ─── Generate code snippet (Authenticated) ──────────────

  @Post('generate-snippet')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar snippet de código',
    description:
      'Genera un snippet de código funcional para un endpoint específico en el ' +
      'lenguaje seleccionado (JavaScript, Python, Java o cURL). Requiere autenticación.',
  })
  @ApiResponse({ status: 200, description: 'Snippet de código generado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async generateSnippet(@Body() dto: GenerateSnippetDto) {
    return this.aiService.generateSnippet(
      dto.apiId,
      dto.endpoint,
      dto.language,
      dto.method,
    );
  }
}
