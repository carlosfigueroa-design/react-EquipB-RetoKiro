import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const STATUS_BADGE: Record<string, { badge: string; icon: string }> = {
  ACTIVE: { badge: 'sb-ui-badge--success', icon: 'fa-solid fa-circle-check' },
  DEPRECATED: { badge: 'sb-ui-badge--warning', icon: 'fa-solid fa-triangle-exclamation' },
  SUNSET: { badge: 'sb-ui-badge--error', icon: 'fa-solid fa-circle-xmark' },
};

export default function Governance() {
  const [timeline, setTimeline] = useState<any>(null);

  useEffect(() => {
    api.getVersionTimeline().then(setTimeline).catch(() => {});
  }, []);

  const renderVersionList = (versions: any[], title: string, icon: string) => (
    <div className="sb-ui-card sb-ui-card--elevated" style={{ marginBottom: '16px' }}>
      <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
        <span style={{ fontWeight: 600 }}><i className={icon} style={{ marginRight: '8px' }}></i>{title} ({versions.length})</span>
      </div>
      <div className="sb-ui-card__body">
        {versions.length === 0 ? (
          <p style={{ color: 'var(--sb-ui-color-grayscale-base)', textAlign: 'center', padding: '16px 0' }}>Sin versiones en este estado</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {versions.map((v: any) => {
              const meta = STATUS_BADGE[v.status] || STATUS_BADGE.ACTIVE;
              return (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  borderRadius: '8px', background: 'var(--sb-ui-color-grayscale-L300, #f5f5f5)',
                }}>
                  <span className={`sb-ui-badge sb-ui-badge--small ${meta.badge}`}>
                    <i className={meta.icon} style={{ marginRight: '4px' }}></i>{v.status}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{v.apiName}</span>
                    <span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small" style={{ marginLeft: '8px' }}>{v.version}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--sb-ui-color-grayscale-D100)', textAlign: 'right' }}>
                    <div>Publicada: {new Date(v.publishedAt).toLocaleDateString('es-CO')}</div>
                    {v.sunsetAt && <div style={{ color: 'var(--sb-ui-color-feedback-error-base)' }}>Sunset: {new Date(v.sunsetAt).toLocaleDateString('es-CO')}</div>}
                  </div>
                  {v.changelog && (
                    <span style={{ fontSize: '11px', color: 'var(--sb-ui-color-grayscale-D100)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.changelog}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-code-branch" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>
          Gobierno de Versiones
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>
          RU-09: Publicación, deprecación y retiro coordinado de versiones de APIs
        </p>
      </div>

      {/* Info banner */}
      <div className="vinculo-alert vinculo-alert--info" style={{ marginBottom: '20px' }}>
        <i className="fa-solid fa-circle-info"></i>
        <span>Las APIs deprecadas tienen un mínimo de 3 meses de aviso antes del retiro (sunset), según política de Seguros Bolívar.</span>
      </div>

      {timeline ? (
        <>
          {renderVersionList(timeline.active || [], 'Versiones Activas', 'fa-solid fa-circle-check')}
          {renderVersionList(timeline.deprecated || [], 'Versiones Deprecadas', 'fa-solid fa-triangle-exclamation')}
          {renderVersionList(timeline.sunset || [], 'Versiones Retiradas', 'fa-solid fa-circle-xmark')}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="sb-ui-spinner"><div className="sb-ui-spinner__icon"></div></div>
        </div>
      )}
    </div>
  );
}
