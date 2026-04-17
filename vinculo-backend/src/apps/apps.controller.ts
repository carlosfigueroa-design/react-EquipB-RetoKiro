import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppsService } from './apps.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Apps')
@Controller('v1/vinculo/apps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppsController {
  constructor(private appsService: AppsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar aplicaciones del aliado' })
  async list(@Request() req: any) {
    return this.appsService.listApps(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva aplicación' })
  async create(@Request() req: any, @Body() body: { name: string }) {
    return this.appsService.createApp(req.user.id, body.name);
  }

  @Post(':appId/rotate-secret')
  @ApiOperation({ summary: 'Rotar Client Secret de una aplicación' })
  async rotateSecret(@Request() req: any, @Param('appId') appId: string) {
    return this.appsService.rotateSecret(req.user.id, appId);
  }
}
