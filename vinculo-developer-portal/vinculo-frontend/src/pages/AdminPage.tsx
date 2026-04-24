import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG_APIS, PROCESS_LABELS, type CatalogApi } from '@/lib/catalogData';

type LifecycleState = CatalogApi['lifecycleState'];
type AdminView = 'list' | 'create';

interface ManagedApi extends CatalogApi {
  _managed?: boolean;
}

const STATE_CFG: Record<LifecycleState, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: 'PUBLICADA', bg: 'bg-green-100', text: 'text-green-800' },
  DEPRECATED: { label: 'DEPRECADA', bg: 'bg-orange-100', text: 'text-orange-800' },
  DRAFT: { label: 'BORRADOR', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  SUNSET: { label: 'RETIRADA', bg: 'bg-red-100', text: 'text-red-800' },
};

const TRANSITIONS: Record<LifecycleState, { action: string; next: LifecycleState; cls: string }[]> = {
  DRAFT: [{ action: 'Publicar', next: 'ACTIVE', cls: 'bg-[#2E7D32] hover:bg-[#F9A825] text-white hover:text-[#1A3C0E]' }],
  ACTIVE: [{ action: 'Deprecar', next: 'DEPRECATED', cls: 'border border-orange-400 text-orange-700 hover:bg-orange-100' }],
  DEPRECATED: [
    { action: 'Retirar', next: 'SUNSET', cls: 'bg-red-100 text-red-800 hover:bg-red-200' },
    { action: 'Reactivar', next: 'ACTIVE', cls: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  ],
  SUNSET: [],
};

export default function AdminPage() {
  const [apis, setApis] = useState<ManagedApi[]>(() => CATALOG_APIS.map(a => ({ ...a })));
  const [view, setView] = useState<AdminView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');

  // Create API state
  const [isDragging, setIsDragging] = useState(false);
  const [_uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedSpec, setParsedSpec] = useState<Record<string, unknown> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdApi, setCreatedApi] = useState<ManagedApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredApis = apis.filter(api => {
    if (filterState && api.lifecycleState !== filterState) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return api.name.toLowerCase().includes(q) || api.description.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: apis.length,
    active: apis.filter(a => a.lifecycleState === 'ACTIVE').length,
    deprecated: apis.filter(a => a.lifecycleState === 'DEPRECATED').length,
    draft: apis.filter(a => a.lifecycleState === 'DRAFT').length,
  };

  function changeState(apiId: string, newState: LifecycleState) {
    setApis(prev => prev.map(a => a.id === apiId ? { ...a, lifecycleState: newState } : a));
  }

  // File upload handlers
  function handleDragOver(e: DragEvent) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave() { setIsDragging(false); }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
      processFile(file);
    }
  }
  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function processFile(file: File) {
    setUploadedFile(file);
    setIsProcessing(true);
    setParsedSpec(null);
    setCreatedApi(null);

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000));

    try {
      const text = await file.text();
      const spec = JSON.parse(text);
      setParsedSpec(spec);

      // Extract API info from OpenAPI spec
      const info = spec.info || {};
      const paths = spec.paths || {};
      const tags = spec.tags || [];
      const servers = spec.servers || [];
      const endpointCount = Object.keys(paths).length;
      const methods = new Set<string>();
      Object.values(paths).forEach((p: unknown) => {
        Object.keys(p as Record<string, unknown>).forEach(m => {
          if (['get','post','put','delete','patch'].includes(m)) methods.add(m.toUpperCase());
        });
      });

      const newApi: ManagedApi = {
        id: 'api-new-' + Date.now(),
        name: info.title || 'API sin nombre',
        slug: (info.title || 'nueva-api').toLowerCase().replace(/\s+/g, '-'),
        description: info.description || `API generada desde especificación OpenAPI: ${info.title || 'API sin nombre'}`,
        descriptionLong: info.description || `API generada automáticamente desde la especificación OpenAPI cargada. ${endpointCount} endpoints detectados.`,
        product: 'HOGAR',
        process: 'CONSULTAS',
        currentVersion: info.version || '1.0.0',
        lifecycleState: 'DRAFT',
        slaUptime: 99.9,
        contactName: `Equipo API (${info.contact?.name || 'Tecnología'})`,
        contactEmail: info.contact?.email || 'api@segurosbolivar.com',
        contactArea: 'Tecnología',
        icon: '🔍',
        useCases: [],
        endpoints: Object.entries(paths).flatMap(([path, methods_obj]) =>
          Object.entries(methods_obj as Record<string, { summary?: string; description?: string }>)
            .filter(([m]) => ['get','post','put','delete','patch'].includes(m))
            .map(([method, detail]) => ({
              method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
              path,
              summary: detail.summary || '',
              description: detail.description || '',
            }))
        ),
        codeSnippets: {},
        sandboxConfig: { defaultEndpoint: Object.keys(paths)[0] || '/', defaultMethod: 'GET', defaultBody: '{}', scenarios: [{ value: '', label: '200 — Éxito', status: 200 }] },
        _managed: true,
        _endpointCount: endpointCount,
        _methodCount: methods.size,
        _tagCount: tags.length,
        _serverCount: servers.length,
      } as ManagedApi & Record<string, unknown>;

      setCreatedApi(newApi);
    } catch {
      // If not valid JSON, create a generic API
      const newApi: ManagedApi = {
        id: 'api-new-' + Date.now(),
        name: file.name.replace(/\.(json|yaml|yml)$/, ''),
        slug: file.name.replace(/\.(json|yaml|yml)$/, '').toLowerCase().replace(/\s+/g, '-'),
        description: `API generada desde archivo: ${file.name}`,
        descriptionLong: `API generada automáticamente desde el archivo ${file.name}.`,
        product: 'HOGAR',
        process: 'CONSULTAS',
        currentVersion: '1.0.0',
        lifecycleState: 'DRAFT',
        slaUptime: 99.9,
        contactName: 'Equipo API (Tecnología)',
        contactEmail: 'api@segurosbolivar.com',
        contactArea: 'Tecnología',
        icon: '🔍',
        useCases: [],
        endpoints: [],
        codeSnippets: {},
        sandboxConfig: { defaultEndpoint: '/', defaultMethod: 'GET', defaultBody: '{}', scenarios: [{ value: '', label: '200 — Éxito', status: 200 }] },
        _managed: true,
      };
      setCreatedApi(newApi);
    } finally {
      setIsProcessing(false);
    }
  }

  function confirmCreateApi() {
    if (createdApi) {
      setApis(prev => [...prev, createdApi]);
      resetCreateForm();
      setView('list');
    }
  }

  function resetCreateForm() {
    setUploadedFile(null);
    setParsedSpec(null);
    setCreatedApi(null);
    setIsProcessing(false);
    setIsDragging(false);
  }

  // ── LIST VIEW ──
  if (view === 'list') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-primary flex items-center gap-2">
              <span aria-hidden="true">⚙️</span> Gestión del Ciclo de Vida
            </h1>
            <p className="font-body text-gray-500 mt-1">Administra el estado de las APIs del portal</p>
          </div>
          <button
            onClick={() => { resetCreateForm(); setView('create'); }}
            className="bg-[#1A3C0E] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <span aria-hidden="true">+</span> Crear nueva API
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: '📊', bg: 'bg-blue-50 text-blue-800' },
            { label: 'Publicadas', value: stats.active, icon: '✅', bg: 'bg-green-50 text-green-800' },
            { label: 'Deprecadas', value: stats.deprecated, icon: '⚠️', bg: 'bg-orange-50 text-orange-800' },
            { label: 'Borrador', value: stats.draft, icon: '📝', bg: 'bg-yellow-50 text-yellow-800' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sb border border-gray-100 p-4 hover:border-[#F9A825]/40 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-display font-extrabold text-primary">{s.value}</p>
                  <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar APIs..." className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
          <select value={filterState} onChange={e => setFilterState(e.target.value)} className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all">
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Publicadas</option>
            <option value="DEPRECATED">Deprecadas</option>
            <option value="DRAFT">Borrador</option>
            <option value="SUNSET">Retiradas</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Gestión de APIs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left font-body font-bold text-gray-700 text-xs uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3.5 text-left font-body font-bold text-gray-700 text-xs uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3.5 text-left font-body font-bold text-gray-700 text-xs uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3.5 text-left font-body font-bold text-gray-700 text-xs uppercase tracking-wider">Versión</th>
                  <th className="px-6 py-3.5 text-left font-body font-bold text-gray-700 text-xs uppercase tracking-wider">Acciones</th>
                  <th className="px-6 py-3.5 text-left font-body font-bold text-gray-700 text-xs uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApis.map(api => {
                  const st = STATE_CFG[api.lifecycleState];
                  const transitions = TRANSITIONS[api.lifecycleState] || [];
                  return (
                    <tr key={api.id} className="hover:bg-[#F9A825]/5 transition-colors duration-200 group/row relative" title={api.description}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg" aria-hidden="true">{api.icon}</span>
                          <div className="min-w-0">
                            <span className="font-body font-semibold text-primary block">{api.name}</span>
                            <span className="font-body text-[10px] text-gray-400 block truncate max-w-[250px] opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">{api.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body text-gray-500 text-xs">{PROCESS_LABELS[api.process] || api.process}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">v{api.currentVersion}</td>
                      <td className="px-6 py-4">
                        {transitions.length > 0 ? (
                          <div className="flex gap-2">
                            {transitions.map(t => (
                              <button key={t.action} onClick={() => changeState(api.id, t.next)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${t.cls}`}>
                                {t.action}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin acciones</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/catalog/${api.id}?from=admin`}
                          className="inline-flex items-center gap-1 text-xs font-body font-semibold text-[#2E7D32] hover:text-[#F9A825] border border-[#2E7D32]/30 hover:border-[#F9A825] px-3 py-1.5 rounded-lg transition-all duration-200"
                        >
                          📄 Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredApis.length === 0 && (
            <div className="p-12 text-center">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="font-body text-gray-400">No se encontraron APIs.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CREATE VIEW ──
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { resetCreateForm(); setView('list'); }} className="border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#F9A825] hover:border-[#F9A825] hover:text-[#1A3C0E] font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200">
          ← Volver
        </button>
        <h1 className="text-2xl font-display font-extrabold text-primary">Crear nueva API</h1>
      </div>

      {/* Success state */}
      {createdApi && !isProcessing && (
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-8">
          {/* Success banner */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="w-10 h-10 bg-[#2E7D32] rounded-full flex items-center justify-center text-white text-lg shrink-0">✓</div>
            <div>
              <p className="font-display font-bold text-primary text-sm">API creada exitosamente</p>
              <p className="font-body text-xs text-gray-500">El agente IA interpretó tu especificación y generó la documentación.</p>
            </div>
          </div>

          {/* API details */}
          <div className="space-y-3 mb-6">
            {[
              { label: 'Nombre', value: createdApi.name },
              { label: 'Categoría', value: `${createdApi.icon} ${PROCESS_LABELS[createdApi.process] || createdApi.process}` },
              { label: 'Versión', value: `v${createdApi.currentVersion}` },
              { label: 'Estado', value: STATE_CFG[createdApi.lifecycleState].label, badge: true },
              { label: 'Descripción', value: createdApi.description },
              { label: 'Equipo', value: createdApi.contactName },
            ].map(row => (
              <div key={row.label} className="flex gap-4 text-sm font-body">
                <span className="text-gray-400 w-24 shrink-0 font-semibold">{row.label}</span>
                {row.badge ? (
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${STATE_CFG[createdApi.lifecycleState].bg} ${STATE_CFG[createdApi.lifecycleState].text}`}>{row.value}</span>
                ) : (
                  <span className="text-gray-700">{row.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          <div className="bg-[#F5F7F2] rounded-xl p-5 mb-6">
            <h3 className="font-display font-bold text-primary text-sm mb-3 flex items-center gap-2">
              <span className="text-secondary">ℹ️</span> Análisis del Agente IA
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Endpoints', value: createdApi.endpoints.length },
                { label: 'Métodos HTTP', value: new Set(createdApi.endpoints.map(e => e.method)).size },
                { label: 'Tags', value: (parsedSpec as Record<string, unknown[]>)?.tags?.length || 0 },
                { label: 'Servidores', value: (parsedSpec as Record<string, unknown[]>)?.servers?.length || 0 },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-xl font-display font-extrabold text-secondary">{m.value}</p>
                  <p className="text-[10px] font-body text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <span className="text-[10px] font-body bg-white px-2 py-1 rounded-full text-gray-500">Categoría: {PROCESS_LABELS[createdApi.process]}</span>
              <span className="text-[10px] font-body bg-white px-2 py-1 rounded-full text-gray-500">Área: {createdApi.contactArea}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <button onClick={() => resetCreateForm()} className="border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#F9A825] hover:border-[#F9A825] hover:text-[#1A3C0E] font-bold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2">
              + Crear otra API
            </button>
            <button onClick={confirmCreateApi} className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2 shadow-md">
              ⚙️ Ir a Administración
            </button>
          </div>
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl text-white">🤖</span>
          </div>
          <h2 className="font-display font-bold text-primary text-lg mb-2">Procesando especificación...</h2>
          <p className="font-body text-sm text-gray-500">El agente IA está analizando tu archivo</p>
          <div className="mt-4 w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#76C442] rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Upload state */}
      {!createdApi && !isProcessing && (
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-8">
          {/* AI Agent header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">🤖</span>
            </div>
            <h2 className="font-display font-bold text-primary text-xl mb-2">Agente IA de Documentación</h2>
            <p className="font-body text-sm text-gray-500 max-w-md mx-auto">
              Sube tu archivo OpenAPI (JSON) y nuestro agente de IA interpretará automáticamente la especificación para crear la documentación completa de tu API.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragging
                ? 'border-[#76C442] bg-[#76C442]/5 scale-[1.02]'
                : 'border-gray-300 hover:border-[#F9A825] hover:bg-[#F9A825]/5'
            }`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label="Zona de carga de archivos"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-14 h-14 bg-[#76C442]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="font-body text-gray-600 mb-2">Arrastra tu archivo JSON aquí</p>
            <p className="font-body text-xs text-gray-400 mb-4">o</p>
            <span className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-200 inline-flex items-center gap-2 text-sm">
              📁 Seleccionar archivo
            </span>
            <p className="font-body text-[10px] text-gray-400 mt-4">Formatos soportados: OpenAPI 3.0 / Swagger 2.0 (.json)</p>
          </div>
        </div>
      )}
    </div>
  );
}
