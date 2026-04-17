import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AliadoService } from './aliado.service';
import { RegisterAliadoDto } from './dto/register-aliado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Onboarding')
@Controller()
export class AliadoController {
  constructor(private aliadoService: AliadoService) {}

  @Post('v1/vinculo/onboarding/register')
  @ApiOperation({
    summary: 'Golden Path: Registro de aliado con sandbox instantáneo',
    description:
      'Registra un nuevo aliado, crea automáticamente una app sandbox con Client ID y Secret, y activa el acceso inmediato al entorno de pruebas.',
  })
  async register(@Body() dto: RegisterAliadoDto) {
    return this.aliadoService.register(dto);
  }

  @Get('v1/vinculo/aliado/cuotas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar cuotas y límites del aliado' })
  async getQuotas(@Request() req: any) {
    return this.aliadoService.getQuotas(req.user.id);
  }

  @Get('v1/vinculo/aliado/metricas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Métricas de consumo del aliado' })
  async getMetrics(@Request() req: any) {
    return this.aliadoService.getMetrics(req.user.id);
  }
}
