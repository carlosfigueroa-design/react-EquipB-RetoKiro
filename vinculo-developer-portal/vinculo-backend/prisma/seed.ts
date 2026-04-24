import {
  PrismaClient,
  UserRole,
  UserStatus,
  ApiProduct,
  ApiProcess,
  ApiLifecycleState,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildOpenApiSpec(api: {
  name: string;
  description: string;
  version: string;
  basePath: string;
  endpoints: Array<{
    path: string;
    method: string;
    summary: string;
    operationId: string;
  }>;
}): object {
  const paths: Record<string, Record<string, object>> = {};

  for (const ep of api.endpoints) {
    if (!paths[ep.path]) paths[ep.path] = {};
    paths[ep.path][ep.method.toLowerCase()] = {
      summary: ep.summary,
      operationId: ep.operationId,
      tags: [api.name],
      parameters: [],
      requestBody:
        ep.method !== 'GET'
          ? {
              required: true,
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            }
          : undefined,
      responses: {
        '200': { description: 'Operación exitosa' },
        '400': { description: 'Solicitud inválida' },
        '401': { description: 'No autorizado' },
        '500': { description: 'Error interno del servidor' },
      },
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: api.name,
      description: api.description,
      version: api.version,
      contact: {
        name: 'Equipo TI Seguros Bolívar',
        email: 'ti-apis@segurosbolivar.com',
      },
    },
    servers: [
      {
        url: `https://api.segurosbolivar.com${api.basePath}`,
        description: 'Producción',
      },
      {
        url: `https://sandbox.segurosbolivar.com${api.basePath}`,
        description: 'Sandbox',
      },
    ],
    paths,
  };
}

// ─── API Definitions ─────────────────────────────────────

interface ApiSeedData {
  name: string;
  description: string;
  product: ApiProduct;
  process: ApiProcess;
  currentVersion: string;
  contactName: string;
  contactEmail: string;
  contactSlack: string;
  basePath: string;
  endpoints: Array<{
    path: string;
    method: string;
    summary: string;
    operationId: string;
  }>;
}

const apiDefinitions: ApiSeedData[] = [
  // ─── VIDA (4 APIs) ──────────────────────────────────────
  {
    name: 'Cotización Vida Individual',
    description:
      'API para generar cotizaciones de seguros de vida individual. Permite calcular primas según edad, cobertura y beneficiarios.',
    product: ApiProduct.VIDA,
    process: ApiProcess.COTIZACION,
    currentVersion: '1.2.0',
    contactName: 'Equipo TI Vida',
    contactEmail: 'ti-vida@segurosbolivar.com',
    contactSlack: '#ti-vida-apis',
    basePath: '/v1/vida/cotizacion',
    endpoints: [
      {
        path: '/cotizar',
        method: 'POST',
        summary: 'Generar cotización de vida individual',
        operationId: 'cotizarVidaIndividual',
      },
      {
        path: '/cotizar/{cotizacionId}',
        method: 'GET',
        summary: 'Consultar cotización por ID',
        operationId: 'getCotizacionVida',
      },
    ],
  },
  {
    name: 'Emisión Póliza Vida',
    description:
      'API para la emisión de pólizas de seguros de vida. Gestiona la creación y activación de pólizas a partir de cotizaciones aprobadas.',
    product: ApiProduct.VIDA,
    process: ApiProcess.EMISION,
    currentVersion: '1.0.0',
    contactName: 'Equipo TI Vida',
    contactEmail: 'ti-vida@segurosbolivar.com',
    contactSlack: '#ti-vida-apis',
    basePath: '/v1/vida/emision',
    endpoints: [
      {
        path: '/emitir',
        method: 'POST',
        summary: 'Emitir póliza de vida',
        operationId: 'emitirPolizaVida',
      },
      {
        path: '/emitir/{emisionId}/estado',
        method: 'GET',
        summary: 'Consultar estado de emisión',
        operationId: 'getEstadoEmisionVida',
      },
    ],
  },
  {
    name: 'Gestión Pólizas Vida',
    description:
      'API para consultar y gestionar pólizas de vida activas. Incluye consulta de coberturas, beneficiarios y estado de la póliza.',
    product: ApiProduct.VIDA,
    process: ApiProcess.POLIZA,
    currentVersion: '2.1.0',
    contactName: 'Equipo TI Vida',
    contactEmail: 'ti-vida@segurosbolivar.com',
    contactSlack: '#ti-vida-apis',
    basePath: '/v2/vida/polizas',
    endpoints: [
      {
        path: '/{polizaId}',
        method: 'GET',
        summary: 'Consultar póliza de vida por ID',
        operationId: 'getPolizaVida',
      },
      {
        path: '/{polizaId}/beneficiarios',
        method: 'GET',
        summary: 'Listar beneficiarios de la póliza',
        operationId: 'getBeneficiariosVida',
      },
    ],
  },
  {
    name: 'Siniestros Vida',
    description:
      'API para el reporte y seguimiento de siniestros de seguros de vida. Permite radicar reclamaciones y consultar el estado del trámite.',
    product: ApiProduct.VIDA,
    process: ApiProcess.SINIESTRO,
    currentVersion: '1.1.0',
    contactName: 'Equipo TI Vida',
    contactEmail: 'ti-vida@segurosbolivar.com',
    contactSlack: '#ti-vida-apis',
    basePath: '/v1/vida/siniestros',
    endpoints: [
      {
        path: '/radicar',
        method: 'POST',
        summary: 'Radicar siniestro de vida',
        operationId: 'radicarSiniestroVida',
      },
      {
        path: '/{siniestroId}',
        method: 'GET',
        summary: 'Consultar estado del siniestro',
        operationId: 'getSiniestroVida',
      },
    ],
  },

  // ─── AUTO (4 APIs) ──────────────────────────────────────
  {
    name: 'Cotización Seguro Auto',
    description:
      'API para generar cotizaciones de seguros de automóvil. Calcula primas según tipo de vehículo, modelo, uso y coberturas seleccionadas.',
    product: ApiProduct.AUTO,
    process: ApiProcess.COTIZACION,
    currentVersion: '2.0.0',
    contactName: 'Equipo TI Auto',
    contactEmail: 'ti-auto@segurosbolivar.com',
    contactSlack: '#ti-auto-apis',
    basePath: '/v2/auto/cotizacion',
    endpoints: [
      {
        path: '/cotizar',
        method: 'POST',
        summary: 'Generar cotización de seguro auto',
        operationId: 'cotizarAuto',
      },
      {
        path: '/cotizar/{cotizacionId}',
        method: 'GET',
        summary: 'Consultar cotización auto por ID',
        operationId: 'getCotizacionAuto',
      },
    ],
  },
  {
    name: 'Emisión Póliza Auto',
    description:
      'API para la emisión de pólizas de seguro de automóvil. Gestiona la creación de pólizas todo riesgo y SOAT a partir de cotizaciones.',
    product: ApiProduct.AUTO,
    process: ApiProcess.EMISION,
    currentVersion: '1.3.0',
    contactName: 'Equipo TI Auto',
    contactEmail: 'ti-auto@segurosbolivar.com',
    contactSlack: '#ti-auto-apis',
    basePath: '/v1/auto/emision',
    endpoints: [
      {
        path: '/emitir',
        method: 'POST',
        summary: 'Emitir póliza de auto',
        operationId: 'emitirPolizaAuto',
      },
      {
        path: '/emitir/{emisionId}/documentos',
        method: 'GET',
        summary: 'Obtener documentos de la póliza',
        operationId: 'getDocumentosAuto',
      },
    ],
  },
  {
    name: 'Renovación Auto',
    description:
      'API para gestionar la renovación de pólizas de seguro de automóvil. Permite consultar pólizas próximas a vencer y ejecutar renovaciones automáticas.',
    product: ApiProduct.AUTO,
    process: ApiProcess.RENOVACION,
    currentVersion: '1.0.0',
    contactName: 'Equipo TI Auto',
    contactEmail: 'ti-auto@segurosbolivar.com',
    contactSlack: '#ti-auto-apis',
    basePath: '/v1/auto/renovacion',
    endpoints: [
      {
        path: '/renovar',
        method: 'POST',
        summary: 'Renovar póliza de auto',
        operationId: 'renovarPolizaAuto',
      },
      {
        path: '/proximas-vencer',
        method: 'GET',
        summary: 'Listar pólizas próximas a vencer',
        operationId: 'getProximasVencerAuto',
      },
    ],
  },
  {
    name: 'Siniestros Auto',
    description:
      'API para el reporte y seguimiento de siniestros de automóvil. Incluye reporte de accidentes, asignación de talleres y seguimiento de reparaciones.',
    product: ApiProduct.AUTO,
    process: ApiProcess.SINIESTRO,
    currentVersion: '1.5.0',
    contactName: 'Equipo TI Auto',
    contactEmail: 'ti-auto@segurosbolivar.com',
    contactSlack: '#ti-auto-apis',
    basePath: '/v1/auto/siniestros',
    endpoints: [
      {
        path: '/reportar',
        method: 'POST',
        summary: 'Reportar siniestro de auto',
        operationId: 'reportarSiniestroAuto',
      },
      {
        path: '/{siniestroId}/talleres',
        method: 'GET',
        summary: 'Consultar talleres asignados',
        operationId: 'getTalleresAuto',
      },
    ],
  },

  // ─── HOGAR (3 APIs) ─────────────────────────────────────
  {
    name: 'Cotización Seguro Hogar',
    description:
      'API para generar cotizaciones de seguros de hogar. Calcula primas según tipo de inmueble, ubicación, estrato y coberturas adicionales.',
    product: ApiProduct.HOGAR,
    process: ApiProcess.COTIZACION,
    currentVersion: '1.0.0',
    contactName: 'Equipo TI Hogar',
    contactEmail: 'ti-hogar@segurosbolivar.com',
    contactSlack: '#ti-hogar-apis',
    basePath: '/v1/hogar/cotizacion',
    endpoints: [
      {
        path: '/cotizar',
        method: 'POST',
        summary: 'Generar cotización de seguro hogar',
        operationId: 'cotizarHogar',
      },
      {
        path: '/cotizar/{cotizacionId}',
        method: 'GET',
        summary: 'Consultar cotización hogar por ID',
        operationId: 'getCotizacionHogar',
      },
    ],
  },
  {
    name: 'Emisión Póliza Hogar',
    description:
      'API para la emisión de pólizas de seguro de hogar. Gestiona la creación de pólizas con coberturas contra incendio, robo, daños por agua y eventos naturales.',
    product: ApiProduct.HOGAR,
    process: ApiProcess.EMISION,
    currentVersion: '1.1.0',
    contactName: 'Equipo TI Hogar',
    contactEmail: 'ti-hogar@segurosbolivar.com',
    contactSlack: '#ti-hogar-apis',
    basePath: '/v1/hogar/emision',
    endpoints: [
      {
        path: '/emitir',
        method: 'POST',
        summary: 'Emitir póliza de hogar',
        operationId: 'emitirPolizaHogar',
      },
      {
        path: '/emitir/{emisionId}/coberturas',
        method: 'GET',
        summary: 'Consultar coberturas de la póliza',
        operationId: 'getCoberturasHogar',
      },
    ],
  },
  {
    name: 'Siniestros Hogar',
    description:
      'API para el reporte y seguimiento de siniestros de hogar. Permite reportar daños, solicitar inspecciones y hacer seguimiento de indemnizaciones.',
    product: ApiProduct.HOGAR,
    process: ApiProcess.SINIESTRO,
    currentVersion: '1.0.0',
    contactName: 'Equipo TI Hogar',
    contactEmail: 'ti-hogar@segurosbolivar.com',
    contactSlack: '#ti-hogar-apis',
    basePath: '/v1/hogar/siniestros',
    endpoints: [
      {
        path: '/reportar',
        method: 'POST',
        summary: 'Reportar siniestro de hogar',
        operationId: 'reportarSiniestroHogar',
      },
      {
        path: '/{siniestroId}/inspeccion',
        method: 'POST',
        summary: 'Solicitar inspección del siniestro',
        operationId: 'solicitarInspeccionHogar',
      },
    ],
  },

  // ─── SALUD (3 APIs) ─────────────────────────────────────
  {
    name: 'Cotización Seguro Salud',
    description:
      'API para generar cotizaciones de seguros de salud y medicina prepagada. Calcula primas según edad, grupo familiar, preexistencias y plan seleccionado.',
    product: ApiProduct.SALUD,
    process: ApiProcess.COTIZACION,
    currentVersion: '1.0.0',
    contactName: 'Equipo TI Salud',
    contactEmail: 'ti-salud@segurosbolivar.com',
    contactSlack: '#ti-salud-apis',
    basePath: '/v1/salud/cotizacion',
    endpoints: [
      {
        path: '/cotizar',
        method: 'POST',
        summary: 'Generar cotización de seguro salud',
        operationId: 'cotizarSalud',
      },
      {
        path: '/planes',
        method: 'GET',
        summary: 'Listar planes de salud disponibles',
        operationId: 'getPlanesSalud',
      },
    ],
  },
  {
    name: 'Emisión Póliza Salud',
    description:
      'API para la emisión de pólizas de seguro de salud. Gestiona la afiliación de titulares y beneficiarios con validación de preexistencias médicas.',
    product: ApiProduct.SALUD,
    process: ApiProcess.EMISION,
    currentVersion: '1.2.0',
    contactName: 'Equipo TI Salud',
    contactEmail: 'ti-salud@segurosbolivar.com',
    contactSlack: '#ti-salud-apis',
    basePath: '/v1/salud/emision',
    endpoints: [
      {
        path: '/emitir',
        method: 'POST',
        summary: 'Emitir póliza de salud',
        operationId: 'emitirPolizaSalud',
      },
      {
        path: '/emitir/{emisionId}/beneficiarios',
        method: 'POST',
        summary: 'Agregar beneficiarios a la póliza',
        operationId: 'agregarBeneficiariosSalud',
      },
    ],
  },
  {
    name: 'Validación Preexistencias Salud',
    description:
      'API para la validación de preexistencias médicas en el proceso de suscripción de seguros de salud. Consulta historial clínico y evalúa riesgos.',
    product: ApiProduct.SALUD,
    process: ApiProcess.VALIDACION,
    currentVersion: '1.0.0',
    contactName: 'Equipo TI Salud',
    contactEmail: 'ti-salud@segurosbolivar.com',
    contactSlack: '#ti-salud-apis',
    basePath: '/v1/salud/validacion',
    endpoints: [
      {
        path: '/preexistencias',
        method: 'POST',
        summary: 'Validar preexistencias médicas',
        operationId: 'validarPreexistencias',
      },
      {
        path: '/preexistencias/{validacionId}',
        method: 'GET',
        summary: 'Consultar resultado de validación',
        operationId: 'getResultadoValidacion',
      },
    ],
  },
];

// ─── Main Seed Function ──────────────────────────────────

async function main() {
  console.log('🌱 Seeding VÍNCULO Developer Portal database...\n');

  // 1. Crear usuario ADMIN por defecto
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@segurosbolivar.com' },
    update: {
      name: 'Administrador VÍNCULO',
      company: 'Seguros Bolívar',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin@segurosbolivar.com',
      name: 'Administrador VÍNCULO',
      company: 'Seguros Bolívar',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`✅ Usuario ADMIN creado: ${adminUser.email} (${adminUser.id})`);

  // 2. Crear APIs por línea de producto
  let totalApis = 0;

  for (const apiDef of apiDefinitions) {
    const slug = slugify(apiDef.name);
    const specOpenApi = buildOpenApiSpec({
      name: apiDef.name,
      description: apiDef.description,
      version: apiDef.currentVersion,
      basePath: apiDef.basePath,
      endpoints: apiDef.endpoints,
    });

    const api = await prisma.api.upsert({
      where: { slug },
      update: {
        name: apiDef.name,
        description: apiDef.description,
        product: apiDef.product,
        process: apiDef.process,
        currentVersion: apiDef.currentVersion,
        lifecycleState: ApiLifecycleState.ACTIVE,
        slaUptime: 99.9,
        specOpenApi,
        contactName: apiDef.contactName,
        contactEmail: apiDef.contactEmail,
        contactSlack: apiDef.contactSlack,
      },
      create: {
        name: apiDef.name,
        slug,
        description: apiDef.description,
        product: apiDef.product,
        process: apiDef.process,
        currentVersion: apiDef.currentVersion,
        lifecycleState: ApiLifecycleState.ACTIVE,
        slaUptime: 99.9,
        specOpenApi,
        contactName: apiDef.contactName,
        contactEmail: apiDef.contactEmail,
        contactSlack: apiDef.contactSlack,
      },
    });

    totalApis++;
    console.log(
      `  📦 [${apiDef.product}] ${api.name} (${api.slug}) — v${apiDef.currentVersion}`,
    );
  }

  // 3. Resumen
  const countByProduct = apiDefinitions.reduce(
    (acc, api) => {
      acc[api.product] = (acc[api.product] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(`\n✅ ${totalApis} APIs creadas:`);
  for (const [product, count] of Object.entries(countByProduct)) {
    console.log(`   ${product}: ${count} APIs`);
  }

  console.log('\n🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
