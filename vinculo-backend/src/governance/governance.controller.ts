import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GovernanceService } from './governance.service';

@ApiTags('Governance')
@Controller('v1/vinculo/governance')
export class GovernanceController {
  constructor(private governanceService: GovernanceService) {}

  @Get('versions')
  @ApiOperation({ summary: 'RU-09: Listar versiones de APIs' })
  @ApiQuery({ name: 'apiName', required: false })
  listVersions(@Query('apiName') apiName?: string) {
    return this.governanceService.listVersions(apiName);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'RU-09: Timeline de versiones (activas, deprecadas, retiradas)' })
  getTimeline() {
    return this.governanceService.getTimeline();
  }

  @Post('versions/publish')
  @ApiOperation({ summary: 'RU-09: Publicar nueva versión de API' })
  publishVersion(@Body() body: { apiName: string; version: string; changelog?: string }) {
    return this.governanceService.publishVersion(body);
  }

  @Post('versions/deprecate')
  @ApiOperation({ summary: 'RU-09: Deprecar versión con fecha de sunset' })
  deprecateVersion(@Body() body: { apiName: string; version: string; sunsetDate: string; notice?: string }) {
    return this.governanceService.deprecateVersion(body.apiName, body.version, body.sunsetDate, body.notice);
  }

  @Post('versions/sunset')
  @ApiOperation({ summary: 'RU-09: Retirar versión definitivamente' })
  sunsetVersion(@Body() body: { apiName: string; version: string }) {
    return this.governanceService.sunsetVersion(body.apiName, body.version);
  }
}
