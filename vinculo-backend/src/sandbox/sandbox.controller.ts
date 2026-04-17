import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SandboxService } from './sandbox.service';

@ApiTags('Sandbox')
@Controller('v1/vinculo/sandbox')
export class SandboxController {
  constructor(private sandboxService: SandboxService) {}

  @Post('execute')
  @ApiOperation({
    summary: 'Ejecutar request en sandbox interactivo',
    description:
      'Envía cualquier request al mock engine y recibe una respuesta simulada con trace ID, latencia y headers completos.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        method: { type: 'string', example: 'POST' },
        path: { type: 'string', example: '/v3/vinculo/cotizacion/vida' },
        headers: {
          type: 'object',
          example: { Authorization: 'Bearer sandbox-token' },
        },
        body: {
          type: 'object',
          example: { nombre: 'Juan Pérez', edad: 35, sumaAsegurada: 500000000 },
        },
      },
    },
  })
  async execute(
    @Body()
    body: {
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: any;
    },
  ) {
    return this.sandboxService.execute(body);
  }
}
