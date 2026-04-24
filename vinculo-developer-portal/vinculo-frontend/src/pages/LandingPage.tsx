import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const FEATURED_APIS = [
  {
    product: 'Vida',
    icon: '🛡️',
    color: 'from-emerald-500 to-emerald-700',
    apis: [
      { name: 'Cotización Vida Individual', description: 'Genera cotizaciones de seguros de vida individual con cálculo de prima en tiempo real.' },
      { name: 'Emisión Póliza Vida', description: 'Emite pólizas de vida con validación automática de beneficiarios y coberturas.' },
      { name: 'Siniestros Vida', description: 'Gestiona reclamaciones y siniestros de seguros de vida con trazabilidad completa.' },
    ],
  },
  {
    product: 'Auto',
    icon: '🚗',
    color: 'from-blue-500 to-blue-700',
    apis: [
      { name: 'Cotización Auto', description: 'Cotiza seguros de automóvil con integración FASECOLDA y cálculo de deducibles.' },
      { name: 'Emisión SOAT', description: 'Emite SOAT digital con validación de placa y datos del vehículo en tiempo real.' },
      { name: 'Siniestros Auto', description: 'Reporta y gestiona siniestros vehiculares con seguimiento de estado.' },
    ],
  },
  {
    product: 'Hogar',
    icon: '🏠',
    color: 'from-amber-500 to-amber-700',
    apis: [
      { name: 'Cotización Hogar', description: 'Genera cotizaciones de seguros de hogar con cobertura personalizada por zona.' },
      { name: 'Emisión Hogar', description: 'Emite pólizas de hogar con validación de dirección y coberturas adicionales.' },
      { name: 'Renovación Hogar', description: 'Gestiona renovaciones automáticas de pólizas de hogar con ajuste de prima.' },
    ],
  },
  {
    product: 'Salud',
    icon: '❤️',
    color: 'from-rose-500 to-rose-700',
    apis: [
      { name: 'Cotización Salud', description: 'Cotiza planes de salud complementaria con cobertura por grupo familiar.' },
      { name: 'Validación Beneficiarios', description: 'Valida beneficiarios y preexistencias para planes de salud.' },
      { name: 'Red Prestadores', description: 'Consulta la red de prestadores de salud por ubicación y especialidad.' },
    ],
  },
];

const BENEFITS = [
  {
    title: 'Autoservicio',
    description: 'Onboarding en menos de 5 minutos. Explora, prueba e integra APIs sin depender de equipos internos.',
    link: '/catalog',
    cta: 'Explorar catálogo',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Sandbox Interactivo',
    description: 'Prueba APIs con datos realistas de seguros en un entorno seguro antes de ir a producción.',
    link: '/sandbox/api-emision-polizas',
    cta: 'Probar APIs',
    requiresAuth: true,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Documentación IA',
    description: 'Documentación auto-generada con IA, snippets de código y asistente contextual integrado.',
    link: '/catalog/api-emision-polizas',
    cta: 'Ver documentación',
    requiresAuth: true,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '12+', label: 'APIs disponibles' },
  { value: '4', label: 'Líneas de producto' },
  { value: '99.9%', label: 'SLA garantizado' },
  { value: '<200ms', label: 'Latencia promedio' },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A3C0E] via-[#2E7D32] to-[#1A3C0E] text-white py-8 sm:py-10 md:py-14" aria-label="Hero">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-5 w-48 h-48 bg-[#76C442] rounded-full blur-3xl" />
          <div className="absolute bottom-5 right-5 w-64 h-64 bg-[#F9A825] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 bg-[#76C442] rounded-full animate-pulse" />
            <span className="text-[11px] font-body text-white/90">Ecosistema Open Insurance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold mb-3 leading-tight">
            Conecta tu negocio con el
            <br />
            <span className="text-[#76C442]">futuro del seguro</span>
          </h1>
          <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto mb-5 font-body leading-relaxed">
            Explora, prueba e integra APIs de seguros del ecosistema OpenX de Seguros Bolívar.
            Conecta tu fintech, intermediario o plataforma digital con nuestras APIs en minutos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth"
              className="bg-[#76C442] hover:bg-[#F9A825] text-[#1A3C0E] font-bold px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-sm"
              aria-label="Registrarse o iniciar sesión en el portal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              Comenzar ahora
            </Link>
            <Link
              to="/catalog"
              className="border-2 border-white/30 text-white hover:bg-[#F9A825] hover:border-[#F9A825] hover:text-[#1A3C0E] font-semibold px-6 py-3 rounded-full transition-all duration-200 inline-flex items-center gap-2 text-sm"
            >
              Explorar APIs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white shadow-sm border-b border-gray-100" aria-label="Estadísticas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-4 gap-2">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg sm:text-xl md:text-2xl font-display font-extrabold text-[#1A3C0E]">{stat.value}</p>
                <p className="text-[10px] font-body text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-4 bg-[#F5F7F2]" aria-label="Buscador global">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <form onSubmit={handleSearch} role="search" aria-label="Buscar APIs">
            <div className="flex gap-2">
              <label htmlFor="landing-search" className="sr-only">Buscar APIs</label>
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input id="landing-search" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar APIs por nombre o producto..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:border-[#76C442] focus:ring-1 focus:ring-[#76C442]/20 transition-all bg-white" />
              </div>
              <button type="submit" className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white font-bold px-4 py-2.5 rounded-lg transition-all text-sm shrink-0">Buscar</button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured APIs Section */}
      <section className="py-6 sm:py-8" aria-label="APIs destacadas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#1A3C0E] mb-1">
              APIs por Línea de Producto
            </h2>
            <p className="text-gray-500 font-body max-w-2xl mx-auto">
              Accede a APIs especializadas para cada línea de negocio del ecosistema de seguros.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FEATURED_APIS.map((group) => (
              <div key={group.product} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#F9A825]/40 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                <div className={`bg-gradient-to-r ${group.color} px-3 sm:px-4 py-2.5 flex items-center gap-2 group-hover:brightness-110 transition-all duration-300`}>
                  <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300">{group.icon}</span>
                  <h3 className="text-sm sm:text-base font-display font-bold text-white">{group.product}</h3>
                </div>
                <div className="p-3">
                  <ul className="space-y-2" aria-label={`APIs de ${group.product}`}>
                    {group.apis.map((api) => (
                      <li key={api.name} className="border-l-2 border-[#76C442] pl-2 hover:border-[#F9A825] hover:bg-[#F9A825]/5 rounded-r py-0.5 transition-all duration-200 cursor-default">
                        <p className="font-body font-semibold text-[#1A3C0E] text-xs sm:text-sm">{api.name}</p>
                        <p className="font-body text-[10px] sm:text-xs text-gray-500 leading-relaxed">{api.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/catalog"
              className="bg-[#2E7D32] hover:bg-[#F9A825] hover:text-[#1A3C0E] text-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
              aria-label="Ver catálogo completo de APIs"
            >
              Ver Catálogo Completo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-6 sm:py-8 bg-white" aria-label="Beneficios del portal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#1A3C0E] mb-1">
              ¿Por qué Vínculo?
            </h2>
            <p className="text-gray-500 font-body max-w-2xl mx-auto">
              Todo lo que necesitas para integrar APIs de seguros de forma rápida y segura.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BENEFITS.map((benefit) => {
              const href = benefit.requiresAuth && !isAuthenticated
                ? `/auth?redirect=${encodeURIComponent(benefit.link)}`
                : benefit.link;
              return (
                <Link
                  key={benefit.title}
                  to={href}
                  className="bg-[#F5F7F2] rounded-xl p-4 sm:p-5 text-center border border-gray-100 hover:shadow-lg hover:border-[#F9A825]/40 hover:-translate-y-0.5 transition-all duration-300 group block"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-[#76C442]/20 text-[#2E7D32] rounded-xl mb-3 group-hover:bg-[#F9A825]/20 group-hover:text-[#F9A825] group-hover:scale-110 transition-all duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-sm sm:text-base font-display font-bold text-[#1A3C0E] mb-2 group-hover:text-[#F9A825] transition-colors duration-200">
                    {benefit.title}
                  </h3>
                  <p className="font-body text-xs text-gray-600 leading-relaxed mb-3">{benefit.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-body font-semibold text-[#2E7D32] group-hover:text-[#F9A825] transition-colors">
                    {benefit.cta}
                    <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    {benefit.requiresAuth && !isAuthenticated && (
                      <svg className="w-3 h-3 ml-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-6 sm:py-8 bg-gradient-to-r from-[#1A3C0E] to-[#2E7D32]" aria-label="Call to action">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
            ¿Listo para conectar?
          </h2>
          <p className="text-white/70 font-body mb-4 max-w-xl mx-auto text-xs sm:text-sm">
            Regístrate en menos de 5 minutos y comienza a explorar el ecosistema de APIs de Seguros Bolívar.
          </p>
          <Link
            to="/auth"
            className="bg-[#76C442] hover:bg-[#F9A825] text-[#1A3C0E] font-bold px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center gap-2 text-sm"
          >
            Crear cuenta gratuita
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
