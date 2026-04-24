import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiById, CATALOG_APIS, type CatalogApi } from '@/lib/catalogData';

interface HistoryEntry {
  id: number;
  api: string;
  method: string;
  endpoint: string;
  status: number;
  latency: number;
  timestamp: Date;
}

let historyCounter = 0;

export default function SandboxPage() {
  // Always start with empty selection — user must choose
  const [selectedApiId, setSelectedApiId] = useState<string>('');
  // Step 2: Method (shown after API selected)
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  // Step 3: Auto-filled from selection
  const [endpoint, setEndpoint] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [scenario, setScenario] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Response
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const currentApi = selectedApiId ? getApiById(selectedApiId) : undefined;

  // Get available methods for the selected API
  const availableMethods = currentApi
    ? [...new Set(currentApi.endpoints.map(ep => ep.method))]
    : [];

  // Get the matching endpoint for the selected API + method
  const matchingEndpoint = currentApi && selectedMethod
    ? currentApi.endpoints.find(ep => ep.method === selectedMethod)
    : undefined;

  // Derived state: are we ready to execute?
  const isReady = !!currentApi && !!selectedMethod && !!endpoint;

  /* ── Handlers ── */

  function handleApiChange(newApiId: string) {
    setSelectedApiId(newApiId);
    setSelectedMethod('');
    setEndpoint('');
    setRequestBody('');
    setScenario('');
    clearResponse();
  }

  function handleMethodChange(method: string) {
    setSelectedMethod(method);
    setScenario('');
    clearResponse();

    // Auto-fill endpoint and body from the API's endpoint data
    const api = getApiById(selectedApiId);
    if (!api) return;
    const ep = api.endpoints.find(e => e.method === method);
    if (ep) {
      setEndpoint(ep.path);
      setRequestBody(ep.requestBody || (method !== 'GET' ? api.sandboxConfig.defaultBody : ''));
    } else {
      setEndpoint(api.sandboxConfig.defaultEndpoint);
      setRequestBody(method !== 'GET' ? api.sandboxConfig.defaultBody : '');
    }
  }

  function clearResponse() {
    setResponseStatus(null);
    setResponseBody(null);
    setResponseHeaders(null);
    setCorrelationId(null);
    setLatency(null);
  }

  async function executeRequest() {
    if (!isReady) return;
    setIsExecuting(true);
    clearResponse();

    const simulatedLatency = Math.floor(Math.random() * 200) + 50;
    await new Promise(r => setTimeout(r, simulatedLatency));

    const corrId = crypto.randomUUID();
    let status: number;
    let body: Record<string, unknown>;

    if (scenario) {
      const errorMap: Record<string, { status: number; message: string }> = {
        bad_request: { status: 400, message: 'Request body malformado: campos requeridos faltantes' },
        unauthorized: { status: 401, message: 'Token de autenticación inválido o expirado' },
        not_found: { status: 404, message: 'Recurso no encontrado en el sistema' },
        internal_error: { status: 500, message: 'Error de conexión con el servidor' },
      };
      const err = errorMap[scenario] || { status: 500, message: 'Error desconocido' };
      status = err.status;
      body = { error: err.message };
    } else {
      status = 200;
      body = generateMockResponse(currentApi, endpoint);
    }

    const bodyStr = JSON.stringify(body, null, 2);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': 'mock-req-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
    };

    setResponseStatus(status);
    setResponseBody(bodyStr);
    setResponseHeaders(headers);
    setCorrelationId(corrId);
    setLatency(simulatedLatency);

    historyCounter++;
    setHistory(prev => [{
      id: historyCounter,
      api: currentApi?.name || '',
      method: selectedMethod,
      endpoint,
      status,
      latency: simulatedLatency,
      timestamp: new Date(),
    }, ...prev].slice(0, 20));

    setIsExecuting(false);
  }

  function getStatusBadge(s: number) {
    if (s >= 200 && s < 300) return { label: `${s} OK`, cls: 'bg-green-100 text-green-800' };
    if (s >= 400 && s < 500) {
      const l: Record<number, string> = { 400: 'BAD REQUEST', 401: 'UNAUTHORIZED', 404: 'NOT FOUND' };
      return { label: `${s} ${l[s] || 'CLIENT ERROR'}`, cls: 'bg-amber-100 text-amber-800' };
    }
    return { label: `${s} SERVER ERROR`, cls: 'bg-red-100 text-red-800' };
  }

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-500', POST: 'bg-green-500', PUT: 'bg-amber-500', DELETE: 'bg-red-500', PATCH: 'bg-purple-500',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-primary flex items-center gap-2">
            <span aria-hidden="true">🧪</span> Sandbox Interactivo
          </h1>
          <p className="font-body text-gray-500 text-sm mt-0.5">Ejecuta peticiones simuladas contra las APIs del catálogo</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/catalog" className="text-xs font-body text-gray-400 hover:text-[#F9A825] transition-colors">← Catálogo</Link>
          {currentApi && (
            <Link to={`/catalog/${currentApi.id}?from=sandbox`} className="text-xs font-body text-secondary hover:text-[#F9A825] transition-colors">📄 Ver detalle</Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Request Panel ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5">
            <h2 className="font-display font-bold text-primary text-base mb-4">Request</h2>

            {/* Step 1: API Selector */}
            <div className="mb-4">
              <label htmlFor="sandbox-api" className="block text-xs font-body font-semibold text-primary mb-1">API</label>
              <select
                id="sandbox-api"
                value={selectedApiId}
                onChange={e => handleApiChange(e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm font-body focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${
                  selectedApiId ? 'border-[#2E7D32] bg-white text-primary' : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                <option value="">Selecciona la API con la que deseas realizar la prueba</option>
                {CATALOG_APIS.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Method (visible only after API selected) */}
            {currentApi && (
              <div className="mb-4 animate-[fadeIn_0.3s_ease-out]">
                <label className="block text-xs font-body font-semibold text-primary mb-1.5">Método HTTP</label>
                <div className="flex flex-wrap gap-2">
                  {availableMethods.map(m => (
                    <button
                      key={m}
                      onClick={() => handleMethodChange(m)}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-200 border-2 ${
                        selectedMethod === m
                          ? `${methodColors[m] || 'bg-gray-500'} text-white border-transparent shadow-md scale-105`
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#F9A825] hover:text-[#F9A825]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Endpoint + Body (visible after method selected, auto-filled) */}
            {selectedMethod && (
              <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                {/* Endpoint (read-only, auto-filled) */}
                <div>
                  <label htmlFor="sandbox-endpoint" className="block text-xs font-body font-semibold text-primary mb-1">Endpoint</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F7F2] border-2 border-[#76C442]/30 rounded-xl">
                    <span className={`text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded ${methodColors[selectedMethod] || 'bg-gray-500'}`}>{selectedMethod}</span>
                    <input
                      id="sandbox-endpoint"
                      type="text"
                      value={endpoint}
                      onChange={e => setEndpoint(e.target.value)}
                      className="flex-1 bg-transparent text-sm font-mono text-primary focus:outline-none"
                    />
                  </div>
                  {matchingEndpoint?.summary && (
                    <p className="text-[10px] font-body text-gray-400 mt-1 ml-1">{matchingEndpoint.summary}</p>
                  )}
                </div>

                {/* Scenario */}
                <div>
                  <label htmlFor="sandbox-scenario" className="block text-xs font-body font-semibold text-primary mb-1">Escenario</label>
                  <select
                    id="sandbox-scenario"
                    value={scenario}
                    onChange={e => setScenario(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  >
                    {(currentApi?.sandboxConfig.scenarios || []).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Body (only for non-GET) */}
                {selectedMethod !== 'GET' && requestBody && (
                  <div className="animate-[fadeIn_0.2s_ease-out]">
                    <label htmlFor="sandbox-body" className="block text-xs font-body font-semibold text-primary mb-1">Body (JSON)</label>
                    <textarea
                      id="sandbox-body"
                      value={requestBody}
                      onChange={e => setRequestBody(e.target.value)}
                      rows={8}
                      spellCheck={false}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-y bg-gray-50 leading-relaxed"
                    />
                  </div>
                )}

                {/* Execute button */}
                <button
                  onClick={executeRequest}
                  disabled={isExecuting || !isReady}
                  className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] active:scale-[0.98] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#2E7D32]/20 hover:shadow-[#F9A825]/30"
                >
                  {isExecuting ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Ejecutando...</>
                  ) : (
                    <><span aria-hidden="true">▶</span> Ejecutar</>
                  )}
                </button>
              </div>
            )}

            {/* Empty state when no API selected */}
            {!currentApi && (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2" aria-hidden="true">👆</span>
                <p className="font-body text-sm text-gray-400">Selecciona una API para comenzar</p>
              </div>
            )}

            {/* Empty state when API selected but no method */}
            {currentApi && !selectedMethod && (
              <div className="text-center py-6">
                <span className="text-2xl block mb-2" aria-hidden="true">⚡</span>
                <p className="font-body text-xs text-gray-400">Selecciona un método HTTP para configurar la petición</p>
              </div>
            )}
          </div>

          {/* ── Response Panel ── */}
          <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5">
            <h2 className="font-display font-bold text-primary text-base mb-3">Response</h2>
            {responseStatus !== null ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {(() => { const b = getStatusBadge(responseStatus); return <span className={`text-xs font-bold px-3 py-1 rounded-full ${b.cls}`}>{b.label}</span>; })()}
                  {latency !== null && (
                    <span className="flex items-center gap-1 text-xs font-mono text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {latency}ms
                    </span>
                  )}
                </div>
                {correlationId && (
                  <div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-widest text-gray-400 mb-0.5">CORRELATION-ID</p>
                    <p className="font-mono text-[11px] text-gray-500">{correlationId}</p>
                  </div>
                )}
                {responseHeaders && Object.keys(responseHeaders).length > 0 && (
                  <div>
                    <p className="text-[9px] font-body font-bold uppercase tracking-widest text-gray-400 mb-0.5">HEADERS</p>
                    <div className="space-y-0.5">
                      {Object.entries(responseHeaders).map(([k, v]) => (
                        <p key={k} className="font-mono text-[11px]"><span className="text-secondary font-semibold">{k}:</span> <span className="text-gray-500">{v}</span></p>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-body font-bold uppercase tracking-widest text-gray-400 mb-1">BODY</p>
                  <pre className="bg-gray-900 text-amber-300 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed">{responseBody}</pre>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <span className="text-3xl block mb-2" aria-hidden="true">📡</span>
                <p className="font-body text-xs text-gray-400">Ejecuta una llamada para ver la respuesta aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* ── History Panel ── */}
        <div>
          <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 sticky top-20">
            <h2 className="font-display font-bold text-primary text-base mb-3 flex items-center gap-2">
              <span aria-hidden="true">🕐</span> Historial
            </h2>
            {history.length === 0 ? (
              <p className="font-body text-xs text-gray-400 text-center py-4">Sin peticiones aún</p>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {history.map(entry => {
                  const badge = getStatusBadge(entry.status);
                  return (
                    <div key={entry.id} className="p-2.5 bg-gray-50 rounded-lg text-[11px] hover:bg-[#F9A825]/10 border border-transparent hover:border-[#F9A825]/20 transition-all duration-200">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-mono font-bold text-white text-[9px] px-1.5 py-0.5 rounded ${methodColors[entry.method] || 'bg-gray-500'}`}>{entry.method}</span>
                        <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded-full ${badge.cls}`}>{entry.status}</span>
                      </div>
                      <p className="font-mono text-gray-500 truncate text-[10px]">{entry.endpoint}</p>
                      <div className="flex items-center justify-between mt-0.5 text-gray-400 text-[9px]">
                        <span>{entry.latency}ms</span>
                        <span>{entry.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mock Response Generator ── */
function generateMockResponse(api: CatalogApi | undefined, endpoint: string): Record<string, unknown> {
  const ep = endpoint.toLowerCase();
  const now = new Date().toISOString();
  const id = String(Math.floor(Math.random() * 999999)).padStart(6, '0');

  if (ep.includes('cotizacion') || ep.includes('cotizar')) {
    return { success: true, data: { cotizacionId: `COT-${id}`, estado: 'Generada', fechaCotizacion: now, asegurado: { nombre: 'Juan Carlos Pérez López', documento: '1234567890', tipoDocumento: 'CC' }, producto: api?.product || 'VIDA', primaTotal: Math.floor(Math.random() * 5000000) + 500000, primaMensual: Math.floor(Math.random() * 500000) + 50000, moneda: 'COP', coberturas: [{ nombre: 'Cobertura básica', valor: 200000000 }, { nombre: 'Asistencia 24h', valor: 'Incluida' }], vigencia: '30 días' } };
  }
  if (ep.includes('poliza') || ep.includes('emitir') || ep.includes('renovar') || ep.includes('cancelar')) {
    return { success: true, data: { polizaId: `POL-2026-${id}`, estado: ep.includes('cancelar') ? 'Cancelada' : ep.includes('renovar') ? 'Renovada' : 'Emitida', asegurado: { nombre: 'Juan Carlos Pérez López', documento: '1234567890', tipoDocumento: 'CC' }, plan: { nombre: 'Vida Plus', cobertura: 'Muerte + Incapacidad', primaAnual: 2450000 }, vigencia: { inicio: '2026-07-01', fin: '2027-07-01' }, certificadoUrl: `https://docs.segurosbolivar.com/cert/POL-2026-${id}.pdf` } };
  }
  if (ep.includes('siniestro') || ep.includes('radicar')) {
    return { success: true, data: { siniestroId: `SIN-${id.slice(0,5)}`, estado: 'Radicado', fechaReporte: now, polizaId: 'POL-2026-001234', montoEstimado: Math.floor(Math.random() * 50000000) + 1000000, moneda: 'COP' } };
  }
  if (ep.includes('pago') || ep.includes('procesar') || ep.includes('estado-cuenta')) {
    return { success: true, data: { pagoId: `PAG-${id}`, estado: 'Procesado', monto: 245000, moneda: 'COP', metodoPago: 'PSE', fechaPago: now } };
  }
  if (ep.includes('beneficiario') || ep.includes('validar')) {
    return { success: true, data: { elegible: true, documento: '1234567890', preexistencias: [], periodoCarencia: '90 días', grupoFamiliar: { titular: true, dependientes: 2 } } };
  }
  if (ep.includes('auto')) {
    return { success: true, data: { cotizacionId: `COT-AUTO-${id}`, vehiculo: { placa: 'ABC123', marca: 'Chevrolet', modelo: 'Spark', anio: 2024 }, primaAnual: 1850000, primaSOAT: 450000, moneda: 'COP' } };
  }
  return { success: true, data: { message: 'Respuesta generada por el motor mock de Vínculo', timestamp: now, endpoint } };
}
