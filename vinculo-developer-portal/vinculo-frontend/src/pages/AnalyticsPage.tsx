import { useState } from 'react';

/* ─────────────────────────── Mock Data ─────────────────────────── */

const VISITS_BY_DAY = [
  { day: 'sáb 11', value: 142 },
  { day: 'dom 12', value: 178 },
  { day: 'lun 13', value: 95 },
  { day: 'mar 14', value: 263 },
  { day: 'mié 15', value: 187 },
  { day: 'jue 16', value: 221 },
  { day: 'vie 17', value: 198 },
];

const API_CALLS_BY_DAY = [
  { day: 'sáb 11', value: 1523 },
  { day: 'dom 12', value: 1891 },
  { day: 'lun 13', value: 1182 },
  { day: 'mar 14', value: 2134 },
  { day: 'mié 15', value: 1878 },
  { day: 'jue 16', value: 2245 },
  { day: 'vie 17', value: 1974 },
];

const DEVICES = [
  { name: 'Desktop', pct: 62.3, sessions: 489, color: 'bg-[#2E7D32]' },
  { name: 'Mobile', pct: 28.1, sessions: 221, color: 'bg-blue-500' },
  { name: 'Tablet', pct: 9.6, sessions: 76, color: 'bg-orange-500' },
];

const TOP_APIS = [
  { rank: 1, name: 'Cotización de Seguros', calls: 3421 },
  { rank: 2, name: 'Emisión de Pólizas', calls: 2876 },
  { rank: 3, name: 'Consulta de Siniestros', calls: 2198 },
  { rank: 4, name: 'Gestión de Clientes', calls: 1854 },
  { rank: 5, name: 'Pagos y Recaudos', calls: 1312 },
];

/* ─────────────────────────── Helpers ─────────────────────────── */

function fmt(n: number): string {
  return n.toLocaleString('es-CO');
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

interface StatCardProps {
  value: string;
  label: string;
  icon: string;
  iconBg: string;
}

function StatCard({ value, label, icon, iconBg }: StatCardProps) {
  return (
    <div className="group bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:shadow-sb-lg hover:border-gold/40 transition-all duration-300 cursor-default">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform duration-300`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-display font-extrabold text-primary truncate">{value}</p>
          <p className="text-[11px] font-body font-semibold uppercase tracking-widest text-gray-400 truncate">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

interface BarChartProps {
  data: { day: string; value: number }[];
}

function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="flex items-end gap-3 h-48" role="img" aria-label="Gráfico de barras">
      {data.map((d, i) => {
        const heightPct = (d.value / max) * 100;
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={d.day}
            className="flex-1 flex flex-col items-center gap-2"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Tooltip */}
            <span
              className={`font-mono text-xs font-bold text-primary transition-all duration-200 ${
                isHovered ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-0'
              }`}
            >
              {fmt(d.value)}
            </span>
            {/* Bar */}
            <div className="w-full flex items-end" style={{ height: '140px' }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  isHovered ? 'bg-[#76C442]' : 'bg-[#1A3C0E]'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            {/* Label */}
            <span className="text-[10px] font-body text-gray-400 whitespace-nowrap">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Section Header ─────────────────────────── */

function SectionHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="text-lg font-display font-extrabold text-primary flex items-center gap-2 mb-4">
      <span aria-hidden="true">{emoji}</span> {title}
    </h2>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function AnalyticsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3C0E] via-[#2E7D32] to-[#76C442] p-6 mb-6 shadow-sb-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-20 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white flex items-center gap-3">
            <span aria-hidden="true">📊</span> Analítica del Portal
          </h1>
          <p className="font-body text-white/70 mt-2 text-sm sm:text-base">
            Métricas en tiempo real del portal Vínculo Bolívar
          </p>

          {/* Pill badges */}
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-body font-semibold text-sm px-4 py-2 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#76C442] animate-pulse" />
              {fmt(1224)} visitas
            </span>
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-body font-semibold text-sm px-4 py-2 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#F9A825] animate-pulse" />
              {fmt(786)} usuarios únicos
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Métricas de Uso ── */}
      <SectionHeader emoji="📈" title="Métricas de Uso" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          value={fmt(1224)}
          label="Visitas totales (7 días)"
          icon="👁️"
          iconBg="bg-green-100 text-green-800"
        />
        <StatCard
          value={fmt(786)}
          label="Usuarios únicos"
          icon="👤"
          iconBg="bg-blue-100 text-blue-800"
        />
        <StatCard
          value={fmt(175)}
          label="Promedio diario"
          icon="📊"
          iconBg="bg-orange-100 text-orange-800"
        />
      </div>

      {/* ── Section 2: Visitas por día + Dispositivos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:shadow-sb-lg hover:border-gold/40 transition-all duration-300">
          <h3 className="text-sm font-display font-bold text-primary mb-4 flex items-center gap-2">
            <span aria-hidden="true">📅</span> Visitas por día
          </h3>
          <BarChart data={VISITS_BY_DAY} />
        </div>

        {/* Devices */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:shadow-sb-lg hover:border-gold/40 transition-all duration-300">
          <h3 className="text-sm font-display font-bold text-primary mb-5 flex items-center gap-2">
            <span aria-hidden="true">💻</span> Dispositivos
          </h3>
          <div className="space-y-5">
            {DEVICES.map(d => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-body text-sm font-semibold text-gray-700">{d.name}</span>
                  <span className="font-mono text-xs text-gray-400">{d.pct}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.color} transition-all duration-700`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <p className="text-[10px] font-body text-gray-400 mt-1">{fmt(d.sessions)} sesiones</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: Engagement ── */}
      <SectionHeader emoji="🎯" title="Engagement" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          value="4m 5s"
          label="Tiempo promedio en sitio"
          icon="⏱️"
          iconBg="bg-purple-100 text-purple-800"
        />
        <StatCard
          value="4.2"
          label="Páginas por sesión"
          icon="📄"
          iconBg="bg-blue-100 text-blue-800"
        />
        <StatCard
          value="32.5%"
          label="Tasa de rebote"
          icon="↩️"
          iconBg="bg-pink-100 text-pink-800"
        />
        <StatCard
          value="41.8%"
          label="Usuarios recurrentes"
          icon="🔁"
          iconBg="bg-teal-100 text-teal-800"
        />
      </div>

      {/* ── Section 4: Métricas de Negocio ── */}
      <SectionHeader emoji="💼" title="Métricas de Negocio" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          value={fmt(12847)}
          label="Llamadas a APIs (7 días)"
          icon="🔗"
          iconBg="bg-green-100 text-green-800"
        />
        <StatCard
          value={fmt(4523)}
          label="Ejecuciones en Sandbox"
          icon="🧪"
          iconBg="bg-orange-100 text-orange-800"
        />
        <StatCard
          value={fmt(67)}
          label="Desarrolladores activos"
          icon="👨‍💻"
          iconBg="bg-blue-100 text-blue-800"
        />
      </div>

      {/* ── Section 5: Llamadas a APIs por día + Top APIs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:shadow-sb-lg hover:border-gold/40 transition-all duration-300">
          <h3 className="text-sm font-display font-bold text-primary mb-4 flex items-center gap-2">
            <span aria-hidden="true">🔗</span> Llamadas a APIs por día
          </h3>
          <BarChart data={API_CALLS_BY_DAY} />
        </div>

        {/* Top APIs */}
        <div className="bg-white rounded-2xl shadow-sb border border-gray-100 p-5 hover:shadow-sb-lg hover:border-gold/40 transition-all duration-300">
          <h3 className="text-sm font-display font-bold text-primary mb-5 flex items-center gap-2">
            <span aria-hidden="true">🏆</span> Top APIs más consumidas
          </h3>
          <div className="space-y-4">
            {TOP_APIS.map(api => {
              const maxCalls = TOP_APIS[0].calls;
              const widthPct = (api.calls / maxCalls) * 100;
              return (
                <div key={api.rank} className="group/api">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          api.rank === 1
                            ? 'bg-[#F9A825] text-white'
                            : api.rank === 2
                              ? 'bg-gray-300 text-white'
                              : api.rank === 3
                                ? 'bg-orange-400 text-white'
                                : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {api.rank}
                      </span>
                      <span className="font-body text-xs font-semibold text-gray-700 truncate">
                        {api.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-gray-400 shrink-0 ml-2">
                      {fmt(api.calls)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2E7D32] group-hover/api:bg-[#76C442] transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="text-center py-4">
        <p className="font-body text-xs text-gray-400">
          Datos actualizados cada 5 minutos · Última actualización: hace 2 minutos
        </p>
      </div>
    </div>
  );
}
