import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AiAssistant from '@/components/AiAssistant';

export function MainLayout() {
  const { user, token, logout } = useAuthStore();
  const isAuthenticated = !!token && !!user;
  const location = useLocation();

  function isActive(path: string): boolean {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar — Seguros Bolívar corporate tabs */}
      <div className="bg-[#F5F7F2] border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 text-xs font-body">
            <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-t-lg font-semibold text-[#1A3C0E] -mb-px relative z-10">
              Developers
            </span>
            <span className="px-3 py-1.5 text-gray-500 cursor-default">Empresas</span>
            <span className="px-3 py-1.5 text-gray-500 cursor-default">APIs</span>
            <span className="px-3 py-1.5 text-gray-500 cursor-default">Open Insurance</span>
          </div>
        </div>
      </div>

      {/* Main header — Green gradient with logo and navigation */}
      <header className="bg-gradient-to-r from-[#1A3C0E] to-[#2E7D32] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="https://teasesoramos.com/wp-content/uploads/2025/09/Logo-Seguros-Bolivar.png"
                alt="Seguros Bolívar"
                className="h-8 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-lg font-display font-extrabold text-white leading-tight tracking-tight group-hover:text-[#76C442] transition-colors">
                  Vínculo
                </span>
                <span className="text-[9px] text-[#76C442] font-body leading-tight hidden sm:block">
                  Developer Portal
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-body font-medium">
              <Link
                to="/catalog"
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/catalog')
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/80 hover:bg-[#F9A825]/20 hover:text-[#F9A825]'
                }`}
              >
                Catálogo
              </Link>
              {isAuthenticated && user?.role !== 'PUBLICO' && (
                <>
                  {(user?.role === 'LIDER_TECNICO' || user?.role === 'ADMIN') && (
                    <>
                      <Link
                        to="/observability"
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive('/observability')
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-white/80 hover:bg-[#F9A825]/20 hover:text-[#F9A825]'
                        }`}
                      >
                        Observabilidad
                      </Link>
                      <Link
                        to="/governance"
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive('/governance')
                            ? 'bg-white/15 text-white font-semibold'
                            : 'text-white/80 hover:bg-[#F9A825]/20 hover:text-[#F9A825]'
                        }`}
                      >
                        Gobernanza
                      </Link>
                    </>
                  )}
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive('/admin')
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-white/80 hover:bg-[#F9A825]/20 hover:text-[#F9A825]'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Auth actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                    <div className="w-6 h-6 bg-[#76C442] rounded-full flex items-center justify-center text-[10px] font-bold text-[#1A3C0E]">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-white/90 font-body max-w-[140px] truncate">{user?.email}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="border border-white/30 text-white hover:bg-white/10 font-semibold px-4 py-1.5 rounded-full text-xs transition-all duration-200"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-[#76C442] hover:bg-[#F9A825] text-[#1A3C0E] font-bold px-5 py-2 rounded-full text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Acceso Clientes
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1A3C0E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src="https://teasesoramos.com/wp-content/uploads/2025/09/Logo-Seguros-Bolivar.png" alt="Seguros Bolívar" className="h-6 w-auto" />
                <span className="font-display font-bold text-[#76C442] text-sm">Vínculo</span>
              </div>
              <p className="text-xs text-white/50 font-body leading-relaxed">Portal de desarrolladores de Seguros Bolívar.</p>
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-[#76C442] mb-2">Portal</h4>
              <ul className="space-y-1 text-xs text-white/50 font-body">
                <li><Link to="/catalog" className="hover:text-[#F9A825] transition-colors">Catálogo</Link></li>
                <li><Link to="/auth" className="hover:text-[#F9A825] transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-[#76C442] mb-2">Productos</h4>
              <ul className="space-y-1 text-xs text-white/50 font-body">
                <li>Vida</li><li>Auto</li><li>Hogar</li><li>Salud</li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-[#76C442] mb-2">Soporte</h4>
              <ul className="space-y-1 text-xs text-white/50 font-body">
                <li>Documentación</li><li>Estado del servicio</li><li>Contacto</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-white/30 font-body">© {new Date().getFullYear()} Seguros Bolívar S.A.</p>
            <div className="flex items-center gap-3 text-[10px] text-white/30 font-body">
              <span>Términos</span><span>Privacidad</span><span>Habeas Data</span>
            </div>
          </div>
        </div>
      </footer>

      <AiAssistant />
    </div>
  );
}
