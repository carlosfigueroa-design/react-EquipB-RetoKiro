import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('v1/vinculo/analytics')
export class AnalyticsController {
  @Get('overview')
  @ApiOperation({ summary: 'Resumen general de analítica del portal' })
  getOverview() {
    return {
      totalAliados: 47,
      totalApps: 83,
      totalApiCalls: 1250000,
      avgLatencyMs: 45,
      successRate: 99.2,
      topApis: [
        { endpoint: 'POST /v3/vinculo/cotizacion/auto', calls: 450000 },
        { endpoint: 'POST /v3/vinculo/cotizacion/vida', calls: 320000 },
        { endpoint: 'GET /v3/vinculo/poliza/{id}', calls: 280000 },
        { endpoint: 'POST /v3/vinculo/emision/auto', calls: 120000 },
        { endpoint: 'POST /v3/vinculo/siniestro/reportar', calls: 80000 },
      ],
      slaCompliance: 99.97,
    };
  }
}
