import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApisService } from './apis.service';
import { ApiFilterDto } from './dto/api-filter.dto';
import { CreateApiDto } from './dto/create-api.dto';
import { UpdateApiDto } from './dto/update-api.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Controller for the APIs module.
 * Exposes CRUD endpoints, versioning, spec upload, and AI doc generation.
 *
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.5, 13.2
 */
@ApiTags('apis')
@Controller('apis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApisController {
  constructor(
    private readonly apisService: ApisService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Public endpoints ────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar APIs del catálogo',
    description:
      'Retorna la lista de APIs con filtros por producto, proceso, versión y estado. ' +
      'Acceso público muestra información básica; usuarios EXTERNO+ ven el catálogo completo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de APIs con metadatos de paginación cursor-based',
  })
  async findAll(@Query() filters: ApiFilterDto) {
    return this.apisService.findAll(filters);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una API',
    description:
      'Retorna el detalle completo de una API incluyendo especificación OpenAPI, versiones y métricas.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Detalle completo de la API' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async findById(@Param('id') id: string) {
    return this.apisService.findById(id);
  }

  // ─── Admin-only endpoints ────────────────────────────────

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear nueva API',
    description:
      'Crea una nueva API en estado DRAFT. Solo accesible para administradores.',
  })
  @ApiResponse({ status: 201, description: 'API creada exitosamente en estado DRAFT' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o slug duplicado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  async create(@Body() dto: CreateApiDto) {
    return this.apisService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'LIDER_TECNICO')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar una API',
    description:
      'Actualiza los campos proporcionados de una API existente. Accesible para ADMIN y LIDER_TECNICO.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'API actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN o LIDER_TECNICO' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async update(@Param('id') id: string, @Body() dto: UpdateApiDto) {
    return this.apisService.update(id, dto);
  }

  // ─── Versioning endpoints ────────────────────────────────

  @Get(':id/versions')
  @Roles('EXTERNO')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar versiones de una API',
    description:
      'Retorna todas las versiones de una API ordenadas por fecha de creación descendente. Accesible para EXTERNO+.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Lista de versiones de la API' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol EXTERNO o superior' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async listVersions(@Param('id') id: string) {
    // Verify the API exists
    const api = await this.prisma.api.findUnique({ where: { id } });
    if (!api) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    const versions = await this.prisma.apiVersion.findMany({
      where: { apiId: id },
      orderBy: { createdAt: 'desc' },
    });

    return { data: versions };
  }

  @Post(':id/versions')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear nueva versión de una API',
    description:
      'Crea una nueva versión con URL versionada (/v1/, /v2/, etc.). Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 201, description: 'Versión creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o versión duplicada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
  ) {
    // Verify the API exists
    const api = await this.prisma.api.findUnique({ where: { id } });
    if (!api) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    // Extract major version number for the URL (e.g., "2.0.0" → "/v2/")
    const majorVersion = dto.version.split('.')[0];
    const versionUrl = `/v${majorVersion}/`;

    // Check for duplicate version
    const existing = await this.prisma.apiVersion.findUnique({
      where: { apiId_version: { apiId: id, version: dto.version } },
    });
    if (existing) {
      throw new BadRequestException(
        `La versión "${dto.version}" ya existe para esta API`,
      );
    }

    const version = await this.prisma.apiVersion.create({
      data: {
        apiId: id,
        version: dto.version,
        versionUrl,
        changelog: dto.changelog,
        specOpenApi: api.specOpenApi ?? undefined,
      },
    });

    // Update the API's current version
    await this.prisma.api.update({
      where: { id },
      data: { currentVersion: dto.version },
    });

    return version;
  }

  // ─── Spec upload endpoint ────────────────────────────────

  @Post(':id/upload-spec')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Subir especificación OpenAPI',
    description:
      'Parsea y valida una especificación OpenAPI 3.1 (YAML/JSON) y la almacena en la API. Solo accesible para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Especificación subida y validada exitosamente' })
  @ApiResponse({ status: 400, description: 'Especificación OpenAPI inválida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async uploadSpec(
    @Param('id') id: string,
    @Body() body: { spec: string },
  ) {
    const specBuffer = Buffer.from(body.spec, 'utf-8');
    return this.apisService.uploadSpec(id, specBuffer);
  }

  // ─── AI doc generation endpoint ──────────────────────────

  @Post(':id/generate-docs')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generar documentación con IA',
    description:
      'Genera documentación OpenAPI automáticamente usando IA a partir del request body proporcionado. ' +
      'Solo accesible para administradores. (Módulo de IA pendiente de implementación)',
  })
  @ApiParam({ name: 'id', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Documentación generada exitosamente (placeholder)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'API no encontrada' })
  async generateDocs(
    @Param('id') id: string,
    @Body() body: { requestBody: Record<string, unknown> },
  ) {
    // Verify the API exists
    const api = await this.prisma.api.findUnique({ where: { id } });
    if (!api) {
      throw new NotFoundException(`API con ID "${id}" no encontrada`);
    }

    // Placeholder response — AI module will be implemented in task 10
    return {
      message: 'Generación de documentación con IA pendiente de implementación',
      apiId: id,
      apiName: api.name,
      status: 'pending',
      note: 'El módulo de IA (AIModule) será implementado en una tarea posterior. Este endpoint retornará la documentación generada automáticamente.',
    };
  }
}
