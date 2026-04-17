import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ApiDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => { if (id) api.getApiDetail(id).then(setDetail).catch(() => {}); }, [id]);

  if (!detail) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div className="sb-ui-spinner"><div className="sb-ui-spinner__icon"></div></div>
    </div>
  );

  return (
    <div>
      <nav className="sb-ui-breadcrumb" style={{ marginBottom: '20px' }}>
        <ol className="sb-ui-breadcrumb__list">
          <li className="sb-ui-breadcrumb__item">
            <Link to="/catalog" className="sb-ui-breadcrumb__link">Catálogo</Link>
            <span className="sb-ui-breadcrumb__icon"><i className="fa-solid fa-chevron-right"></i></span>
          </li>
          <li className="sb-ui-breadcrumb__item sb-ui-breadcrumb__current">{detail.name}</li>
        </ol>
      </nav>

      <div className="sb-ui-card sb-ui-card--elevated" style={{ marginBottom: '20px' }}>
        <div className="sb-ui-card__body" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span className={`sb-ui-badge ${detail.method === 'GET' ? 'sb-ui-badge--info' : 'sb-ui-badge--success'}`}>{detail.method}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '16px' }}>{detail.path}</span>
            <span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small">{detail.version}</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px' }}>{detail.name}</h1>
          <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: '0 0 12px', fontSize: '14px' }}>{detail.summary}</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {detail.tags?.map((t: string) => <span key={t} className="sb-ui-chip sb-ui-chip--sm sb-ui-chip--outline">{t}</span>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        <div className="sb-ui-card sb-ui-card--elevated">
          <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
            <span style={{ fontWeight: 600 }}><i className="fa-solid fa-terminal" style={{ marginRight: '8px' }}></i>Ejemplo cURL</span>
          </div>
          <div className="sb-ui-card__body">
            <div className="code-block"><pre>{detail.examples?.curl}</pre></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sb-ui-card sb-ui-card--elevated">
            <div className="sb-ui-card__body" style={{ textAlign: 'center', padding: '28px' }}>
              <i className="fa-solid fa-flask-vial" style={{ fontSize: '32px', color: 'var(--sb-ui-color-primary-base)', marginBottom: '12px' }}></i>
              <h3 style={{ fontWeight: 600, margin: '0 0 12px' }}>Probar en Sandbox</h3>
              <Link to="/sandbox" className="sb-ui-button sb-ui-button--primary sb-ui-button--fill">
                Abrir Sandbox <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
              </Link>
            </div>
          </div>
          {detail.changelog && (
            <div className="sb-ui-card sb-ui-card--elevated">
              <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
                <span style={{ fontWeight: 600 }}><i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px' }}></i>Changelog</span>
              </div>
              <div className="sb-ui-card__body">
                {detail.changelog.map((e: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <span className="sb-ui-badge sb-ui-badge--success sb-ui-badge--small">{e.version}</span>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)' }}>{e.date}</div>
                      {e.changes.map((c: string, j: number) => <div key={j} style={{ fontSize: '13px' }}>• {c}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
