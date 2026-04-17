import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import BolivarLogo from './BolivarLogo';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
  { path: '/catalog', label: 'APIs', icon: 'fa-solid fa-book-open' },
  { path: '/sandbox', label: 'Sandbox', icon: 'fa-solid fa-flask-vial' },
  { path: '/apps', label: 'Apps', icon: 'fa-solid fa-key' },
  { path: '/analytics', label: 'Analytics', icon: 'fa-solid fa-chart-column' },
  { path: '/docs', label: 'Docs', icon: 'fa-solid fa-file-lines' },
  { path: '/admin', label: 'Admin', icon: 'fa-solid fa-shield-halved' },
  { path: '/governance', label: 'Versiones', icon: 'fa-solid fa-code-branch' },
];

export default function Layout() {
  const { aliado, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sb-ui-color-grayscale-L300, #f5f5f5)' }}>
      {/* Top Nav */}
      <header style={{ background: 'var(--sb-ui-color-primary-D200, #026B41)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div className="sb-ui-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          {/* Logo */}
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <BolivarLogo size="md" variant="light" />
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }} aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  textDecoration: 'none', transition: 'all 0.15s',
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: active ? 'var(--sb-ui-color-secondary-base, #ffe16f)' : 'rgba(255,255,255,0.75)',
                }}>
                  <i className={item.icon} style={{ marginRight: '5px', fontSize: '12px' }}></i>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {aliado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--sb-ui-color-secondary-base, #ffe16f)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: 'var(--sb-ui-color-primary-D200, #026B41)',
                }}>
                  {aliado.companyName.charAt(0)}
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {aliado.companyName}
                </span>
              </div>
            )}
            <button onClick={logout} className="sb-ui-button sb-ui-button--error sb-ui-button--small sb-ui-button--fill"
              style={{ fontSize: '12px', padding: '4px 12px' }}>
              <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: '4px' }}></i>Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="sb-ui-container" style={{ paddingTop: '28px', paddingBottom: '40px', flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--sb-ui-color-primary-D200, #026B41)', padding: '16px 0' }}>
        <div className="sb-ui-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BolivarLogo size="sm" variant="light" />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
            © 2026 Seguros Bolívar · Todos los derechos reservados
          </span>
        </div>
      </footer>
    </div>
  );
}
