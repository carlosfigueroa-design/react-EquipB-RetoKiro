import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const DOMAIN_ICONS: Record<string, string> = {
  Vida: 'fa-solid fa-heart-pulse', Auto: 'fa-solid fa-car-side', Hogar: 'fa-solid fa-house-chimney',
  Salud: 'fa-solid fa-hospital', Siniestros: 'fa-solid fa-clipboard-list',
  General: 'fa-solid fa-box-archive', Identity: 'fa-solid fa-shield-halved',
};

export default function Catalog() {
  const [catalog, setCatalog] = useState<any>(null);
  const [domain, setDomain] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getCatalog(domain || undefined, search || undefined).then(setCatalog).catch(() => {});
  }, [domain, search]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-book-open" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>
          Catálogo de APIs
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>
          Explora las APIs de Open Insurance, Open Finance y Open Data
        </p>
      </div>

      {/* Filters */}
      <div className="sb-ui-card sb-ui-card--elevated" style={{ marginBottom: '20px' }}>
        <div className="sb-ui-card__body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" className="sb-ui-input" placeholder="Buscar APIs..." value={search}
              onChange={e => setSearch(e.target.value)} aria-label="Buscar APIs"
              style={{ flex: 1, minWidth: '200px' }} />
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button onClick={() => setDomain('')}
                className={`sb-ui-button sb-ui-button--small ${!domain ? 'sb-ui-button--primary sb-ui-button--fill' : 'sb-ui-button--secondary'}`}>
                Todas
              </button>
              {catalog?.domains?.map((d: string) => (
                <button key={d} onClick={() => setDomain(d)}
                  className={`sb-ui-button sb-ui-button--small ${domain === d ? 'sb-ui-button--primary sb-ui-button--fill' : 'sb-ui-button--secondary'}`}>
                  <i className={DOMAIN_ICONS[d] || 'fa-solid fa-box'} style={{ marginRight: '5px', fontSize: '11px' }}></i>{d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--sb-ui-color-grayscale-D100)', marginBottom: '12px' }}>
        <strong>{catalog?.total || 0}</strong> APIs encontradas
      </p>

      {/* API List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {catalog?.apis?.map((item: any) => (
          <Link key={item.id} to={`/catalog/${item.id}`} style={{ textDecoration: 'none' }}>
            <div className="sb-ui-card sb-ui-card--interactive sb-ui-card--elevated">
              <div className="sb-ui-card__body" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--sb-ui-color-primary-L400, #f2f9f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={DOMAIN_ICONS[item.domain] || 'fa-solid fa-box'} style={{ fontSize: '16px', color: 'var(--sb-ui-color-primary-D100, #038450)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span className={`sb-ui-badge sb-ui-badge--small ${item.method === 'GET' ? 'sb-ui-badge--info' : 'sb-ui-badge--success'}`}>{item.method}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--sb-ui-color-grayscale-D300, #414141)' }}>{item.path}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100, #757575)' }}>{item.summary}</div>
                </div>
                <span className="sb-ui-tag sb-ui-tag--secondary sb-ui-tag--small">{item.version}</span>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--sb-ui-color-grayscale-L100, #b9b9b9)', fontSize: '12px' }}></i>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
