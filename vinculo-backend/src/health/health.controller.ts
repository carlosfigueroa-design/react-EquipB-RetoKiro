import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check del servicio' })
  check() {
    return {
      status: 'ok',
      service: 'VÍNCULO API',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
