import { useState } from 'react';
import { api } from '../lib/api';

const PRESETS = [
  { label: 'Cotizar Vida', icon: 'fa-solid fa-heart', method: 'POST', path: '/v3/vinculo/cotizacion/vida', body: { nombre: 'María García', edad: 32, sumaAsegurada: 500000000 } },
  { label: 'Cotizar Auto', icon: 'fa-solid fa-car', method: 'POST', path: '/v3/vinculo/cotizacion/auto', body: { placa: 'ABC123', marca: 'Mazda', modelo: 2024, linea: 'CX-5', valorComercial: 120000000 } },
  { label: 'Emitir Vida', icon: 'fa-solid fa-file-signature', method: 'POST', path: '/v3/vinculo/emision/vida', body: { nombre: 'María García', documento: '1234567890', primaAnual: 2400000 } },
  { label: 'Consultar Póliza', icon: 'fa-solid fa-search', method: 'GET', path: '/v3/vinculo/poliza/abc-123-def', body: {} },
  { label: 'Reportar Siniestro', icon: 'fa-solid fa-clipboard-list', method: 'POST', path: '/v3/vinculo/siniestro/reportar', body: { polizaId: 'abc-123', tipo: 'ACCIDENTE', descripcion: 'Colisión en vía pública' } },
  { label: 'Cotizar Hogar', icon: 'fa-solid fa-house', method: 'POST', path: '/v3/vinculo/cotizacion/hogar', body: { direccion: 'Cra 7 #72-41, Bogotá', valorInmueble: 350000000 } },
];

export default function Sandbox() {
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/v3/vinculo/cotizacion/vida');
  const [body, setBody] = useState(JSON.stringify(PRESETS[0].body, null, 2));
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(0);

  const execute = async () => {
    setLoading(true); setError(''); setResponse(null);
    try {
      let parsedBody = {};
      if (method !== 'GET' && body.trim()) {
        try { parsedBody = JSON.parse(body); }
        catch { setError('JSON inválido en el body. Verifica la sintaxis.'); setLoading(false); return; }
      }
      const result = await api.executeSandbox({ method, path, body: parsedBody });
      setResponse(result);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const loadPreset = (preset: typeof PRESETS[0], idx: number) => {
    setMethod(preset.method);
    setPath(preset.path);
    setBody(JSON.stringify(preset.body, null, 2));
    setResponse(null); setError('');
    setActivePreset(idx);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-flask-vial" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>
          Sandbox Interactivo
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>
          Prueba las APIs con el mock engine. Sin datos reales, sin riesgo.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {PRESETS.map((p, i) => (
          <button key={p.label} onClick={() => loadPreset(p, i)}
            className={`sb-ui-button sb-ui-button--small ${i === activePreset ? 'sb-ui-button--primary sb-ui-button--fill' : 'sb-ui-button--secondary'}`}>
            <i className={p.icon} style={{ marginRight: '6px', fontSize: '11px' }}></i>{p.label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* ── Request Panel ── */}
        <div className="sb-ui-card sb-ui-card--elevated">
          <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200, #e1e1e1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: 'var(--sb-ui-color-primary-base)' }}></i>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Request</span>
            </div>
          </div>
          <div className="sb-ui-card__body">
            {/* Method + Path */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <div className="sb-ui-select-container" style={{ width: '110px', flexShrink: 0 }}>
                <select className="sb-ui-select" value={method} onChange={e => setMethod(e.target.value)} aria-label="Método HTTP">
                  <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                </select>
              </div>
              <input className="sb-ui-input" value={path} onChange={e => setPath(e.target.value)}
                placeholder="/v3/vinculo/cotizacion/vida" aria-label="Ruta del endpoint"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }} />
            </div>

            {/* Body */}
            {method !== 'GET' && (
              <div className="sb-ui-textarea-container" style={{ marginBottom: '14px' }}>
                <label className="sb-ui-textarea-label">Body (JSON)</label>
                <textarea className="sb-ui-textarea" value={body} onChange={e => setBody(e.target.value)}
                  rows={12} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1.5 }} />
              </div>
            )}

            {/* Execute */}
            <button onClick={execute} disabled={loading}
              className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--block sb-ui-button--large">
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Ejecutando...</>
                : <><i className="fa-solid fa-play" style={{ marginRight: '8px' }}></i>Ejecutar</>}
            </button>

            {error && (
              <div className="vinculo-alert vinculo-alert--error" role="alert" style={{ marginTop: '14px' }}>
                <i className="fa-solid fa-circle-exclamation"></i>{error}
              </div>
            )}
          </div>
        </div>

        {/* ── Response Panel ── */}
        <div className="sb-ui-card sb-ui-card--elevated">
          <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200, #e1e1e1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-arrow-down-to-line" style={{ color: 'var(--sb-ui-color-feedback-success-base, #28a745)' }}></i>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Response</span>
              {response && (
                <span className="sb-ui-badge sb-ui-badge--success sb-ui-badge--small" style={{ marginLeft: 'auto' }}>
                  {response.response?.statusCode} OK · {response.response?.latencyMs}ms
                </span>
              )}
            </div>
          </div>
          <div className="sb-ui-card__body">
            {/* Empty state */}
            {!response && !loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                  background: 'var(--sb-ui-color-grayscale-L300, #f5f5f5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fa-solid fa-flask-vial" style={{ fontSize: '24px', color: 'var(--sb-ui-color-grayscale-L100, #b9b9b9)' }}></i>
                </div>
                <p style={{ color: 'var(--sb-ui-color-grayscale-base, #9b9b9b)', fontSize: '14px', margin: 0 }}>
                  Selecciona un preset y ejecuta para ver la respuesta
                </p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="sb-ui-spinner" style={{ margin: '0 auto 12px' }}><div className="sb-ui-spinner__icon"></div></div>
                <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', fontSize: '14px', margin: 0 }}>Procesando request...</p>
              </div>
            )}

            {/* Response data */}
            {response && (
              <div>
                {/* Trace */}
                <div style={{ marginBottom: '14px' }}>
                  <span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                    <i className="fa-solid fa-fingerprint" style={{ marginRight: '4px' }}></i>
                    trace: {response.traceId}
                  </span>
                </div>

                {/* Headers */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--sb-ui-color-grayscale-D200, #5b5b5b)' }}>
                    <i className="fa-solid fa-list" style={{ marginRight: '6px' }}></i>Headers
                  </div>
                  <div style={{
                    background: 'var(--sb-ui-color-grayscale-L300, #f5f5f5)', borderRadius: '8px', padding: '10px 14px',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', lineHeight: 1.6,
                  }}>
                    {response.response?.headers && Object.entries(response.response.headers).map(([k, v]) => (
                      <div key={k}><span style={{ color: 'var(--sb-ui-color-primary-D100, #038450)' }}>{k}</span>: {String(v)}</div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--sb-ui-color-grayscale-D200, #5b5b5b)' }}>
                    <i className="fa-solid fa-code" style={{ marginRight: '6px' }}></i>Body
                  </div>
                  <div className="code-block" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    <pre>{JSON.stringify(response.response?.body, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
