import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Analytics() {
  const [overview, setOverview] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    api.getAnalyticsOverview().then(setOverview).catch(() => {});
    api.getMetrics().then(setMetrics).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px' }}>
          <i className="fa-solid fa-chart-column" style={{ marginRight: '10px', color: 'var(--sb-ui-color-primary-base)' }}></i>Analytics
        </h1>
        <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: 0, fontSize: '14px' }}>Métricas en tiempo real de tu consumo de APIs</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Aliados', value: overview?.totalAliados || 0, icon: 'fa-solid fa-users' },
          { label: 'Total API Calls', value: (overview?.totalApiCalls || 0).toLocaleString(), icon: 'fa-solid fa-arrow-right-arrow-left' },
          { label: 'Latencia Promedio', value: `${overview?.avgLatencyMs || 0} ms`, icon: 'fa-solid fa-gauge-high', color: 'var(--sb-ui-color-primary-base)' },
          { label: 'SLA Compliance', value: `${overview?.slaCompliance || 0}%`, icon: 'fa-solid fa-shield-halved', color: 'var(--sb-ui-color-feedback-success-base)' },
        ].map(s => (
          <div key={s.label} className="sb-ui-card sb-ui-card--elevated">
            <div className="sb-ui-card__body" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <i className={s.icon} style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-base)' }}></i>
                <span style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color || 'var(--sb-ui-color-grayscale-black)' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Latency */}
        {metrics?.latency && (
          <div className="sb-ui-card sb-ui-card--elevated">
            <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
              <span style={{ fontWeight: 600 }}><i className="fa-solid fa-stopwatch" style={{ marginRight: '8px' }}></i>Latencia por percentil</span>
            </div>
            <div className="sb-ui-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'p50', value: metrics.latency.p50, color: 'var(--sb-ui-color-feedback-success-base, #28a745)' },
                  { label: 'p95', value: metrics.latency.p95, color: 'var(--sb-ui-color-feedback-warning-base, #ffc100)' },
                  { label: 'p99', value: metrics.latency.p99, color: 'var(--sb-ui-color-feedback-error-base, #dc3545)' },
                ].map(p => (
                  <div key={p.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{p.value} ms</div>
                    <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100)', marginBottom: '8px' }}>{p.label}</div>
                    <div className="vinculo-progress">
                      <div className="vinculo-progress__bar" style={{ width: `${Math.min((p.value / 200) * 100, 100)}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top APIs */}
        <div className="sb-ui-card sb-ui-card--elevated">
          <div className="sb-ui-card__header" style={{ borderBottom: '1px solid var(--sb-ui-color-grayscale-L200)' }}>
            <span style={{ fontWeight: 600 }}><i className="fa-solid fa-ranking-star" style={{ marginRight: '8px' }}></i>Top APIs por consumo</span>
          </div>
          <div className="sb-ui-card__body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(overview?.topApis || []).map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="sb-ui-badge sb-ui-badge--info sb-ui-badge--small" style={{ width: '24px', textAlign: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', marginBottom: '4px' }}>{item.endpoint}</div>
                  <div className="vinculo-progress">
                    <div className="vinculo-progress__bar" style={{
                      width: `${(item.calls / (overview?.topApis?.[0]?.calls || 1)) * 100}%`,
                      background: 'var(--sb-ui-color-primary-base)',
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{item.calls?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
