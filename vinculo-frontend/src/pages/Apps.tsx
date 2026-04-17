import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Apps() {
  const [apps, setApps] = useState<any[]>([]);
  const [newAppName, setNewAppName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.getApps().then(setApps).catch(() => {}); }, []);

  const createApp = async () => {
    if (!newAppName.trim()) { setError('Ingresa un nombre para la app'); return; }
    setLoading(true); setError('');
    try {
      const app = await api.createApp(newAppName);
      setApps(prev => [...prev, app]);
      setNewAppName('');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-key" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>
          Mis Aplicaciones
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>Gestiona tus credenciales y aplicaciones</p>
      </div>

      <div className="sb-ui-card sb-ui-card--elevated" style={{ marginBottom: '20px' }}>
        <div className="sb-ui-card__body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input className="sb-ui-input" value={newAppName} onChange={e => { setNewAppName(e.target.value); setError(''); }}
              placeholder="Nombre de la nueva app" aria-label="Nombre de la aplicación" style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && createApp()} />
            <button onClick={createApp} disabled={loading} className="sb-ui-button sb-ui-button--primary sb-ui-button--fill">
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i>Crear</>}
            </button>
          </div>
          {error && <div className="vinculo-alert vinculo-alert--error" style={{ marginTop: '10px' }}><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="sb-ui-card sb-ui-card--elevated" style={{ textAlign: 'center', padding: '48px' }}>
          <i className="fa-solid fa-key" style={{ fontSize: '40px', color: 'var(--sb-ui-color-grayscale-L100)', marginBottom: '12px' }}></i>
          <p style={{ color: 'var(--sb-ui-color-grayscale-base)', margin: 0 }}>No tienes aplicaciones aún. Crea una para comenzar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {apps.map(app => (
            <div key={app.id} className="sb-ui-card sb-ui-card--elevated">
              <div className="sb-ui-card__body" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{app.name}</div>
                    <span className={`sb-ui-badge sb-ui-badge--small ${app.sandbox ? 'sb-ui-badge--info' : 'sb-ui-badge--success'}`}>
                      {app.sandbox ? 'Sandbox' : 'Producción'}
                    </span>
                  </div>
                  <span className={`sb-ui-badge ${app.status === 'ACTIVE' ? 'sb-ui-badge--success' : 'sb-ui-badge--error'}`}>{app.status}</span>
                </div>
                <div style={{
                  background: 'var(--sb-ui-color-grayscale-L300, #f5f5f5)', borderRadius: '10px', padding: '14px 16px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1.8,
                }}>
                  <div><span style={{ color: 'var(--sb-ui-color-grayscale-D100)' }}>Client ID:</span> <strong>{app.clientId}</strong></div>
                  {app.clientSecret && <div><span style={{ color: 'var(--sb-ui-color-grayscale-D100)' }}>Secret:</span> <strong>{app.clientSecret}</strong></div>}
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--sb-ui-color-grayscale-base)' }}>
                  <i className="fa-regular fa-calendar" style={{ marginRight: '4px' }}></i>
                  Creada: {new Date(app.createdAt).toLocaleDateString('es-CO')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
