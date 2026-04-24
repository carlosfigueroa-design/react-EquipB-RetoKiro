import { useState } from 'react';

/* ── Data ── */

type ServiceStatus = 'OK' | 'WARN' | 'ALERT';

interface Service {
  name: string;
  status: ServiceStatus;
  latency: number;
  errors: number;
  requests: number;
  uptime: number;
}

const SERVICES: Service[] = [
  { name: 'api-gateway', status: 'OK', latency: 45, errors: 3, requests: 12450, uptime: 99.97 },
  { name: 'auth-service', status: 'OK', latency: 78, errors: 12, requests: 8920, uptime: 99.85 },
  { name: 'catalog-service', status: 'WARN', latency: 234, errors: 47, requests: 15230, uptime: 99.69 },
  { name: 'sandbox-service', status: 'OK', latency: 156, errors: 8, requests: 4523, uptime: 99.82 },
  { name: 'notification-service', status: 'ALERT', latency: 1250, errors: 189, requests: 3210, uptime: 94.11 },
  { name: 'billing-service', status: 'OK', latency: 92, errors: 5, requests: 6780, uptime: 99.93 },
  { name: 'ai-assistant-service', status: 'WARN', latency: 890, errors: 34, requests: 2150, uptime: 98.42 },
];

interface ErrorEntry {
  code: string;
  description: string;
  count: number;
  service: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

const TOP_ERRORS: ErrorEntry[] = [
  { code: 'TIMEOUT_EXCEEDED', description: 'Request timeout after 30s', count: 89, service: 'notification-service', severity: 'HIGH' },
  { code: 'DB_CONNECTION_POOL', description: 'Connection pool exhausted', count: 47, service: 'catalog-service', severity: 'MEDIUM' },
  { code: 'RATE_LIMIT_HIT', description: 'Rate limit exceeded for OpenAI API', count: 34, service: 'ai-assistant-service', severity: 'MEDIUM' },
  { code: 'AUTH_TOKEN_EXPIRED', description: 'JWT token expired during request', count: 12, service: 'auth-service', severity: 'LOW' },
  { code: 'SMTP_CONN_REFUSED', description: 'SMTP connection refused', count: 8, service: 'notification-service', severity: 'HIGH' },
];

interface RcaEntry {
  code: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  affected: number;
  cause: string;
  solution: string;
}

const RCA_ANALYSIS: RcaEntry[] = [
  {
    code: 'TIMEOUT_EXCEEDED',
    severity: 'HIGH',
    affected: 156,
    cause: 'El servicio de notificaciones depende de un proveedor SMTP externo con latencia alta. Bajo carga, las conexiones se acumulan y superan el timeout de 30s.',
    solution: '1. Implementar cola de mensajes (SQS/RabbitMQ) para desacoplar el envío. 2. Aumentar timeout a 60s como medida temporal. 3. Agregar circuit breaker para el proveedor SMTP.',
  },
  {
    code: 'DB_CONNECTION_POOL',
    severity: 'MEDIUM',
    affected: 89,
    cause: 'El pool de conexiones PostgreSQL está configurado con max=10, insuficiente para el tráfico actual del catálogo. Queries lentas bloquean conexiones.',
    solution: '1. Aumentar pool max a 25. 2. Optimizar queries del catálogo con índices en product y lifecycleState. 3. Implementar connection pooling con PgBouncer.',
  },
  {
    code: 'RATE_LIMIT_HIT',
    severity: 'MEDIUM',
    affected: 34,
    cause: 'El asistente IA consume la API de OpenAI con rate limit de 60 RPM. En horas pico se supera el límite.',
    solution: '1. Implementar caché de respuestas frecuentes. 2. Agregar cola de prioridad para requests. 3. Solicitar aumento de rate limit al proveedor.',
  },
];

type TabId = 'apm' | 'rum' | 'cnm' | 'npm';

const STATUS_CFG: Record<ServiceStatus, { label: string; dot: string; badge: string }> = {
  OK: { label: 'OK', dot: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
  WARN: { label: 'WARN', dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
  ALERT: { label: 'ALERT', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
};

const SEV_CFG: Record<string, { cls: string }> = {
  HIGH: { cls: 'bg-red-100 text-red-800' },
  MEDIUM: { cls: 'bg-yellow-100 text-yellow-800' },
  LOW: { cls: 'bg-blue-100 text-blue-800' },
};

function fmt(n: number): string { return n.toLocaleString('es-CO'); }

/* ── Component ── */

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState<TabId>('apm');

  const alertCount = SERVICES.filter(s => s.status === 'ALERT').length;
  const warnCount = SERVICES.filter(s => s.status === 'WARN').length;

  const tabs: { id: TabId; label: string; icon: string; badge?: number }[] = [
    { id: 'apm', label: 'APM', icon: '⚡', badge: alertCount + warnCount },
    { id: 'rum', label: 'RUM / Synthetic', icon: '👤', badge: 1 },
    { id: 'cnm', label: 'CNM', icon: '☁️' },
    { id: 'npm', label: 'NPM', icon: '🔗' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3C0E] via-[#2E7D32] to-[#76C442] p-6 mb-6 shadow-sb-lg">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white flex items-center gap-3">
              <span aria-hidden="true">🔭</span> Observabilidad
            </h1>
            <p className="font-body text-white/70 mt-2 text-sm">Monitoreo en tiempo real del portal Vínculo Bolívar</p>
          </div>
          {alertCount > 0 && (
            <span className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm text-white font-body font-bold text-sm px-4 py-2 rounded-full border border-red-400/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400" /> ALERT
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-body font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#1A3C0E] text-white shadow-lg'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-[#F9A825] hover:text-[#F9A825]'
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'
              }`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* APM Tab */}
      {activeTab === 'apm' && (
        <div className="space-y-6">
          {/* Section: Application Performance Monitoring */}
          <section>
            <h2 className="text-lg font-display font-extrabold text-primary flex items-center gap-2 mb-4">
              <span aria-hidden="true">⚡</span> Application Performance Monitoring
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map(svc => {
                const st = STATUS_CFG[svc.status];
                return (
                  <div key={svc.name} className={`bg-white rounded-2xl shadow-sb border-l-4 p-5 hover:shadow-sb-lg hover:border-[#F9A825]/50 transition-all duration-300 ${
                    svc.status === 'ALERT' ? 'border-l-red-500' : svc.status === 'WARN' ? 'border-l-yellow-500' : 'border-l-green-500'
                  } border-t border-r border-b border-gray-100`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${st.dot} ${svc.status === 'ALERT' ? 'animate-pulse' : ''}`} />
                        <span className="font-mono text-sm font-bold text-primary">{svc.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                    </div>
                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className={`text-lg font-display font-extrabold ${svc.latency > 500 ? 'text-red-600' : 'text-primary'}`}>{svc.latency}ms</p>
                        <p className="text-[9px] font-body text-gray-400 uppercase">Resp. promedio</p>
                      </div>
                      <div>
                        <p className={`text-lg font-display font-extrabold ${svc.errors > 30 ? 'text-red-600' : svc.errors > 10 ? 'text-yellow-600' : 'text-primary'}`}>{svc.errors}</p>
                        <p className="text-[9px] font-body text-gray-400 uppercase">Errores</p>
                      </div>
                      <div>
                        <p className="text-lg font-display font-extrabold text-primary">{fmt(svc.requests)}</p>
                        <p className="text-[9px] font-body text-gray-400 uppercase">Requests</p>
                      </div>
                      <div>
                        <p className={`text-lg font-display font-extrabold ${svc.uptime < 99 ? 'text-red-600' : 'text-green-600'}`}>{svc.uptime}%</p>
                        <p className="text-[9px] font-body text-gray-400 uppercase">Uptime</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: Top Errors + RCA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Errors */}
            <section className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
              <h2 className="font-display font-bold text-primary text-lg mb-5">Top Errores</h2>
              <div className="space-y-4">
                {TOP_ERRORS.map(err => (
                  <div key={err.code} className="flex items-start justify-between gap-3 group">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-red-700 group-hover:text-[#F9A825] transition-colors">{err.code}</p>
                      <p className="font-body text-xs text-gray-500">{err.description}</p>
                      <p className="font-body text-[10px] text-gray-400 mt-0.5">{err.service}</p>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-primary shrink-0">{err.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* RCA Analysis */}
            <section className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
              <h2 className="font-display font-bold text-primary text-lg mb-5">Análisis Causa / Solución</h2>
              <div className="space-y-6">
                {RCA_ANALYSIS.map(rca => (
                  <div key={rca.code} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold text-primary">{rca.code}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${SEV_CFG[rca.severity].cls}`}>{rca.severity}</span>
                      <span className="text-[10px] font-body text-gray-400 ml-auto">{rca.affected} usuarios afectados</span>
                    </div>
                    <p className="font-body text-xs text-gray-600 mb-2">
                      <span className="font-semibold text-primary">Causa raíz:</span> {rca.cause}
                    </p>
                    <p className="font-body text-xs text-gray-600">
                      <span className="font-semibold text-secondary">Solución:</span> {rca.solution}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* RUM Tab */}
      {activeTab === 'rum' && (
        <div className="space-y-6">
          <h2 className="text-xl font-display font-extrabold text-primary flex items-center gap-2 mb-5">
            <span aria-hidden="true">👤</span> Real User Monitoring
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'LCP (Largest Contentful Paint)', value: '1.8s', status: 'good', icon: '🎨' },
              { label: 'FID (First Input Delay)', value: '45ms', status: 'good', icon: '👆' },
              { label: 'CLS (Cumulative Layout Shift)', value: '0.05', status: 'good', icon: '📐' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:border-[#F9A825]/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${m.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {m.status === 'good' ? 'BUENO' : 'MEJORAR'}
                  </span>
                </div>
                <p className="text-3xl font-display font-extrabold text-primary">{m.value}</p>
                <p className="text-[10px] font-body text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Sesiones activas', value: '342', icon: '👥' },
              { label: 'Errores JS (24h)', value: '12', icon: '🐛' },
              { label: 'Páginas/sesión', value: '4.2', icon: '📄' },
              { label: 'Tasa de rebote', value: '32.5%', icon: '↩️' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:border-[#F9A825]/40 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-2xl font-display font-extrabold text-primary">{m.value}</p>
                    <p className="text-[10px] font-body text-gray-400">{m.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CNM Tab */}
      {activeTab === 'cnm' && (
        <div className="space-y-6">
          <h2 className="text-xl font-display font-extrabold text-primary flex items-center gap-2 mb-5">
            <span aria-hidden="true">☁️</span> Cloud Network Monitoring
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Tráfico entrante (24h)', value: '2.4 GB', icon: '📥', color: 'bg-blue-100 text-blue-800' },
              { label: 'Tráfico saliente (24h)', value: '1.8 GB', icon: '📤', color: 'bg-green-100 text-green-800' },
              { label: 'Conexiones activas', value: '1,247', icon: '🔗', color: 'bg-purple-100 text-purple-800' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:border-[#F9A825]/40 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center text-lg mb-3`}>{m.icon}</div>
                <p className="text-2xl font-display font-extrabold text-primary">{m.value}</p>
                <p className="text-[10px] font-body text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
            <h3 className="font-display font-bold text-primary mb-4">Regiones activas</h3>
            <div className="space-y-3">
              {[
                { region: 'us-east-1 (Virginia)', latency: '12ms', status: 'OK' },
                { region: 'sa-east-1 (São Paulo)', latency: '45ms', status: 'OK' },
                { region: 'eu-west-1 (Irlanda)', latency: '120ms', status: 'OK' },
              ].map(r => (
                <div key={r.region} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-[#F9A825]/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-mono text-sm text-primary">{r.region}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-gray-500">{r.latency}</span>
                    <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NPM Tab */}
      {activeTab === 'npm' && (
        <div className="space-y-6">
          <h2 className="text-xl font-display font-extrabold text-primary flex items-center gap-2 mb-5">
            <span aria-hidden="true">🔗</span> Network Performance Monitoring
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'DNS Resolution', value: '8ms', icon: '🌐' },
              { label: 'TCP Handshake', value: '15ms', icon: '🤝' },
              { label: 'TLS Negotiation', value: '22ms', icon: '🔒' },
              { label: 'TTFB', value: '45ms', icon: '⚡' },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:border-[#F9A825]/40 transition-all duration-300 text-center">
                <span className="text-2xl block mb-2">{m.icon}</span>
                <p className="text-2xl font-display font-extrabold text-primary">{m.value}</p>
                <p className="text-[10px] font-body text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-6">
            <h3 className="font-display font-bold text-primary mb-4">Dependencias externas</h3>
            <div className="space-y-3">
              {[
                { name: 'PostgreSQL (RDS)', latency: '3ms', status: 'OK', requests: '45,230' },
                { name: 'Redis (ElastiCache)', latency: '1ms', status: 'OK', requests: '128,450' },
                { name: 'OpenAI API', latency: '890ms', status: 'WARN', requests: '2,150' },
                { name: 'SMTP Provider', latency: '1,250ms', status: 'ALERT', requests: '3,210' },
                { name: 'Kong Gateway', latency: '5ms', status: 'OK', requests: '53,113' },
              ].map(d => (
                <div key={d.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-[#F9A825]/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.status === 'OK' ? 'bg-green-500' : d.status === 'WARN' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="font-mono text-sm text-primary">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono text-gray-500">{d.latency}</span>
                    <span className="font-mono text-gray-400">{d.requests} req</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${STATUS_CFG[d.status as ServiceStatus].badge}`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
