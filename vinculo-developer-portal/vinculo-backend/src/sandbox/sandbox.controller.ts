import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SandboxService } from './sandbox.service';
import { ExecuteSandboxDto } from './dto/execute-sandbox.dto';
import { SandboxFilterDto } from './dto/sandbox-filter.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * SandboxController — REST endpoints for the sandbox mock engine.
 *
 * - POST /sandbox/execute: Execute a sandbox call (PUBLICO: demo, EXTERNO+: full)
 * - GET /sandbox/history: Execution history (EXTERNO+)
 * - GET /sandbox/history/:id: Execution detail with trace ID (EXTERNO+)
 * - GET /sandbox/presets/:apiId: Test presets per API (PUBLICO)
 *
 * Requirements: 4.1–4.6
 */
@ApiTags('sandbox')
@Controller('sandbox')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  // ─── Execute sandbox call ────────────────────────────────

  @Post('execute')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecutar llamada sandbox',
    description:
      'Ejecuta una llamada mock al motor de sandbox. ' +
      'Sin autenticación: modo demo con datos genéricos. ' +
      'Con autenticación (EXTERNO+): datos personalizados por aliado.',
  })
  @ApiResponse({ status: 200, description: 'Ejecución exitosa con respuesta mock' })
  @ApiResponse({ status: 400, description: 'Request body malformado' })
  async execute(@Body() dto: ExecuteSandboxDto, @Req() req: any) {
    // Extract userId from JWT if authenticated, otherwise demo mode
    const userId = req.user?.sub || req.user?.id || undefined;
    return this.sandboxService.execute(dto, userId);
  }

  // ─── Execution history (EXTERNO+) ────────────────────────

  @Get('history')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Historial de ejecuciones',
    description:
      'Retorna el historial paginado de ejecuciones del aliado autenticado. ' +
      'Accesible para EXTERNO, LIDER_TECNICO y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Historial de ejecuciones paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getHistory(@Query() filters: SandboxFilterDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.sandboxService.getHistory(userId, filters);
  }

  // ─── Execution detail (EXTERNO+) ─────────────────────────

  @Get('history/:id')
  @Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Detalle de ejecución con trace ID',
    description:
      'Retorna el detalle completo de una ejecución de sandbox, incluyendo trace ID. ' +
      'Accesible para EXTERNO, LIDER_TECNICO y ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la sesión de sandbox (UUID)' })
  @ApiResponse({ status: 200, description: 'Detalle de la ejecución' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  async getSessionDetail(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const session = await this.sandboxService.getSessionById(id, userId);

    if (!session) {
      throw new NotFoundException(`Sesión de sandbox con ID "${id}" no encontrada`);
    }

    return session;
  }

  // ─── Test presets per API (PUBLICO) ──────────────────────

  @Get('presets/:apiId')
  @Public()
  @ApiOperation({
    summary: 'Presets de prueba por API',
    description:
      'Retorna presets de prueba predefinidos para una API específica. ' +
      'Incluye happy path y escenarios de error. Acceso público.',
  })
  @ApiParam({ name: 'apiId', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Lista de presets de prueba' })
  async getPresets(@Param('apiId') apiId: string) {
    // Return predefined test presets for the given API
    return {
      apiId,
      presets: [
        {
          name: 'Happy Path — Cotización',
          description: 'Solicitud de cotización exitosa con datos válidos',
          endpoint: '/cotizacion',
          method: 'POST',
          body: {
            producto: 'Auto',
            cedula: '1000000001',
            ciudad: 'Bogotá',
            valorAsegurado: 50000000,
          },
          expectedStatus: 200,
        },
        {
          name: 'Happy Path — Póliza',
          description: 'Consulta de póliza existente',
          endpoint: '/poliza',
          method: 'POST',
          body: {
            producto: 'Vida',
            cedula: '1000000002',
          },
          expectedStatus: 200,
        },
        {
          name: 'Error — Bad Request',
          description: 'Simular error 400 por request body inválido',
          endpoint: '/cotizacion',
          method: 'POST',
          body: {},
          errorScenario: 'BAD_REQUEST',
          expectedStatus: 400,
        },
        {
          name: 'Error — Timeout',
          description: 'Simular timeout de conexión',
          endpoint: '/cotizacion',
          method: 'POST',
          body: { producto: 'Auto' },
          errorScenario: 'TIMEOUT',
          expectedStatus: 504,
        },
        {
          name: 'Error — Circuit Breaker',
          description: 'Simular circuit breaker activado',
          endpoint: '/cotizacion',
          method: 'POST',
          body: { producto: 'Auto' },
          errorScenario: 'CIRCUIT_BREAKER',
          expectedStatus: 503,
        },
      ],
    };
  }
}
