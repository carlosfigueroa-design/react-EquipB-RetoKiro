import { Link } from 'react-router-dom';
import BolivarLogo from '../components/BolivarLogo';

const FEATURES = [
  { icon: 'fa-solid fa-bolt', title: 'Onboarding en 5 min', desc: 'Registro, credenciales y primera llamada API en menos de 5 minutos con nuestro Golden Path.' },
  { icon: 'fa-solid fa-flask-vial', title: 'Sandbox con IA', desc: 'Prueba cada endpoint con respuestas inteligentes generadas por IA. Sin datos reales, sin riesgo.' },
  { icon: 'fa-solid fa-book-open', title: 'Catálogo OpenX', desc: 'Vida, Auto, Hogar, Salud — todas las APIs documentadas con OpenAPI 3.1 y SDKs auto-generados.' },
  { icon: 'fa-solid fa-shield-halved', title: 'Seguridad Enterprise', desc: 'OAuth 2.0, mTLS, WAF con OWASP API Top 10. Cumplimiento Habeas Data y normativa SFC.' },
  { icon: 'fa-solid fa-chart-column', title: 'Analytics Self-Service', desc: 'Dashboards en tiempo real: latencia, errores, consumo. Cada aliado ve su propio rendimiento.' },
  { icon: 'fa-solid fa-robot', title: 'IA Ready (MCP)', desc: 'Preparado para agentes IA con protocolo MCP. Specs semánticas para LLMs y AI Gateway.' },
];

const APIS = [
  { method: 'POST', path: '/v3/vinculo/cotizacion/vida', label: 'Cotizar Vida' },
  { method: 'POST', path: '/v3/vinculo/cotizacion/auto', label: 'Cotizar Auto' },
  { method: 'POST', path: '/v3/vinculo/emision/vida', label: 'Emitir Póliza' },
  { method: 'GET', path: '/v3/vinculo/poliza/{id}', label: 'Consultar Póliza' },
  { method: 'POST', path: '/v3/vinculo/siniestro/reportar', label: 'Reportar Siniestro' },
];

export default function Landing() {
  return (
    <div>
      {/* ── Header ──────────────────────────────────────── */}
      <header style={{ background: 'var(--sb-ui-color-primary-D200, #026B41)' }}>
        <div className="sb-ui-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BolivarLogo size="lg" variant="light" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/onboarding" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Iniciar sesión
            </Link>
            <Link to="/onboarding" className="sb-ui-button sb-ui-button--secondary sb-ui-button--fill sb-ui-button--small">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, var(--sb-ui-color-primary-D300, #086d44) 0%, var(--sb-ui-color-primary-base, #05A660) 50%, var(--sb-ui-color-tertiary-base, #02d46f) 100%)',
        padding: '72px 0 80px', color: '#fff',
      }}>
        <div className="sb-ui-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div>
              <span className="sb-ui-badge sb-ui-badge--warning sb-ui-badge--small" style={{ marginBottom: '20px', display: 'inline-flex' }}>
                Open Insurance · Open Finance · Open Data
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.1, margin: '0 0 20px' }}>
                El lugar donde tu negocio se conecta con el{' '}
                <span style={{ color: 'var(--sb-ui-color-secondary-base, #ffe16f)' }}>futuro del seguro</span>
              </h1>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 32px', maxWidth: '480px', lineHeight: 1.6 }}>
                Integra cotización, emisión, siniestros y más en tu plataforma.
                Primera llamada API en menos de 5 minutos.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/onboarding" className="sb-ui-button sb-ui-button--secondary sb-ui-button--fill sb-ui-button--large">
                  <i className="fa-solid fa-rocket" style={{ marginRight: '8px' }}></i>Comenzar ahora
                </Link>
                <Link to="/onboarding" className="sb-ui-button sb-ui-button--primary sb-ui-button--large" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                  <i className="fa-solid fa-book-open" style={{ marginRight: '8px' }}></i>Documentación
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '28px' }}>
                {['Sandbox instantáneo', 'SDKs auto-generados', 'SLA 99.95%'].map(t => (
                  <span key={t} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--sb-ui-color-secondary-base, #ffe16f)', marginRight: '5px' }}></i>{t}
                  </span>
                ))}
              </div>
            </div>
            <div className="code-block" style={{ borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }}></span>
                <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.4 }}>cotizar-vida.ts</span>
              </div>
              <pre>{`const response = await fetch(
  'https://vinculo.segurosbolivar.com` + `/v3/vinculo/cotizacion/vida',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nombre: 'María García',
      edad: 32,
      sumaAsegurada: 500_000_000
    })
  }
);

const cotizacion = await response.json();
// → primaAnual: 1,850,000 COP`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--sb-ui-color-grayscale-L200, #e1e1e1)', padding: '40px 0' }}>
        <div className="sb-ui-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { value: '< 5 min', label: 'Time to First Call' },
              { value: '99.95%', label: 'SLA Disponibilidad' },
              { value: '< 30ms', label: 'Latencia Gateway' },
              { value: '1500+', label: 'TPS Soportados' },
            ].map(s => (
              <div key={s.label} className="vinculo-stat">
                <div className="vinculo-stat__value">{s.value}</div>
                <div className="vinculo-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section style={{ padding: '72px 0', background: 'var(--sb-ui-color-grayscale-L400, #fafafa)' }}>
        <div className="sb-ui-container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px' }}>Todo lo que necesitas para integrar seguros</h2>
            <p style={{ color: 'var(--sb-ui-color-grayscale-D100, #757575)', fontSize: '1rem' }}>El portal OpenX más completo del mercado asegurador colombiano</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="sb-ui-card sb-ui-card--elevated">
                <div className="sb-ui-card__body" style={{ padding: '28px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'var(--sb-ui-color-primary-L400, #f2f9f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <i className={f.icon} style={{ fontSize: '20px', color: 'var(--sb-ui-color-primary-D100, #038450)' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--sb-ui-color-grayscale-D100, #757575)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APIs ────────────────────────────────────────── */}
      <section style={{ background: 'var(--sb-ui-color-primary-D300, #086d44)', padding: '72px 0', color: '#fff' }}>
        <div className="sb-ui-container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>APIs disponibles</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Explora nuestro catálogo de Open Insurance</p>
          </div>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {APIS.map(ep => (
              <div key={ep.path} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 18px',
              }}>
                <span className={`sb-ui-badge sb-ui-badge--small ${ep.method === 'GET' ? 'sb-ui-badge--info' : 'sb-ui-badge--success'}`}>
                  {ep.method}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', flex: 1, color: 'rgba(255,255,255,0.85)' }}>{ep.path}</span>
                <span style={{ fontSize: '12px', color: 'var(--sb-ui-color-secondary-base, #ffe16f)' }}>{ep.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ padding: '72px 0', textAlign: 'center', background: '#fff' }}>
        <div className="sb-ui-container">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 12px' }}>¿Listo para conectar tu negocio?</h2>
          <p style={{ color: 'var(--sb-ui-color-grayscale-D100, #757575)', margin: '0 0 28px' }}>
            Regístrate gratis, obtén tus credenciales sandbox y haz tu primera llamada API hoy.
          </p>
          <Link to="/onboarding" className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--large">
            <i className="fa-solid fa-rocket" style={{ marginRight: '8px' }}></i>Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{ background: 'var(--sb-ui-color-primary-D300, #086d44)', padding: '20px 0' }}>
        <div className="sb-ui-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BolivarLogo size="sm" variant="light" />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>© 2026 Seguros Bolívar. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
