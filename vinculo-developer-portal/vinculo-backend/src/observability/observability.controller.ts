import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ObservabilityService } from './observability.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * Controller for the Observability module.
 * Exposes endpoints for metrics, latency percentiles, quota alerts,
 * CSV export, and distributed tracing.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
@ApiTags('observability')
@Controller('observability')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  // ─── Metrics ─────────────────────────────────────────────

  @Get('metrics')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Métricas generales de todas las APIs',
    description:
      'Retorna métricas en tiempo real (llamadas, latencia, tasa de errores) para todas las APIs. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Métricas generales retornadas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  async getMetrics() {
    return this.observabilityService.getMetrics();
  }

  @Get('metrics/:apiId')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Métricas por API',
    description:
      'Retorna métricas en tiempo real para una API específica. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiParam({ name: 'apiId', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Métricas de la API retornadas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  async getMetricsByApi(@Param('apiId') apiId: string) {
    return this.observabilityService.getMetricsByApi(apiId);
  }

  // ─── Latency Percentiles ────────────────────────────────

  @Get('latency/:apiId')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Percentiles de latencia por API',
    description:
      'Retorna percentiles de latencia (p50, p95, p99) para una API específica. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiParam({ name: 'apiId', description: 'ID de la API (UUID)' })
  @ApiResponse({ status: 200, description: 'Percentiles de latencia retornados exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  async getLatencyPercentiles(@Param('apiId') apiId: string) {
    return this.observabilityService.getLatencyPercentiles(apiId);
  }

  // ─── Alerts ──────────────────────────────────────────────

  @Get('alerts')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Alertas activas de cuota',
    description:
      'Verifica cuotas de todos los aliados y retorna alertas para quienes superan el 80%. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Alertas activas retornadas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  async getAlerts() {
    return this.observabilityService.checkQuotaAlerts();
  }

  // ─── CSV Export ──────────────────────────────────────────

  @Post('export')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exportar datos de consumo en CSV',
    description:
      'Genera y retorna un archivo CSV con datos de consumo por aliado. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'CSV generado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  async exportCsv(@Res() res: Response) {
    const csv = await this.observabilityService.exportConsumptionCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="consumption-report.csv"',
    );
    res.send(csv);
  }

  // ─── Distributed Tracing ────────────────────────────────

  @Get('traces/:traceId')
  @Roles('LIDER_TECNICO', 'ADMIN')
  @ApiOperation({
    summary: 'Detalle de trace por trace ID',
    description:
      'Retorna el detalle completo de una solicitud rastreada por su trace ID. ' +
      'Accesible para LIDER_TECNICO y ADMIN.',
  })
  @ApiParam({ name: 'traceId', description: 'Trace ID único de la solicitud' })
  @ApiResponse({ status: 200, description: 'Detalle de trace retornado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado: se requiere rol LIDER_TECNICO o ADMIN',
  })
  @ApiResponse({ status: 404, description: 'Trace no encontrado' })
  async getTrace(@Param('traceId') traceId: string) {
    const trace = await this.observabilityService.getTraceByTraceId(traceId);

    if (!trace) {
      throw new NotFoundException(
        `Trace con ID "${traceId}" no encontrado`,
      );
    }

    return trace;
  }
}
