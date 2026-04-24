import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchQueryDto,
  SemanticSearchDto,
  SuggestionsQueryDto,
} from './dto/search-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * SearchController — REST endpoints for search, history, and autocomplete.
 *
 * - GET  /search:             Global search with query and filters (PUBLICO)
 * - POST /search/semantic:    Semantic search with AI (Authenticated) — placeholder
 * - GET  /search/history:     Search history (Authenticated)
 * - GET  /search/suggestions: Autocomplete suggestions (PUBLICO)
 *
 * Requirements: 12.1–12.5
 */
@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ─── Global search (PUBLICO) ─────────────────────────────

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Búsqueda global de APIs',
    description:
      'Búsqueda full-text en el catálogo de APIs con filtros por producto, ' +
      'proceso, versión y estado. Resultados en < 500ms. Acceso público.',
  })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda paginados' })
  @ApiResponse({ status: 400, description: 'Query vacío o demasiado largo' })
  async search(@Query() dto: SearchQueryDto, @Req() req: any) {
    const result = await this.searchService.search(dto);

    // If user is authenticated, save search history
    const userId = req.user?.id || req.user?.sub;
    if (userId) {
      const filters: Record<string, unknown> = {};
      if (dto.product) filters.product = dto.product;
      if (dto.process) filters.process = dto.process;
      if (dto.version) filters.version = dto.version;
      if (dto.state) filters.state = dto.state;

      // Fire-and-forget: don't block the response
      this.searchService
        .saveHistory(userId, dto.query, filters, result.pagination.total)
        .catch(() => {});
    }

    return result;
  }

  // ─── Semantic search with AI (Authenticated) ─────────────

  @Post('semantic')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Búsqueda semántica con IA',
    description:
      'Interpreta la intención de la consulta en lenguaje natural usando IA ' +
      'y retorna APIs relevantes. Requiere autenticación. ' +
      'Placeholder: actualmente redirige a búsqueda full-text.',
  })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda semántica' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async semanticSearch(@Body() dto: SemanticSearchDto, @Req() req: any) {
    // Placeholder: delegate to full-text search until AI module is implemented
    const searchDto: SearchQueryDto = { query: dto.query };
    const result = await this.searchService.search(searchDto);

    const userId = req.user?.id || req.user?.sub;
    if (userId) {
      this.searchService
        .saveHistory(userId, dto.query, { semantic: true }, result.pagination.total)
        .catch(() => {});
    }

    return {
      ...result,
      semantic: true,
      note: 'Búsqueda semántica con IA — placeholder, usando búsqueda full-text',
    };
  }

  // ─── Search history (Authenticated) ──────────────────────

  @Get('history')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Historial de búsquedas',
    description:
      'Retorna el historial de búsquedas recientes del usuario autenticado. ' +
      'Accesible para EXTERNO, LIDER_TECNICO y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Historial de búsquedas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getHistory(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.searchService.getHistory(userId);
  }

  // ─── Autocomplete suggestions (PUBLICO) ──────────────────

  @Get('suggestions')
  @Public()
  @ApiOperation({
    summary: 'Sugerencias de autocompletado',
    description:
      'Retorna sugerencias de autocompletado basadas en nombres de APIs ' +
      'y términos frecuentes. Acceso público.',
  })
  @ApiResponse({ status: 200, description: 'Lista de sugerencias' })
  async getSuggestions(@Query() dto: SuggestionsQueryDto) {
    return this.searchService.getSuggestions(dto.query);
  }
}
