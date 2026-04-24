import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiTags('health')
  @ApiOperation({ summary: 'Health check del backend' })
  @ApiResponse({ status: 200, description: 'Servicio saludable' })
  getHealth() {
    return this.appService.getHealth();
  }
}
