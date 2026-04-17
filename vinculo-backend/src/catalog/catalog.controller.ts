import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

const API_CATALOG = [
  {
    id: 'cotizacion-vida',
    name: 'Cotización Vida',
    domain: 'Vida',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/cotizacion/vida',
    summary: 'Genera una cotización de seguro de vida con coberturas y prima calculada',
    tags: ['insurance', 'vida', 'cotizacion'],
  },
  {
    id: 'emision-vida',
    name: 'Emisión Vida',
    domain: 'Vida',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/emision/vida',
    summary: 'Emite una póliza de seguro de vida a partir de una cotización aprobada',
    tags: ['insurance', 'vida', 'emision'],
  },
  {
    id: 'cotizacion-auto',
    name: 'Cotización Auto',
    domain: 'Auto',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/cotizacion/auto',
    summary: 'Genera una cotización de seguro vehicular con coberturas completas',
    tags: ['insurance', 'auto', 'cotizacion'],
  },
  {
    id: 'emision-auto',
    name: 'Emisión Auto',
    domain: 'Auto',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/emision/auto',
    summary: 'Emite una póliza de seguro vehicular',
    tags: ['insurance', 'auto', 'emision'],
  },
  {
    id: 'consultar-poliza',
    name: 'Consultar Póliza',
    domain: 'General',
    version: 'v3',
    method: 'GET',
    path: '/v3/vinculo/poliza/{id}',
    summary: 'Consulta el detalle completo de una póliza por su ID',
    tags: ['insurance', 'poliza', 'consulta'],
  },
  {
    id: 'renovacion-auto',
    name: 'Renovación Auto',
    domain: 'Auto',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/renovacion/auto',
    summary: 'Renueva una póliza de seguro vehicular existente',
    tags: ['insurance', 'auto', 'renovacion'],
  },
  {
    id: 'reportar-siniestro',
    name: 'Reportar Siniestro',
    domain: 'Siniestros',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/siniestro/reportar',
    summary: 'Radica un nuevo siniestro asociado a una póliza',
    tags: ['insurance', 'siniestro'],
  },
  {
    id: 'estado-siniestro',
    name: 'Estado Siniestro',
    domain: 'Siniestros',
    version: 'v3',
    method: 'GET',
    path: '/v3/vinculo/siniestro/{id}/estado',
    summary: 'Consulta el estado y timeline de un siniestro',
    tags: ['insurance', 'siniestro', 'estado'],
  },
  {
    id: 'cotizacion-hogar',
    name: 'Cotización Hogar',
    domain: 'Hogar',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/cotizacion/hogar',
    summary: 'Genera una cotización de seguro de hogar',
    tags: ['insurance', 'hogar', 'cotizacion'],
  },
  {
    id: 'cotizacion-salud',
    name: 'Cotización Salud',
    domain: 'Salud',
    version: 'v3',
    method: 'POST',
    path: '/v3/vinculo/cotizacion/salud',
    summary: 'Genera una cotización de seguro de salud',
    tags: ['insurance', 'salud', 'cotizacion'],
  },
  {
    id: 'auth-token',
    name: 'Obtener Token',
    domain: 'Identity',
    version: 'v2',
    method: 'POST',
    path: '/v2/vinculo/auth/token',
    summary: 'Obtiene un token OAuth 2.0 para autenticación',
    tags: ['auth', 'identity', 'oauth'],
  },
  {
    id: 'auth-refresh',
    name: 'Refrescar Token',
    domain: 'Identity',
    version: 'v2',
    method: 'POST',
    path: '/v2/vinculo/auth/refresh',
    summary: 'Refresca un token de acceso expirado',
    tags: ['auth', 'identity', 'oauth'],
  },
];

@ApiTags('Catalog')
@Controller('v1/vinculo/catalog')
export class CatalogController {
  @Get('apis')
  @ApiOperation({ summary: 'Listar todas las APIs del catálogo OpenX' })
  @ApiQuery({ name: 'domain', required: false, description: 'Filtrar por dominio (Vida, Auto, Hogar, Salud)' })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda por texto' })
  listApis(
    @Query('domain') domain?: string,
    @Query('search') search?: string,
  ) {
    let results = [...API_CATALOG];

    if (domain) {
      results = results.filter(
        (api) => api.domain.toLowerCase() === domain.toLowerCase(),
      );
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (api) =>
          api.name.toLowerCase().includes(q) ||
          api.summary.toLowerCase().includes(q) ||
          api.tags.some((t) => t.includes(q)),
      );
    }

    return {
      total: results.length,
      domains: [...new Set(API_CATALOG.map((a) => a.domain))],
      apis: results,
    };
  }

  @Get('apis/:id')
  @ApiOperation({ summary: 'Detalle de una API específica' })
  getApi(@Param('id') id: string) {
    const api = API_CATALOG.find((a) => a.id === id);
    if (!api) return { error: 'API no encontrada' };
    return {
      ...api,
      changelog: [
        { version: 'v3.0.0', date: '2026-04-01', changes: ['Versión inicial OpenX'] },
      ],
      examples: {
        curl: `curl -X ${api.method} https://sandbox.vinculo.segurosbolivar.com${api.path} \\\n  -H "Authorization: Bearer <token>" \\\n  -H "Content-Type: application/json"`,
      },
    };
  }

  @Get('domains')
  @ApiOperation({ summary: 'Listar dominios de negocio disponibles' })
  listDomains() {
    const domains = [...new Set(API_CATALOG.map((a) => a.domain))];
    return domains.map((d) => ({
      name: d,
      apiCount: API_CATALOG.filter((a) => a.domain === d).length,
    }));
  }
}
