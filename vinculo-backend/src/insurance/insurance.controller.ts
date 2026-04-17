import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MockEngineService } from './mock-engine.service';

@ApiTags('Insurance')
@Controller('v3/vinculo')
export class InsuranceController {
  constructor(private mockEngine: MockEngineService) {}

  @Post('cotizacion/vida')
  @ApiOperation({ summary: 'Cotizar seguro de vida' })
  cotizacionVida(@Body() body: any) {
    return this.mockEngine.cotizacionVida(body);
  }

  @Post('emision/vida')
  @ApiOperation({ summary: 'Emitir póliza de vida' })
  emisionVida(@Body() body: any) {
    return this.mockEngine.emisionVida(body);
  }

  @Post('cotizacion/auto')
  @ApiOperation({ summary: 'Cotizar seguro de auto' })
  cotizacionAuto(@Body() body: any) {
    return this.mockEngine.cotizacionAuto(body);
  }

  @Post('emision/auto')
  @ApiOperation({ summary: 'Emitir póliza de auto' })
  emisionAuto(@Body() body: any) {
    return this.mockEngine.emisionAuto(body);
  }

  @Get('poliza/:id')
  @ApiOperation({ summary: 'Consultar póliza por ID' })
  consultarPoliza(@Param('id') id: string) {
    return this.mockEngine.consultarPoliza(id);
  }

  @Post('renovacion/auto')
  @ApiOperation({ summary: 'Renovar póliza de auto' })
  renovacionAuto(@Body() body: any) {
    return { ...this.mockEngine.emisionAuto(body), tipo: 'RENOVACION' };
  }

  @Post('siniestro/reportar')
  @ApiOperation({ summary: 'Reportar un siniestro' })
  reportarSiniestro(@Body() body: any) {
    return this.mockEngine.reportarSiniestro(body);
  }

  @Get('siniestro/:id/estado')
  @ApiOperation({ summary: 'Consultar estado de siniestro' })
  estadoSiniestro(@Param('id') id: string) {
    return this.mockEngine.estadoSiniestro(id);
  }

  @Post('cotizacion/hogar')
  @ApiOperation({ summary: 'Cotizar seguro de hogar' })
  cotizacionHogar(@Body() body: any) {
    return this.mockEngine.cotizacionHogar(body);
  }

  @Post('cotizacion/salud')
  @ApiOperation({ summary: 'Cotizar seguro de salud' })
  cotizacionSalud(@Body() body: any) {
    return this.mockEngine.cotizacionSalud(body);
  }
}
