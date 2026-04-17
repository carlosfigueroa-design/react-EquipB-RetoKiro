import { Link } from 'react-router-dom';

const GUIDES = [
  { icon: 'fa-solid fa-rocket', title: 'Guía de inicio rápido', desc: 'Registra tu cuenta, obtén credenciales y haz tu primera llamada API en 5 minutos.', time: '5 min' },
  { icon: 'fa-solid fa-lock', title: 'Autenticación OAuth 2.0', desc: 'Cómo obtener y refrescar tokens de acceso para las APIs de VÍNCULO.', time: '10 min' },
  { icon: 'fa-solid fa-heart-pulse', title: 'Cotizar seguro de vida', desc: 'Tutorial paso a paso para integrar la cotización de seguros de vida.', time: '15 min' },
  { icon: 'fa-solid fa-car-side', title: 'Cotizar seguro de auto', desc: 'Integra cotización y emisión de seguros vehiculares en tu plataforma.', time: '15 min' },
  { icon: 'fa-solid fa-flask-vial', title: 'Usar el Sandbox', desc: 'Aprende a usar el sandbox interactivo para probar endpoints sin riesgo.', time: '5 min' },
  { icon: 'fa-solid fa-chart-column', title: 'Monitorear tu consumo', desc: 'Dashboards de analytics, cuotas y alertas para tu integración.', time: '10 min' },
];

const SDKS = [
  { lang: 'JavaScript', icon: 'fa-brands fa-js', install: 'npm install @vinculo/sdk', color: '#f7df1e' },
  { lang: 'Python', icon: 'fa-brands fa-python', install: 'pip install vinculo-sdk', color: '#3776ab' },
  { lang: 'Java', icon: 'fa-brands fa-java', install: 'maven: com.segurosbolivar:vinculo-sdk:3.0.0', color: '#ed8b00' },
  { lang: 'C#', icon: 'fa-solid fa-code', install: 'dotnet add package Vinculo.SDK', color: '#512bd4' },
];

export default function Docs() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-file-lines" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>Documentación
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>Guías, tutoriales y SDKs para integrar VÍNCULO</p>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { to: '/catalog', icon: 'fa-solid fa-book-open', label: 'API Reference', desc: 'OpenAPI 3.1 completo', isLink: true },
          { to: 'http://localhost:4000/api/docs', icon: 'fa-solid fa-wrench', label: 'Swagger UI', desc: 'Explorador interactivo', isExternal: true },
          { to: '/sandbox', icon: 'fa-solid fa-flask-vial', label: 'Sandbox', desc: 'Prueba sin riesgo', isLink: true },
        ].map(item => {
          const inner = (
            <div className="sb-ui-card sb-ui-card--interactive sb-ui-card--elevated" style={{ textAlign: 'center', height: '100%' }}>
              <div className="sb-ui-card__body" style={{ padding: '24px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 12px',
                  background: 'var(--sb-ui-color-primary-L400, #f2f9f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={item.icon} style={{ fontSize: '22px', color: 'var(--sb-ui-color-primary-D100, #038450)' }}></i>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)' }}>{item.desc}</div>
              </div>
            </div>
          );
          return item.isExternal
            ? <a key={item.to} href={item.to} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
            : <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>{inner}</Link>;
        })}
      </div>

      {/* Guides */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 14px' }}>Guías y tutoriales</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        {GUIDES.map(g => (
          <div key={g.title} className="sb-ui-card sb-ui-card--interactive sb-ui-card--elevated">
            <div className="sb-ui-card__body" style={{ display: 'flex', gap: '14px', padding: '18px 20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--sb-ui-color-primary-L400, #f2f9f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={g.icon} style={{ fontSize: '16px', color: 'var(--sb-ui-color-primary-D100, #038450)' }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{g.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)', marginBottom: '6px', lineHeight: 1.5 }}>{g.desc}</div>
                <span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small">
                  <i className="fa-regular fa-clock" style={{ marginRight: '3px' }}></i>{g.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SDKs */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 14px' }}>SDKs disponibles</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {SDKS.map(sdk => (
          <div key={sdk.lang} className="sb-ui-card sb-ui-card--elevated">
            <div className="sb-ui-card__body" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <i className={sdk.icon} style={{ fontSize: '20px', color: sdk.color }}></i>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{sdk.lang}</span>
              </div>
              <div className="code-block" style={{ padding: '10px 14px', fontSize: '11px' }}>
                <code>{sdk.install}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Start */}
      <div className="sb-ui-card sb-ui-card--elevated">
        <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
          <span style={{ fontWeight: 600 }}><i className="fa-solid fa-terminal" style={{ marginRight: '8px' }}></i>Quick Start — JavaScript</span>
        </div>
        <div className="sb-ui-card__body">
          <div className="code-block">
            <pre>{`import { VinculoClient } from '@vinculo/sdk';

const client = new VinculoClient({
  clientId: 'tu-client-id',
  clientSecret: 'tu-client-secret',
  sandbox: true
});

// Cotizar seguro de vida
const cotizacion = await client.insurance.cotizarVida({
  nombre: 'María García',
  edad: 32,
  sumaAsegurada: 500_000_000
});

console.log(cotizacion.primaAnual);
// → 1,850,000 COP`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
