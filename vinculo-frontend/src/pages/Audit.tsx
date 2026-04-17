import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const ACTION_LABELS: Record<string, { label: string; badge: string }> = {
  ALIADO_REGISTERED: { label: 'Registro', badge: 'sb-ui-badge--info' },
  ALIADO_APPROVED: { label: 'Aprobado', badge: 'sb-ui-badge--success' },
  ALIADO_SUSPENDED: { label: 'Suspendido', badge: 'sb-ui-badge--error' },
  ALIADO_REACTIVATED: { label: 'Reactivado', badge: 'sb-ui-badge--success' },
  APP_CREATED: { label: 'App creada', badge: 'sb-ui-badge--info' },
  APP_REVOKED: { label: 'App revocada', badge: 'sb-ui-badge--error' },
  API_CALL: { label: 'API Call', badge: 'sb-ui-badge--info' },
  LOGIN_SUCCESS: { label: 'Login OK', badge: 'sb-ui-badge--success' },
  LOGIN_FAILED: { label: 'Login fallido', badge: 'sb-ui-badge--warning' },
  SECRET_ROTATED: { label: 'Secret rotado', badge: 'sb-ui-badge--warning' },
};

export default function Audit() {
  const [logs, setLogs] = useState<any>(null);
  const [compliance, setCompliance] = useState<any>(null);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
    api.getComplianceReport().then(setCompliance).catch(() => {});
  }, []);

  const loadLogs = (action?: string) => {
    const filters: Record<string, string> = {};
    if (action) filters.action = action;
    api.getAuditLogs(filters).then(setLogs).catch(() => {});
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-clipboard-check" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>
          Auditoría y Cumplimiento
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>
          RU-08: Trazabilidad completa — quién consumió qué dato y cuándo
        </p>
      </div>

      {/* Compliance Summary */}
      {compliance && (
        <div className="sb-ui-card sb-ui-card--elevated" style={{ marginBottom: '20px' }}>
          <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
            <span style={{ fontWeight: 600 }}><i className="fa-solid fa-shield-halved" style={{ marginRight: '8px' }}></i>Reporte de Cumplimiento (últimos 30 días)</span>
          </div>
          <div className="sb-ui-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: 'Total eventos', value: compliance.summary?.totalLogs },
                { label: 'Logins exitosos', value: compliance.summary?.loginAttempts },
                { label: 'Logins fallidos', value: compliance.summary?.failedLogins, color: 'var(--sb-ui-color-feedback-error-base)' },
                { label: 'Accesos a datos', value: compliance.summary?.dataAccess },
                { label: 'Acciones admin', value: compliance.summary?.adminActions },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color || 'var(--sb-ui-color-grayscale-black)' }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: '11px', color: 'var(--sb-ui-color-grayscale-D100)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Habeas Data', 'GDPR', 'SFC'].map(r => (
                <span key={r} className="sb-ui-badge sb-ui-badge--success sb-ui-badge--small">
                  <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>{r}
                </span>
              ))}
              <span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small">
                Retención: {compliance.compliance?.dataRetentionDays} días
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => { setActionFilter(''); loadLogs(); }}
          className={`sb-ui-button sb-ui-button--small ${!actionFilter ? 'sb-ui-button--primary sb-ui-button--fill' : 'sb-ui-button--secondary'}`}>
          Todos
        </button>
        {Object.entries(ACTION_LABELS).slice(0, 6).map(([key, val]) => (
          <button key={key} onClick={() => { setActionFilter(key); loadLogs(key); }}
            className={`sb-ui-button sb-ui-button--small ${actionFilter === key ? 'sb-ui-button--primary sb-ui-button--fill' : 'sb-ui-button--secondary'}`}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="sb-ui-card sb-ui-card--elevated">
        <div className="sb-ui-card__body" style={{ padding: 0 }}>
          <div className="sb-ui-table-container">
            <table className="sb-ui-table sb-ui-table--hover sb-ui-table--striped sb-ui-table--compact">
              <thead>
                <tr><th>Fecha</th><th>Acción</th><th>Entidad</th><th>Aliado</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                {logs?.logs?.map((log: any) => {
                  const meta = ACTION_LABELS[log.action] || { label: log.action, badge: 'sb-ui-badge--info' };
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('es-CO')}
                      </td>
                      <td><span className={`sb-ui-badge sb-ui-badge--small ${meta.badge}`}>{meta.label}</span></td>
                      <td style={{ fontSize: '12px' }}>{log.entityType} <span style={{ color: 'var(--sb-ui-color-grayscale-base)' }}>{log.entityId?.slice(0, 8)}...</span></td>
                      <td style={{ fontSize: '12px' }}>{log.aliado?.companyName || '—'}</td>
                      <td style={{ fontSize: '11px', color: 'var(--sb-ui-color-grayscale-D100)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.detail ? JSON.stringify(log.detail) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {(!logs?.logs || logs.logs.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--sb-ui-color-grayscale-base)' }}>
                    No hay registros de auditoría
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {logs && <p style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)', marginTop: '8px' }}>
        Mostrando {logs.logs?.length || 0} de {logs.total || 0} registros · Página {logs.page}/{logs.totalPages}
      </p>}
    </div>
  );
}
