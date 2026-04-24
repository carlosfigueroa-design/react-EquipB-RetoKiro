import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getApiById, PRODUCT_LABELS, PROCESS_LABELS, type CatalogApi } from '@/lib/catalogData';

const STATE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: 'PUBLICADA', bg: 'bg-green-100', text: 'text-green-800' },
  DEPRECATED: { label: 'DEPRECADA', bg: 'bg-orange-100', text: 'text-orange-800' },
  DRAFT: { label: 'BORRADOR', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  SUNSET: { label: 'RETIRADA', bg: 'bg-red-100', text: 'text-red-800' },
};

type TabId = 'overview' | 'endpoints' | 'code' | 'sandbox';

export default function ApiDetailPage() {
  const { apiId } = useParams<{ apiId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const api = apiId ? getApiById(apiId) : undefined;
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedLang, setSelectedLang] = useState<string>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Determine back navigation based on where user came from
  const backLink = from === 'admin' ? '/admin' : from === 'sandbox' ? `/sandbox/${apiId}` : '/catalog';
  const backLabel = from === 'admin' ? '← Volver a Administración' : from === 'sandbox' ? '← Volver al Sandbox' : '← Volver al Catálogo';

  if (!api) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">🔍</span>
        <h1 className="text-2xl font-display font-bold text-primary mb-2">API no encontrada</h1>
        <p className="font-body text-gray-500 mb-6">La API solicitada no existe en el catálogo.</p>
        <Link to="/catalog" className="sb-btn-primary inline-block">Volver al catálogo</Link>
        <Link to="/admin" className="ml-3 border-2 border-gray-200 text-gray-600 hover:border-[#F9A825] hover:text-[#F9A825] font-semibold px-6 py-3 rounded-full transition-all inline-block">Ir a Administración</Link>
      </div>
    );
  }

  const state = STATE_CONFIG[api.lifecycleState] || STATE_CONFIG.ACTIVE;

  function copySnippet() {
    if (!api) return;
    const snippet = api.codeSnippets[selectedLang] || '';
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Descripción', icon: 'ℹ️' },
    { id: 'endpoints', label: 'Endpoints', icon: '🔗' },
    { id: 'code', label: 'Código', icon: '💻' },
    { id: 'sandbox', label: 'Sandbox', icon: '🧪' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-body text-gray-400 mb-4" aria-label="Breadcrumb">
        <Link to={backLink} className="hover:text-[#F9A825] transition-colors">{from === 'admin' ? 'Administración' : from === 'sandbox' ? 'Sandbox' : 'Catálogo'}</Link>
        <span aria-hidden="true">›</span>
        <span className="text-primary font-medium">{api.name}</span>
      </nav>

      {/* Deprecated banner */}
      {api.lifecycleState === 'DEPRECATED' && (
        <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-800 rounded-r-xl p-4 mb-6 flex items-center gap-3" role="alert">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <div>
            <p className="font-body font-semibold text-sm">Esta API está deprecada</p>
            <p className="font-body text-xs text-orange-600">Consulta la documentación para alternativas de migración.</p>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 sm:p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-3xl shrink-0" aria-hidden="true">
            {api.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-body font-bold uppercase tracking-widest text-gray-400">
                {PROCESS_LABELS[api.process] || api.process}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${state.bg} ${state.text}`}>
                {state.label}
              </span>
              <span className="text-[11px] font-mono text-gray-400">v{api.currentVersion}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-primary leading-tight">
              {api.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="Secciones del detalle">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-secondary text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-[#F9A825] hover:text-[#F9A825] hover:bg-[#F9A825]/5'
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab api={api} />}
      {activeTab === 'endpoints' && <EndpointsTab api={api} />}
      {activeTab === 'code' && (
        <CodeTab api={api} selectedLang={selectedLang} setSelectedLang={setSelectedLang} copied={copiedSnippet} onCopy={copySnippet} />
      )}
      {activeTab === 'sandbox' && (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4" aria-hidden="true">🧪</span>
          <h2 className="text-xl font-display font-bold text-primary mb-2">Sandbox Interactivo</h2>
          <p className="font-body text-gray-500 mb-6">Prueba esta API con datos reales en un entorno seguro.</p>
          <Link to={`/sandbox/${api.id}`} className="sb-btn-primary inline-flex items-center gap-2">
            <span aria-hidden="true">▶</span> Probar en Sandbox
          </Link>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
        <Link to={`/sandbox/${api.id}`} className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]">
          <span aria-hidden="true">🧪</span> Probar en Sandbox
        </Link>
        <Link to={backLink} className="border-2 border-gray-200 text-gray-600 hover:border-[#F9A825] hover:text-[#F9A825] font-semibold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center gap-2">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ api }: { api: CatalogApi }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 font-display font-bold text-primary text-lg mb-3">
            <span className="text-secondary" aria-hidden="true">ℹ️</span> Descripción
          </h2>
          <p className="font-body text-gray-700 leading-relaxed">{api.descriptionLong}</p>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 font-display font-bold text-primary text-lg mb-3">
            <span className="text-secondary" aria-hidden="true">📋</span> Casos de Uso
          </h2>
          <ul className="space-y-2">
            {api.useCases.map((uc, i) => (
              <li key={i} className="flex items-start gap-2 font-body text-sm text-gray-700">
                <span className="text-accent mt-0.5" aria-hidden="true">•</span>
                {uc}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sidebar info */}
      <div className="space-y-6">
        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 font-display font-bold text-primary text-lg mb-3">
            <span className="text-secondary" aria-hidden="true">👥</span> Equipo de Contacto
          </h2>
          <div className="space-y-2 text-sm font-body">
            <div className="flex gap-2"><span className="text-gray-400 w-16 shrink-0">Equipo:</span><span className="text-gray-700 font-medium">{api.contactName}</span></div>
            <div className="flex gap-2"><span className="text-gray-400 w-16 shrink-0">Email:</span><a href={`mailto:${api.contactEmail}`} className="text-secondary hover:underline">{api.contactEmail}</a></div>
            <div className="flex gap-2"><span className="text-gray-400 w-16 shrink-0">Área:</span><span className="text-gray-700">{api.contactArea}</span></div>
          </div>
          <a href={`mailto:${api.contactEmail}`} className="mt-4 inline-flex items-center gap-2 text-sm font-body font-semibold text-secondary border border-secondary rounded-lg px-4 py-2 hover:bg-[#F9A825] hover:border-[#F9A825] hover:text-[#1A3C0E] transition-all duration-200">
            ✉️ Contactar al equipo
          </a>
        </div>

        {/* SLA & Version */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
          <h2 className="flex items-center gap-2 font-display font-bold text-primary text-lg mb-3">
            <span className="text-secondary" aria-hidden="true">📊</span> SLA & Versión
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400">Versión actual</p>
              <p className="font-mono text-lg font-bold text-primary">{api.currentVersion}</p>
            </div>
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400">SLA Uptime</p>
              <p className="font-display text-lg font-bold text-accent">{api.slaUptime}%</p>
            </div>
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400">Producto</p>
              <p className="font-body text-sm text-gray-700">{PRODUCT_LABELS[api.product]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Endpoints Tab ── */
function EndpointsTab({ api }: { api: CatalogApi }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-primary text-xl mb-4">Endpoints disponibles</h2>
      {api.endpoints.map((ep, i) => {
        const methodColors: Record<string, string> = {
          GET: 'bg-blue-100 text-blue-800',
          POST: 'bg-green-100 text-green-800',
          PUT: 'bg-amber-100 text-amber-800',
          DELETE: 'bg-red-100 text-red-800',
          PATCH: 'bg-purple-100 text-purple-800',
        };
        const isExpanded = expandedIdx === i;

        return (
          <div key={i} className="bg-white rounded-2xl shadow-sb border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpandedIdx(isExpanded ? null : i)}
              className="w-full flex items-center gap-3 p-5 text-left hover:bg-[#F9A825]/5 transition-colors"
              aria-expanded={isExpanded}
            >
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${methodColors[ep.method] || 'bg-gray-100 text-gray-800'}`}>
                {ep.method}
              </span>
              <span className="font-mono text-sm text-primary font-medium flex-1">{ep.path}</span>
              <span className="font-body text-sm text-gray-500 hidden sm:inline">{ep.summary}</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                <p className="font-body text-sm text-gray-700">{ep.description}</p>

                {ep.parameters && ep.parameters.length > 0 && (
                  <div>
                    <h4 className="font-body font-semibold text-sm text-primary mb-2">Parámetros</h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-gray-500 text-xs"><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">En</th><th className="px-3 py-2">Requerido</th><th className="px-3 py-2">Descripción</th></tr></thead>
                        <tbody>
                          {ep.parameters.map((p, j) => (
                            <tr key={j} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-mono text-primary">{p.name}</td>
                              <td className="px-3 py-2 text-gray-500">{p.in}</td>
                              <td className="px-3 py-2">{p.required ? <span className="text-red-600 font-semibold">Sí</span> : 'No'}</td>
                              <td className="px-3 py-2 text-gray-600">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {ep.requestBody && (
                  <div>
                    <h4 className="font-body font-semibold text-sm text-primary mb-2">Request Body</h4>
                    <pre className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl overflow-x-auto">{ep.requestBody}</pre>
                  </div>
                )}

                {ep.responseExample && (
                  <div>
                    <h4 className="font-body font-semibold text-sm text-primary mb-2">Response Example</h4>
                    <pre className="bg-gray-900 text-amber-300 font-mono text-xs p-4 rounded-xl overflow-x-auto">{ep.responseExample}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Code Tab ── */
function CodeTab({ api, selectedLang, setSelectedLang, copied, onCopy }: { api: CatalogApi; selectedLang: string; setSelectedLang: (l: string) => void; copied: boolean; onCopy: () => void }) {
  const langs = Object.keys(api.codeSnippets);
  const langLabels: Record<string, string> = { curl: 'cURL', javascript: 'JavaScript', python: 'Python', java: 'Java' };

  return (
    <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
      <h2 className="font-display font-bold text-primary text-xl mb-4">Ejemplo de código</h2>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2" role="tablist" aria-label="Lenguaje de código">
          {langs.map(lang => (
            <button
              key={lang}
              role="tab"
              aria-selected={selectedLang === lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                selectedLang === lang ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {langLabels[lang] || lang}
            </button>
          ))}
        </div>
        <button onClick={onCopy} className="flex items-center gap-1 text-xs font-body text-gray-500 hover:text-secondary transition-colors" aria-label="Copiar código">
          {copied ? '✅ Copiado' : '📋 Copiar'}
        </button>
      </div>
      <pre className="bg-gray-900 text-green-400 font-mono text-sm p-5 rounded-xl overflow-x-auto leading-relaxed">
        {api.codeSnippets[selectedLang] || '// No disponible'}
      </pre>
    </div>
  );
}
