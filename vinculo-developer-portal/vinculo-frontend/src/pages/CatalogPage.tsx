import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CATALOG_APIS,
  searchApis,
  PRODUCT_LABELS,
  PROCESS_LABELS,
  type CatalogApi,
} from '@/lib/catalogData';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Product filter tabs shown above the card grid. */
const PRODUCT_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'VIDA', label: 'Vida' },
  { key: 'AUTO', label: 'Auto' },
  { key: 'HOGAR', label: 'Hogar' },
  { key: 'SALUD', label: 'Salud' },
  { key: 'OPEN_FINANCE', label: 'Open Finance' },
];

/** Sidebar navigation links. */
const SIDEBAR_NAV = [
  { to: '/catalog', label: 'Catálogo', icon: '📋' },
  { to: '/sandbox/api-emision-polizas', label: 'Sandbox', icon: '🧪' },
  { to: '/admin', label: 'Administración', icon: '⚙️', separator: true },
  { to: '/analytics', label: 'Analítica', icon: '📈' },
  { to: '/observability', label: 'Observabilidad', icon: '🔭' },
] as const;

/** Lifecycle‑state → display label + colour tokens. */
const STATE_CONFIG: Record<
  CatalogApi['lifecycleState'],
  { label: string; bg: string; text: string; ring: string }
> = {
  ACTIVE: {
    label: 'PUBLICADA',
    bg: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-300',
  },
  DEPRECATED: {
    label: 'DEPRECADA',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    ring: 'ring-orange-300',
  },
  DRAFT: {
    label: 'BORRADOR',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    ring: 'ring-yellow-300',
  },
  SUNSET: {
    label: 'RETIRADA',
    bg: 'bg-red-100',
    text: 'text-red-800',
    ring: 'ring-red-300',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CatalogPage() {
  const location = useLocation();

  /* ---- local state ---- */
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState('');

  /* ---- derived data ---- */
  const filteredApis: CatalogApi[] = useMemo(
    () => searchApis(searchQuery, activeProduct || undefined),
    [searchQuery, activeProduct],
  );

  const totalCount = CATALOG_APIS.length;
  const visibleCount = filteredApis.length;

  /* ---- helpers ---- */
  function isSidebarActive(path: string): boolean {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  function handleTabChange(productKey: string) {
    setActiveProduct(productKey);
  }

  /* ---- render ---- */
  return (
    <div className="flex min-h-[calc(100vh-10rem)]">
      {/* ============================================================ */}
      {/*  LEFT SIDEBAR                                                 */}
      {/* ============================================================ */}
      <aside
        className="hidden lg:flex flex-col w-48 shrink-0 bg-[#F5F7F2] border-r border-gray-200"
        aria-label="Navegación del portal"
      >
        <nav className="flex flex-col gap-1 p-4 sticky top-24">
          <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400 mb-2 px-3">
            Navegación
          </p>

          {SIDEBAR_NAV.map(({ to, label, icon, ...rest }) => {
            const active = isSidebarActive(to);
            const hasSeparator = 'separator' in rest && rest.separator;
            return (
              <div key={to}>
                {hasSeparator && <hr className="my-3 border-gray-200" />}
                <Link
                  to={to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium
                    transition-all duration-200
                    ${
                      active
                        ? 'bg-secondary/10 text-secondary font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="text-base" aria-hidden="true">
                    {icon}
                  </span>
                  {label}
                </Link>
              </div>
            );
          })}

          {/* Decorative divider */}
          <hr className="my-4 border-gray-200" />

          {/* Quick stats */}
          <div className="px-3 space-y-3">
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400">
                APIs disponibles
              </p>
              <p className="text-2xl font-display font-bold text-primary">{totalCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400">
                Productos
              </p>
              <p className="text-2xl font-display font-bold text-primary">
                {Object.keys(PRODUCT_LABELS).length}
              </p>
            </div>
          </div>
        </nav>
      </aside>

      {/* ============================================================ */}
      {/*  MAIN CONTENT                                                 */}
      {/* ============================================================ */}
      <div className="flex-1 px-3 sm:px-4 lg:px-6 py-4 max-w-7xl mx-auto w-full">
        {/* ---- Header ---- */}
        <header className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-primary flex items-center justify-center gap-2">
            <span aria-hidden="true">📋</span>
            Catálogo de APIs
          </h1>
          <p className="mt-1 font-body text-gray-500 text-sm max-w-md mx-auto">
            Explora las APIs disponibles del ecosistema Vínculo Bolívar
          </p>
        </header>

        {/* ---- Search bar ---- */}
        <div className="max-w-xl mx-auto mb-4">
          <label htmlFor="catalog-search" className="sr-only">
            Buscar APIs por nombre, categoría o descripción
          </label>
          <div className="relative">
            <span
              className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400"
              aria-hidden="true"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </span>
            <input
              id="catalog-search"
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, categoría o descripción..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300
                bg-white text-sm font-body text-primary placeholder:text-gray-400
                shadow-sm
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
                transition-shadow duration-200
              "
            />
          </div>
        </div>

        {/* ---- Product tabs ---- */}
        <div className="mb-3" role="tablist" aria-label="Filtrar por producto">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {PRODUCT_TABS.map(({ key, label }) => {
              const isActive = activeProduct === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(key)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-body font-medium
                    transition-all duration-200 border
                    ${
                      isActive
                        ? 'bg-secondary text-white border-secondary shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#F9A825] hover:text-[#F9A825] hover:bg-[#F9A825]/5'
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Results count ---- */}
        <p
          className="text-sm font-body text-gray-500 mb-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {visibleCount === totalCount
            ? `Mostrando ${totalCount} APIs`
            : `Mostrando ${visibleCount} de ${totalCount} APIs`}
        </p>

        {/* ---- API card grid ---- */}
        {visibleCount === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block" aria-hidden="true">
              🔍
            </span>
            <p className="font-body text-gray-500 text-lg">
              No se encontraron APIs con los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveProduct('');
              }}
              className="mt-4 text-secondary font-body font-semibold text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
            role="list"
            aria-label="Lista de APIs del catálogo"
          >
            {filteredApis.map((api) => (
              <ApiCard key={api.id} api={api} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ApiCard                                                            */
/* ------------------------------------------------------------------ */

interface ApiCardProps {
  api: CatalogApi;
}

function ApiCard({ api }: ApiCardProps) {
  const state = STATE_CONFIG[api.lifecycleState];
  const processLabel =
    PROCESS_LABELS[api.process] ?? api.process;

  return (
    <Link
      to={`/catalog/${api.id}`}
      role="listitem"
      className="
        group relative bg-white rounded-2xl border border-gray-100
        shadow-sb p-4 flex flex-col
        hover:shadow-sb-lg hover:-translate-y-1 hover:border-[#F9A825]/50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        transition-all duration-300
      "
      aria-label={`${api.name} — ${state.label}`}
    >
      {/* Top row: icon + process + state badge */}
      <div className="flex items-start justify-between mb-3">
        {/* Icon circle */}
        <div
          className="
            flex items-center justify-center w-10 h-10 rounded-full
            bg-green-50 text-2xl shrink-0
            group-hover:bg-[#F9A825]/15 group-hover:scale-110 transition-all duration-300
          "
          aria-hidden="true"
        >
          {api.icon}
        </div>

        {/* State badge */}
        <span
          className={`
            inline-flex items-center text-[10px] font-body font-bold uppercase tracking-wide
            px-2.5 py-1 rounded-full ring-1
            ${state.bg} ${state.text} ${state.ring}
          `}
        >
          {state.label}
        </span>
      </div>

      {/* Process label */}
      <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-gray-400 mb-1">
        {processLabel}
      </p>

      {/* API name */}
      <h3 className="font-display font-bold text-primary text-base leading-snug mb-1 group-hover:text-[#F9A825] transition-colors duration-200">
        {api.name}
      </h3>

      {/* Description */}
      <p className="font-body text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2 flex-1">
        {api.description}
      </p>

      {/* Footer: version + product tag */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
        <span className="text-[11px] font-mono text-gray-400">
          v{api.currentVersion}
        </span>
        <span className="text-gray-200" aria-hidden="true">
          •
        </span>
        <span className="text-[11px] font-body font-medium text-secondary bg-green-50 px-2 py-0.5 rounded-full">
          {PRODUCT_LABELS[api.product] ?? api.product}
        </span>
      </div>
    </Link>
  );
}
