import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';

const QUICK_ACTIONS = [
  { label: 'Explorar APIs', path: '/catalog', icon: 'fa-solid fa-book-open', bg: 'var(--sb-ui-color-feedback-info-L400, #e5f2ff)', color: 'var(--sb-ui-color-feedback-info-D100, #0374e8)' },
  { label: 'Probar en Sandbox', path: '/sandbox', icon: 'fa-solid fa-flask-vial', bg: 'var(--sb-ui-color-primary-L400, #f2f9f6)', color: 'var(--sb-ui-color-primary-D100, #038450)' },
  { label: 'Mis Apps', path: '/apps', icon: 'fa-solid fa-key', bg: 'var(--sb-ui-color-secondary-L400, #fffcf0)', color: 'var(--sb-ui-color-secondary-D400, #ffc918)' },
  { label: 'Ver Analytics', path: '/analytics', icon: 'fa-solid fa-chart-column', bg: 'var(--sb-ui-color-feedback-success-L400, #e9f6ec)', color: 'var(--sb-ui-color-feedback-success-D100, #279941)' },
];

export default function Dashboard() {
  const { aliado } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [quotas, setQuotas] = useState<any>(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(() => {});
    api.getQuotas().then(setQuotas).catch(() => {});
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, var(--sb-ui-color-primary-D200, #026B41) 0%, var(--sb-ui-color-primary-base, #05A660) 100%)',
        borderRadius: '14px', padding: '28px 32px', marginBottom: '24px', color: '#fff',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px' }}>
          Hola, {aliado?.companyName || 'Aliado'} <i className="fa-regular fa-hand" style={{ fontSize: '24px' }}></i>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>
          Bienvenido a tu portal de desarrollador VÍNCULO
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {QUICK_ACTIONS.map(a => (
          <Link key={a.path} to={a.path} style={{ textDecoration: 'none' }}>
            <div className="sb-ui-card sb-ui-card--interactive sb-ui-card--elevated" style={{ textAlign: 'center' }}>
              <div className="sb-ui-card__body" style={{ padding: '20px 16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <i className={a.icon} style={{ fontSize: '18px', color: a.color }}></i>
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{a.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total llamadas', value: metrics?.totalCalls?.toLocaleString() || '0', icon: 'fa-solid fa-arrow-right-arrow-left' },
          { label: 'Tasa de éxito', value: `${metrics?.successRate?.toFixed(1) || '0'}%`, icon: 'fa-solid fa-circle-check', color: 'var(--sb-ui-color-feedback-success-base)' },
          { label: 'Latencia p95', value: `${metrics?.latency?.p95 || '0'} ms`, icon: 'fa-solid fa-gauge-high' },
          { label: 'Cuota usada', value: `${quotas?.usage?.requestsThisMonth?.toLocaleString() || '0'} / ${quotas?.limits?.requestsPerMonth?.toLocaleString() || '10,000'}`, icon: 'fa-solid fa-chart-pie' },
        ].map(s => (
          <div key={s.label} className="sb-ui-card sb-ui-card--elevated">
            <div className="sb-ui-card__body" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <i className={s.icon} style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-base, #9b9b9b)' }}></i>
                <span style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100, #757575)' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color || 'var(--sb-ui-color-grayscale-black)' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="sb-ui-card sb-ui-card--elevated">
        <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-rocket" style={{ color: 'var(--sb-ui-color-primary-base)' }}></i>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Primeros pasos</span>
          </div>
        </div>
        <div className="sb-ui-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { step: 1, title: 'Registra tu cuenta', desc: 'Completa el onboarding y obtén credenciales', done: true },
            { step: 2, title: 'Explora el catálogo', desc: 'Descubre las APIs de Vida, Auto, Hogar y Salud', done: false, link: '/catalog' },
            { step: 3, title: 'Prueba en sandbox', desc: 'Haz tu primera llamada con el Try-it-now', done: false, link: '/sandbox' },
            { step: 4, title: 'Integra tu app', desc: 'Usa los SDKs o la API REST directamente', done: false, link: '/docs' },
            { step: 5, title: 'Pasa a producción', desc: 'Solicita credenciales de producción', done: false },
          ].map(item => (
            <div key={item.step} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', borderRadius: '10px',
              background: item.done ? 'var(--sb-ui-color-feedback-success-L400, #e9f6ec)' : 'var(--sb-ui-color-grayscale-L300, #f5f5f5)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 600,
                background: item.done ? 'var(--sb-ui-color-feedback-success-base, #28a745)' : 'var(--sb-ui-color-grayscale-L200, #e1e1e1)',
                color: item.done ? '#fff' : 'var(--sb-ui-color-grayscale-D100, #757575)',
              }}>
                {item.done ? <i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i> : item.step}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: item.done ? 'var(--sb-ui-color-feedback-success-D100)' : undefined }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100, #757575)' }}>{item.desc}</div>
              </div>
              {item.link && !item.done && (
                <Link to={item.link} className="sb-ui-button sb-ui-button--primary sb-ui-button--small">Ir</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
