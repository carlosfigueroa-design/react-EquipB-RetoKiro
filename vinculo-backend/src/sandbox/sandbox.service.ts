import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SandboxService {
  async execute(request: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }) {
    const startTime = Date.now();

    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 150 + 20),
    );

    const latencyMs = Date.now() - startTime;
    const traceId = uuidv4();

    // Generate mock response based on path
    const responseBody = this.generateMockResponse(request.method, request.path, request.body);

    return {
      traceId,
      request: {
        method: request.method,
        path: request.path,
        headers: request.headers || {},
        body: request.body || {},
        timestamp: new Date().toISOString(),
      },
      response: {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'x-trace-id': traceId,
          'x-latency-ms': String(latencyMs),
          'x-sandbox': 'true',
          'x-rate-limit-remaining': '9999',
        },
        body: responseBody,
        latencyMs,
      },
    };
  }

  private generateMockResponse(method: string, path: string, body?: any): any {
    if (path.includes('cotizacion')) {
      return {
        cotizacionId: uuidv4(),
        estado: 'COTIZADO',
        primaAnual: Math.floor(Math.random() * 5000000) + 1000000,
        primaMensual: Math.floor(Math.random() * 420000) + 85000,
        validezDias: 30,
        mensaje: 'Cotización generada exitosamente en sandbox',
      };
    }

    if (path.includes('emision')) {
      return {
        polizaId: uuidv4(),
        numero: `VB-SBX-${Date.now()}`,
        estado: 'EMITIDA',
        mensaje: 'Póliza emitida exitosamente en sandbox',
      };
    }

    if (path.includes('siniestro')) {
      return {
        siniestroId: uuidv4(),
        estado: 'RADICADO',
        mensaje: 'Siniestro procesado en sandbox',
      };
    }

    return {
      message: 'Sandbox response',
      method,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
