/**
 * VÍNCULO — Catálogo de APIs estático para modo desarrollo.
 * Datos realistas de seguros colombianos con especificaciones OpenAPI.
 */

export interface CatalogApi {
  id: string;
  name: string;
  slug: string;
  description: string;
  descriptionLong: string;
  product: 'VIDA' | 'AUTO' | 'HOGAR' | 'SALUD' | 'OPEN_FINANCE' | 'IDENTITY_SECURITY';
  process: string;
  currentVersion: string;
  lifecycleState: 'ACTIVE' | 'DEPRECATED' | 'DRAFT' | 'SUNSET';
  slaUptime: number;
  contactName: string;
  contactEmail: string;
  contactArea: string;
  icon: string;
  useCases: string[];
  endpoints: ApiEndpoint[];
  codeSnippets: Record<string, string>;
  sandboxConfig: SandboxPreset;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  requestBody?: string;
  responseExample?: string;
  parameters?: { name: string; in: string; required: boolean; description: string }[];
}

export interface SandboxPreset {
  defaultEndpoint: string;
  defaultMethod: string;
  defaultBody: string;
  scenarios: { value: string; label: string; status: number }[];
}

const PRODUCT_LABELS: Record<string, string> = {
  VIDA: 'Vida',
  AUTO: 'Auto',
  HOGAR: 'Hogar',
  SALUD: 'Salud',
  OPEN_FINANCE: 'Open Finance',
  IDENTITY_SECURITY: 'Identidad',
};

const PROCESS_LABELS: Record<string, string> = {
  EMISION: 'Emisión',
  COTIZACION: 'Cotización',
  RENOVACION: 'Renovación',
  SINIESTRO: 'Siniestros',
  CONSULTAS: 'Consultas',
  CANCELACION: 'Cancelación',
  VALIDACION: 'Validación',
  PAGOS: 'Pagos',
  AUTH: 'Autenticación',
  KYC: 'KYC',
};

export { PRODUCT_LABELS, PROCESS_LABELS };

export const CATALOG_APIS: CatalogApi[] = [
  {
    id: 'api-emision-polizas',
    name: 'API de Emisión de Pólizas',
    slug: 'emision-polizas',
    description: 'Emisión y generación de pólizas de seguros',
    descriptionLong: 'API para la emisión y generación de nuevas pólizas de seguros de Seguros Bolívar. Permite crear pólizas de vida, hogar, auto y salud proporcionando los datos del asegurado, tipo de cobertura y plan seleccionado. Incluye validación de datos, cálculo de prima y generación de certificado digital.',
    product: 'VIDA',
    process: 'EMISION',
    currentVersion: '1.2.0',
    lifecycleState: 'DEPRECATED',
    slaUptime: 99.9,
    contactName: 'Equipo Core Seguros',
    contactEmail: 'core-seguros@segurosbolivar.com',
    contactArea: 'Tecnología',
    icon: '📄',
    useCases: [
      'Emitir póliza nueva de vida, hogar o auto',
      'Generar certificado digital de póliza',
      'Validar datos del asegurado antes de emisión',
    ],
    endpoints: [
      {
        method: 'POST',
        path: '/v1/polizas/emitir',
        summary: 'Emitir nueva póliza',
        description: 'Crea una nueva póliza de seguros con los datos del asegurado y plan seleccionado.',
        requestBody: JSON.stringify({
          asegurado: { nombre: "Juan Carlos Pérez López", documento: "1234567890", tipoDocumento: "CC", fechaNacimiento: "1985-03-15", email: "juan.perez@email.com", telefono: "3001234567" },
          plan: { nombre: "Vida Plus", cobertura: "Muerte + Incapacidad", primaAnual: 2450000 },
          vigencia: { inicio: "2026-07-01", fin: "2027-07-01" }
        }, null, 2),
        responseExample: JSON.stringify({
          success: true,
          data: { polizaId: "POL-2026-001234", estado: "Emitida", asegurado: { nombre: "Juan Carlos Pérez López", documento: "1234567890", tipoDocumento: "CC" }, plan: { nombre: "Vida Plus", cobertura: "Muerte + Incapacidad", primaAnual: 2450000 }, vigencia: { inicio: "2026-07-01", fin: "2027-07-01" }, certificadoUrl: "https://docs.segurosbolivar.com/cert/POL-2026-001234.pdf" }
        }, null, 2),
      },
      {
        method: 'GET',
        path: '/v1/polizas/{polizaId}',
        summary: 'Consultar póliza',
        description: 'Obtiene el detalle completo de una póliza por su ID.',
        parameters: [{ name: 'polizaId', in: 'path', required: true, description: 'ID de la póliza' }],
      },
    ],
    codeSnippets: {
      curl: `curl -X POST https://sandbox.segurosbolivar.com/v1/polizas/emitir \\\n  -H "Authorization: Bearer {token}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"asegurado": {"nombre": "Juan Pérez", "documento": "1234567890", "tipoDocumento": "CC"}, "plan": {"codigo": "vida-plus"}, "vigencia": {"inicio": "2026-07-01"}}'`,
      javascript: `const response = await fetch('https://sandbox.segurosbolivar.com/v1/polizas/emitir', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ' + token,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    asegurado: { nombre: 'Juan Pérez', documento: '1234567890', tipoDocumento: 'CC' },\n    plan: { codigo: 'vida-plus' },\n    vigencia: { inicio: '2026-07-01' }\n  })\n});\nconst data = await response.json();`,
      python: `import requests\n\nresponse = requests.post(\n    'https://sandbox.segurosbolivar.com/v1/polizas/emitir',\n    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},\n    json={\n        'asegurado': {'nombre': 'Juan Pérez', 'documento': '1234567890', 'tipoDocumento': 'CC'},\n        'plan': {'codigo': 'vida-plus'},\n        'vigencia': {'inicio': '2026-07-01'}\n    }\n)\ndata = response.json()`,
    },
    sandboxConfig: {
      defaultEndpoint: '/v1/polizas/emitir',
      defaultMethod: 'POST',
      defaultBody: JSON.stringify({ asegurado: { nombre: "Juan Pérez", documento: "1234567890", tipoDocumento: "CC" }, plan: { nombre: "Vida Plus", cobertura: "Muerte + Incapacidad" }, vigencia: { inicio: "2026-07-01" } }, null, 2),
      scenarios: [
        { value: '', label: '200 — Éxito', status: 200 },
        { value: 'bad_request', label: '400 — Bad Request', status: 400 },
        { value: 'unauthorized', label: '401 — Unauthorized', status: 401 },
        { value: 'not_found', label: '404 — Not Found', status: 404 },
        { value: 'internal_error', label: '500 — Internal Server Error', status: 500 },
      ],
    },
  },
  {
    id: 'api-renovacion-polizas',
    name: 'API de Renovación de Pólizas',
    slug: 'renovacion-polizas',
    description: 'Renovación automática y manual de pólizas vigentes',
    descriptionLong: 'API para gestionar la renovación de pólizas de seguros. Soporta renovación automática al vencimiento y renovación manual anticipada. Incluye recálculo de prima, actualización de coberturas y generación de nuevo certificado.',
    product: 'VIDA',
    process: 'RENOVACION',
    currentVersion: '2.0.1',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.95,
    contactName: 'Equipo Renovaciones',
    contactEmail: 'renovaciones@segurosbolivar.com',
    contactArea: 'Operaciones',
    icon: '🔄',
    useCases: ['Renovar póliza al vencimiento', 'Renovación anticipada con ajuste de prima', 'Actualizar coberturas en renovación'],
    endpoints: [
      { method: 'POST', path: '/v2/polizas/{polizaId}/renovar', summary: 'Renovar póliza', description: 'Renueva una póliza existente con recálculo de prima.', requestBody: JSON.stringify({ ajustePrima: true, nuevasCoberturas: ["asistencia-viaje"] }, null, 2) },
      { method: 'GET', path: '/v2/polizas/proximas-vencer', summary: 'Pólizas próximas a vencer', description: 'Lista pólizas que vencen en los próximos 30 días.' },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v2/polizas/POL-001/renovar -H "Authorization: Bearer {token}"' },
    sandboxConfig: { defaultEndpoint: '/v2/polizas/POL-001/renovar', defaultMethod: 'POST', defaultBody: '{\n  "ajustePrima": true\n}', scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'not_found', label: '404 — Póliza no encontrada', status: 404 }] },
  },
  {
    id: 'api-registro-siniestros',
    name: 'API de Registro de Siniestros',
    slug: 'registro-siniestros',
    description: 'Registro y radicación de nuevos siniestros',
    descriptionLong: 'API para el registro, radicación y seguimiento de siniestros de seguros. Permite reportar siniestros de todas las líneas de producto con documentación adjunta, seguimiento de estado y estimación de indemnización.',
    product: 'AUTO',
    process: 'SINIESTRO',
    currentVersion: '1.5.0',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.9,
    contactName: 'Equipo Siniestros',
    contactEmail: 'siniestros@segurosbolivar.com',
    contactArea: 'Indemnizaciones',
    icon: '⚠️',
    useCases: ['Radicar siniestro vehicular', 'Adjuntar documentación de soporte', 'Consultar estado del siniestro'],
    endpoints: [
      { method: 'POST', path: '/v1/siniestros/radicar', summary: 'Radicar siniestro', description: 'Registra un nuevo siniestro con datos del evento.', requestBody: JSON.stringify({ polizaId: "POL-2026-001234", tipoSiniestro: "accidente-vehicular", fechaEvento: "2026-04-15", descripcion: "Colisión en intersección", ubicacion: { ciudad: "Bogotá", direccion: "Calle 100 con Carrera 15" } }, null, 2) },
      { method: 'GET', path: '/v1/siniestros/{siniestroId}', summary: 'Consultar siniestro', description: 'Obtiene el estado y detalle de un siniestro.' },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v1/siniestros/radicar -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{"polizaId": "POL-001", "tipoSiniestro": "accidente-vehicular"}\'' },
    sandboxConfig: { defaultEndpoint: '/v1/siniestros/radicar', defaultMethod: 'POST', defaultBody: JSON.stringify({ polizaId: "POL-2026-001234", tipoSiniestro: "accidente-vehicular", fechaEvento: "2026-04-15", descripcion: "Colisión en intersección" }, null, 2), scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'bad_request', label: '400 — Datos incompletos', status: 400 }] },
  },
  {
    id: 'api-cotizacion-seguros',
    name: 'API de Cotización de Seguros',
    slug: 'cotizacion-seguros',
    description: 'Cotización de seguros en tiempo real con cálculo de primas',
    descriptionLong: 'API para generar cotizaciones de seguros en tiempo real. Soporta cotización de vida, auto, hogar y salud con cálculo automático de prima basado en perfil de riesgo, coberturas seleccionadas y datos del asegurado. Incluye comparación de planes y descuentos aplicables.',
    product: 'VIDA',
    process: 'COTIZACION',
    currentVersion: '3.1.0',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.95,
    contactName: 'Equipo Cotizaciones',
    contactEmail: 'cotizaciones@segurosbolivar.com',
    contactArea: 'Comercial',
    icon: '💰',
    useCases: ['Cotizar seguro de vida individual', 'Comparar planes y coberturas', 'Calcular prima con descuentos'],
    endpoints: [
      { method: 'POST', path: '/v3/cotizaciones/generar', summary: 'Generar cotización', description: 'Genera una cotización con cálculo de prima en tiempo real.', requestBody: JSON.stringify({ producto: "vida", asegurado: { edad: 35, genero: "M", fumador: false }, coberturas: ["muerte", "incapacidad"], sumaAsegurada: 200000000 }, null, 2) },
      { method: 'GET', path: '/v3/cotizaciones/{cotizacionId}', summary: 'Consultar cotización', description: 'Obtiene el detalle de una cotización generada.' },
      { method: 'GET', path: '/v3/planes', summary: 'Listar planes', description: 'Lista los planes disponibles por producto.' },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v3/cotizaciones/generar -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{"producto": "vida", "asegurado": {"edad": 35}}\'' },
    sandboxConfig: { defaultEndpoint: '/v3/cotizaciones/generar', defaultMethod: 'POST', defaultBody: JSON.stringify({ producto: "vida", asegurado: { edad: 35, genero: "M", fumador: false }, coberturas: ["muerte", "incapacidad"], sumaAsegurada: 200000000 }, null, 2), scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'bad_request', label: '400 — Datos inválidos', status: 400 }] },
  },
  {
    id: 'api-consulta-polizas',
    name: 'API de Consulta de Pólizas',
    slug: 'consulta-polizas',
    description: 'Consulta de información detallada de pólizas',
    descriptionLong: 'API para consultar información detallada de pólizas de seguros. Permite buscar por número de póliza, documento del asegurado o filtros avanzados. Retorna coberturas, estado, vigencia, historial de pagos y documentos asociados.',
    product: 'HOGAR',
    process: 'CONSULTAS',
    currentVersion: '2.3.0',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.99,
    contactName: 'Equipo Consultas',
    contactEmail: 'consultas@segurosbolivar.com',
    contactArea: 'Servicio al Cliente',
    icon: '🔍',
    useCases: ['Consultar póliza por número', 'Buscar pólizas por documento', 'Obtener historial de pagos'],
    endpoints: [
      { method: 'GET', path: '/v2/polizas/{polizaId}', summary: 'Detalle de póliza', description: 'Obtiene información completa de una póliza.' },
      { method: 'GET', path: '/v2/polizas/buscar', summary: 'Buscar pólizas', description: 'Busca pólizas por documento o filtros.', parameters: [{ name: 'documento', in: 'query', required: false, description: 'Documento del asegurado' }, { name: 'estado', in: 'query', required: false, description: 'Estado de la póliza' }] },
    ],
    codeSnippets: { curl: 'curl https://sandbox.segurosbolivar.com/v2/polizas/POL-001 -H "Authorization: Bearer {token}"' },
    sandboxConfig: { defaultEndpoint: '/v2/polizas/POL-2026-001234', defaultMethod: 'GET', defaultBody: '', scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'not_found', label: '404 — Póliza no encontrada', status: 404 }] },
  },
  {
    id: 'api-cancelacion-polizas',
    name: 'API de Cancelación de Pólizas',
    slug: 'cancelacion-polizas',
    description: 'Cancelación y gestión de rescate de pólizas',
    descriptionLong: 'API para gestionar la cancelación de pólizas de seguros. Soporta cancelación voluntaria, cancelación por mora y cálculo de valor de rescate. Incluye validación de período de gracia y generación de paz y salvo.',
    product: 'VIDA',
    process: 'CANCELACION',
    currentVersion: '1.0.0',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.9,
    contactName: 'Equipo Retención',
    contactEmail: 'retencion@segurosbolivar.com',
    contactArea: 'Operaciones',
    icon: '🚫',
    useCases: ['Cancelar póliza voluntariamente', 'Calcular valor de rescate', 'Generar paz y salvo'],
    endpoints: [
      { method: 'POST', path: '/v1/polizas/{polizaId}/cancelar', summary: 'Cancelar póliza', description: 'Cancela una póliza y calcula valor de rescate.', requestBody: JSON.stringify({ motivo: "voluntaria", fechaCancelacion: "2026-06-01" }, null, 2) },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v1/polizas/POL-001/cancelar -H "Authorization: Bearer {token}"' },
    sandboxConfig: { defaultEndpoint: '/v1/polizas/POL-001/cancelar', defaultMethod: 'POST', defaultBody: JSON.stringify({ motivo: "voluntaria", fechaCancelacion: "2026-06-01" }, null, 2), scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'not_found', label: '404 — Póliza no encontrada', status: 404 }] },
  },
  {
    id: 'api-cotizacion-auto',
    name: 'API de Cotización Auto',
    slug: 'cotizacion-auto',
    description: 'Cotización de seguros vehiculares con integración FASECOLDA',
    descriptionLong: 'API especializada para cotización de seguros de automóvil. Integra con FASECOLDA para validación de vehículos, calcula prima basada en modelo, año, ciudad y perfil del conductor. Incluye SOAT y todo riesgo.',
    product: 'AUTO',
    process: 'COTIZACION',
    currentVersion: '2.0.0',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.9,
    contactName: 'Equipo Auto',
    contactEmail: 'auto@segurosbolivar.com',
    contactArea: 'Producto Auto',
    icon: '🚗',
    useCases: ['Cotizar seguro todo riesgo', 'Cotizar SOAT digital', 'Validar vehículo con FASECOLDA'],
    endpoints: [
      { method: 'POST', path: '/v2/auto/cotizar', summary: 'Cotizar seguro auto', description: 'Genera cotización de seguro vehicular.', requestBody: JSON.stringify({ vehiculo: { placa: "ABC123", marca: "Chevrolet", modelo: "Spark", anio: 2024 }, conductor: { edad: 30, experiencia: 8 }, ciudad: "Bogotá" }, null, 2) },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v2/auto/cotizar -H "Authorization: Bearer {token}" -H "Content-Type: application/json"' },
    sandboxConfig: { defaultEndpoint: '/v2/auto/cotizar', defaultMethod: 'POST', defaultBody: JSON.stringify({ vehiculo: { placa: "ABC123", marca: "Chevrolet", modelo: "Spark", anio: 2024 }, conductor: { edad: 30, experiencia: 8 }, ciudad: "Bogotá" }, null, 2), scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'bad_request', label: '400 — Vehículo no encontrado', status: 400 }] },
  },
  {
    id: 'api-salud-beneficiarios',
    name: 'API de Validación de Beneficiarios',
    slug: 'salud-beneficiarios',
    description: 'Validación de beneficiarios y preexistencias para planes de salud',
    descriptionLong: 'API para validar beneficiarios de planes de salud complementaria. Verifica elegibilidad, preexistencias médicas, grupo familiar y períodos de carencia. Integra con bases de datos de salud para validación en tiempo real.',
    product: 'SALUD',
    process: 'VALIDACION',
    currentVersion: '1.1.0',
    lifecycleState: 'ACTIVE',
    slaUptime: 99.9,
    contactName: 'Equipo Salud',
    contactEmail: 'salud@segurosbolivar.com',
    contactArea: 'Producto Salud',
    icon: '❤️',
    useCases: ['Validar elegibilidad de beneficiario', 'Verificar preexistencias', 'Consultar períodos de carencia'],
    endpoints: [
      { method: 'POST', path: '/v1/salud/beneficiarios/validar', summary: 'Validar beneficiario', description: 'Valida elegibilidad y preexistencias de un beneficiario.', requestBody: JSON.stringify({ documento: "1234567890", tipoDocumento: "CC", fechaNacimiento: "1990-05-20", parentesco: "titular" }, null, 2) },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v1/salud/beneficiarios/validar -H "Authorization: Bearer {token}"' },
    sandboxConfig: { defaultEndpoint: '/v1/salud/beneficiarios/validar', defaultMethod: 'POST', defaultBody: JSON.stringify({ documento: "1234567890", tipoDocumento: "CC", fechaNacimiento: "1990-05-20", parentesco: "titular" }, null, 2), scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'not_found', label: '404 — Beneficiario no encontrado', status: 404 }] },
  },
  {
    id: 'api-pagos',
    name: 'API de Pagos de Primas',
    slug: 'pagos-primas',
    description: 'Procesamiento de pagos de primas y consulta de estado de cuenta',
    descriptionLong: 'API para gestionar pagos de primas de seguros. Soporta pagos con tarjeta, PSE, efectivo y débito automático. Incluye consulta de estado de cuenta, historial de pagos y generación de recibos.',
    product: 'OPEN_FINANCE',
    process: 'PAGOS',
    currentVersion: '1.0.0',
    lifecycleState: 'DRAFT',
    slaUptime: 99.95,
    contactName: 'Equipo Pagos',
    contactEmail: 'pagos@segurosbolivar.com',
    contactArea: 'Finanzas',
    icon: '💳',
    useCases: ['Procesar pago de prima', 'Consultar estado de cuenta', 'Generar recibo de pago'],
    endpoints: [
      { method: 'POST', path: '/v1/pagos/procesar', summary: 'Procesar pago', description: 'Procesa un pago de prima de seguro.', requestBody: JSON.stringify({ polizaId: "POL-001", monto: 245000, metodoPago: "PSE", banco: "Davivienda" }, null, 2) },
      { method: 'GET', path: '/v1/pagos/estado-cuenta/{polizaId}', summary: 'Estado de cuenta', description: 'Consulta el estado de cuenta de una póliza.' },
    ],
    codeSnippets: { curl: 'curl -X POST https://sandbox.segurosbolivar.com/v1/pagos/procesar -H "Authorization: Bearer {token}"' },
    sandboxConfig: { defaultEndpoint: '/v1/pagos/procesar', defaultMethod: 'POST', defaultBody: JSON.stringify({ polizaId: "POL-001", monto: 245000, metodoPago: "PSE", banco: "Davivienda" }, null, 2), scenarios: [{ value: '', label: '200 — Éxito', status: 200 }, { value: 'bad_request', label: '400 — Monto inválido', status: 400 }] },
  },
];

export function searchApis(query: string, product?: string, process?: string, state?: string): CatalogApi[] {
  let results = [...CATALOG_APIS];

  if (product) {
    results = results.filter(a => a.product === product);
  }
  if (process) {
    results = results.filter(a => a.process === process);
  }
  if (state) {
    results = results.filter(a => a.lifecycleState === state);
  }
  if (query) {
    const q = query.toLowerCase().trim();
    results = results.filter(a => {
      const productLabel = (PRODUCT_LABELS[a.product] || '').toLowerCase();
      const processLabel = (PROCESS_LABELS[a.process] || '').toLowerCase();
      // Match against name, description, product (enum + label), process (enum + label), slug, use cases
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.descriptionLong.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.product.toLowerCase().includes(q) ||
        productLabel.includes(q) ||
        q.includes(productLabel) ||
        a.process.toLowerCase().includes(q) ||
        processLabel.includes(q) ||
        q.includes(processLabel) ||
        a.useCases.some(uc => uc.toLowerCase().includes(q)) ||
        a.endpoints.some(ep => ep.summary.toLowerCase().includes(q) || ep.path.toLowerCase().includes(q))
      );
    });
  }

  return results;
}

export function getApiById(id: string): CatalogApi | undefined {
  return CATALOG_APIS.find(a => a.id === id);
}
