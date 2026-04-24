import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditFilterDto, ComplianceReportDto } from './dto/audit-filter.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * Controller for the Audit module.
 * Exposes read-only endpoints for querying audit logs and generating compliance reports.
 * All endpoints are restricted to ADMIN role.
 *
 * Requirements: 14.1, 14.3
 */
@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs — Query audit logs with filters.
   * Supports cursor-based pagination and filtering by user, action, resource, and date range.
   *
   * Requirement 14.3: Filter records by user, action type, resource, and date range.
   */
  @Get('logs')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Consultar logs de auditoría con filtros',
    description:
      'Retorna logs de auditoría con paginación cursor-based y filtros por usuario, ' +
      'tipo de acción, recurso y rango de fechas. Solo accesible para ADMIN.',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por ID de usuario' })
  @ApiQuery({ name: 'action', required: false, description: 'Filtrar por tipo de acción' })
  @ApiQuery({ name: 'resource', required: false, description: 'Filtrar por recurso' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (ISO 8601)' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor para paginación' })
  @ApiQuery({ name: 'take', required: false, description: 'Número de registros (default 20, max 100)' })
  @ApiResponse({ status: 200, description: 'Lista de logs de auditoría con paginación' })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  async findAll(@Query() filters: AuditFilterDto) {
    return this.auditService.findAll(filters);
  }

  /**
   * GET /audit/logs/:id — Get a single audit log by ID.
   */
  @Get('logs/:id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Detalle de un log de auditoría',
    description: 'Retorna el detalle completo de un registro de auditoría. Solo accesible para ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID del registro de auditoría (UUID)' })
  @ApiResponse({ status: 200, description: 'Detalle del registro de auditoría' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  /**
   * GET /audit/compliance — Generate compliance report.
   *
   * Requirement 14.2: Retain records for minimum 1 year for SFC Colombia compliance.
   */
  @Get('compliance')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Reporte de cumplimiento SFC/Habeas Data/GDPR',
    description:
      'Genera un reporte de cumplimiento regulatorio para el rango de fechas especificado. ' +
      'Incluye resumen de acciones, usuarios únicos y estado de cumplimiento. Solo accesible para ADMIN.',
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Fecha de inicio (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Fecha de fin (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Reporte de cumplimiento generado' })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: se requiere rol ADMIN' })
  async generateComplianceReport(@Query() dto: ComplianceReportDto) {
    return this.auditService.generateComplianceReport(dto);
  }
}
