import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('v1/vinculo/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RU-06: Obtener notificaciones del aliado' })
  getNotifications(@Request() req: any) {
    return this.notificationsService.getForAliado(req.user.id);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RU-06: Marcar notificación como leída' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RU-06: Marcar todas como leídas' })
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Post('global')
  @ApiOperation({ summary: 'RU-06 Admin: Crear notificación global' })
  createGlobal(@Body() body: { type: string; title: string; message: string }) {
    return this.notificationsService.createGlobal(body.type as any, body.title, body.message);
  }
}
