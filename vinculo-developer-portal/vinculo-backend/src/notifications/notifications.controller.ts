import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller for the Notifications module.
 * All endpoints require authentication (EXTERNO, LIDER_TECNICO, ADMIN).
 *
 * Requirements: 8.2, 13.5
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EXTERNO', 'LIDER_TECNICO', 'ADMIN')
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * GET /notifications — List user's notifications.
   *
   * Requirement 13.5: Users can view their notifications.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar notificaciones del usuario',
    description:
      'Retorna todas las notificaciones del usuario autenticado, ordenadas por fecha (más recientes primero). ' +
      'Incluye conteo de no leídas.',
  })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findByUser(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findByUser(user.id);
  }

  /**
   * PATCH /notifications/:id/read — Mark notification as read.
   *
   * Requirement 13.5: Users can mark notifications as read.
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description: 'Marca una notificación específica como leída.',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación (UUID)' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * PATCH /notifications/read-all — Mark all notifications as read.
   *
   * Requirement 13.5: Users can mark all notifications as read.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
    description:
      'Marca todas las notificaciones no leídas del usuario autenticado como leídas.',
  })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
