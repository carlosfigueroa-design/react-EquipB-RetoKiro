import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Admin() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [aliados, setAliados] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.adminDashboard().then(setDashboard).catch(() => {});
    loadAliados();
  }, []);

  const loadAliados = (status?: string) => {
    api.adminListAliados(status || undefined).then(setAliados).catch(() => {});
  };

  const handleAction = async (action: string, id: string) => {
    setLoading(id);
    try {
      if (action === 'approve') await api.adminApprove(id);
      else if (action === 'suspend') await api.adminSuspend(id, 'Suspendido por administrador');
      else if (action === 'reactivate') await api.adminReactivate(id);
      loadAliados(statusFilter || undefined);
    } catch { /* handled */ }
    finally { setLoading(null); }
  };

  const filterByStatus = (s: string) => {
    setStatusFilter(s);
    loadAliados(s || undefined);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-shield-halved" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>
          Panel Administrativo
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>
          RU-07: Gestión centralizada de aliados, aprobaciones y accesos
        </p>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Aliados', value: dashboard.aliados?.total, icon: 'fa-solid fa-users', color: 'var(--sb-ui-color-primary-base)' },
            { label: 'Pendientes', value: dashboard.aliados?.pending, icon: 'fa-solid fa-clock', color: 'var(--sb-ui-color-feedback-warning-base)' },
            { label: 'Activos', value: dashboard.aliados?.active, icon: 'fa-solid fa-circle-check', color: 'var(--sb-ui-color-feedback-success-base)' },
            { label: 'Suspendidos', value: dashboard.aliados?.suspended, icon: 'fa-solid fa-ban', color: 'var(--sb-ui-color-feedback-error-base)' },
          ].map(s => (
            <div key={s.label} className="sb-ui-card sb-ui-card--elevated">
              <div className="sb-ui-card__body" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <i className={s.icon} style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-base)' }}></i>
                  <span style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value ?? 0}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="sb-ui-card sb-ui-card--elevated" style={{ marginBottom: '20px' }}>
        <div className="sb-ui-card__body" style={{ padding: '14px 20px', display: 'flex', gap: '6px' }}>
          {['', 'PENDING', 'ACTIVE', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => filterByStatus(s)}
              className={`sb-ui-button sb-ui-button--small ${statusFilter === s ? 'sb-ui-button--primary sb-ui-button--fill' : 'sb-ui-button--secondary'}`}>
              {s || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Aliados Table */}
      <div className="sb-ui-card sb-ui-card--elevated">
        <div className="sb-ui-card__body" style={{ padding: 0 }}>
          <div className="sb-ui-table-container">
            <table className="sb-ui-table sb-ui-table--hover sb-ui-table--striped">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>NIT</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Apps</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {aliados?.aliados?.map((a: any) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{a.companyName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--sb-ui-color-grayscale-D100)' }}>{a.email}</div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{a.nit}</td>
                    <td><span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small">{a.type}</span></td>
                    <td>
                      <span className={`sb-ui-badge sb-ui-badge--small ${
                        a.status === 'ACTIVE' ? 'sb-ui-badge--success' :
                        a.status === 'PENDING' ? 'sb-ui-badge--warning' : 'sb-ui-badge--error'
                      }`}>{a.status}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{a.appsCount}</td>
                    <td style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)' }}>
                      {new Date(a.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {a.status === 'PENDING' && (
                          <button onClick={() => handleAction('approve', a.id)} disabled={loading === a.id}
                            className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--small">
                            <i className="fa-solid fa-check"></i>
                          </button>
                        )}
                        {a.status === 'ACTIVE' && (
                          <button onClick={() => handleAction('suspend', a.id)} disabled={loading === a.id}
                            className="sb-ui-button sb-ui-button--error sb-ui-button--small">
                            <i className="fa-solid fa-ban"></i>
                          </button>
                        )}
                        {a.status === 'SUSPENDED' && (
                          <button onClick={() => handleAction('reactivate', a.id)} disabled={loading === a.id}
                            className="sb-ui-button sb-ui-button--primary sb-ui-button--small">
                            <i className="fa-solid fa-rotate-right"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
