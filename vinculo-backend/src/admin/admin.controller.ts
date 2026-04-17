import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('v1/vinculo/admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'RU-07: Dashboard administrativo general' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('aliados')
  @ApiOperation({ summary: 'RU-07: Listar aliados con filtros' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  listAliados(@Query('status') status?: string, @Query('type') type?: string) {
    return this.adminService.listAliados(status, type);
  }

  @Post('aliados/:id/approve')
  @ApiOperation({ summary: 'RU-07: Aprobar aliado' })
  approveAliado(@Param('id') id: string) {
    return this.adminService.approveAliado(id);
  }

  @Post('aliados/:id/suspend')
  @ApiOperation({ summary: 'RU-07: Suspender aliado' })
  suspendAliado(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.suspendAliado(id, body.reason);
  }

  @Post('aliados/:id/reactivate')
  @ApiOperation({ summary: 'RU-07: Reactivar aliado' })
  reactivateAliado(@Param('id') id: string) {
    return this.adminService.reactivateAliado(id);
  }

  @Post('aliados/:aliadoId/apps/:appId/revoke')
  @ApiOperation({ summary: 'RU-07: Revocar app de un aliado' })
  revokeApp(@Param('aliadoId') aliadoId: string, @Param('appId') appId: string) {
    return this.adminService.revokeApp(aliadoId, appId);
  }
}
