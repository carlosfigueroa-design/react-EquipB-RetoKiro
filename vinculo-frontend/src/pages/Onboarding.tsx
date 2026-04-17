import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import BolivarLogo from '../components/BolivarLogo';

const ALIADO_TYPES = [
  { value: 'INTERMEDIARIO', label: 'Intermediario', desc: 'Corredor o agencia de seguros', icon: 'fa-solid fa-handshake' },
  { value: 'FINTECH', label: 'Fintech', desc: 'Empresa de tecnología financiera', icon: 'fa-solid fa-credit-card' },
  { value: 'BANCO', label: 'Banco', desc: 'Entidad bancaria o financiera', icon: 'fa-solid fa-building-columns' },
  { value: 'ECOMMERCE', label: 'E-Commerce', desc: 'Plataforma de comercio electrónico', icon: 'fa-solid fa-cart-shopping' },
  { value: 'DESARROLLADOR', label: 'Desarrollador', desc: 'Desarrollador independiente', icon: 'fa-solid fa-code' },
];

const STEP_LABELS = ['Tipo de aliado', 'Datos empresa', 'Contacto', 'Credenciales', '¡Listo!'];

function LogoHeader() {
  return (
    <Link to="/" style={{ textDecoration: 'none' }}>
      <BolivarLogo size="md" variant="dark" />
    </Link>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '28px' }}>
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
              background: done ? 'var(--sb-ui-color-primary-base, #05A660)' : active ? 'var(--sb-ui-color-secondary-base, #ffe16f)' : 'var(--sb-ui-color-grayscale-L200, #e1e1e1)',
              color: done ? '#fff' : active ? 'var(--sb-ui-color-primary-D200, #026B41)' : 'var(--sb-ui-color-grayscale-D100, #757575)',
            }}>
              {done ? <i className="fa-solid fa-check" style={{ fontSize: '11px' }}></i> : stepNum}
            </div>
            {i < 4 && (
              <div style={{
                flex: 1, height: '2px', margin: '0 6px',
                background: done ? 'var(--sb-ui-color-primary-base, #05A660)' : 'var(--sb-ui-color-grayscale-L200, #e1e1e1)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    type: '', companyName: '', nit: '',
    contactName: '', contactPhone: '',
    email: '', password: '',
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Completa email y contraseña'); return; }
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.email || !form.password) { setError('Completa email y contraseña'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true); setError('');
    try {
      const res = await register(form);
      setResult(res);
      setStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const wrapperStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, var(--sb-ui-color-primary-D300, #086d44) 0%, var(--sb-ui-color-primary-base, #05A660) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
  };

  const cardStyle: React.CSSProperties = { maxWidth: isLogin ? '420px' : '640px', width: '100%' };

  // ── Login ──
  if (isLogin) {
    return (
      <div style={wrapperStyle}>
        <div className="sb-ui-card sb-ui-card--elevated" style={cardStyle}>
          <div className="sb-ui-card__body" style={{ padding: '36px' }}>
            <LogoHeader />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '28px 0 6px' }}>Iniciar sesión</h1>
            <p style={{ color: 'var(--sb-ui-color-grayscale-D100, #757575)', margin: '0 0 24px', fontSize: '14px' }}>Accede a tu portal de desarrollador</p>

            {error && <div className="vinculo-alert vinculo-alert--error" role="alert" style={{ marginBottom: '16px' }}><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}

            <div className="sb-ui-input-container" style={{ marginBottom: '14px' }}>
              <label className="sb-ui-input-label" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" className="sb-ui-input" value={form.email}
                onChange={e => update('email', e.target.value)} placeholder="dev@empresa.co" />
            </div>
            <div className="sb-ui-input-container" style={{ marginBottom: '24px' }}>
              <label className="sb-ui-input-label" htmlFor="login-password">Contraseña</label>
              <input id="login-password" type="password" className="sb-ui-input" value={form.password}
                onChange={e => update('password', e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>

            <button onClick={handleLogin} disabled={loading}
              className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--block sb-ui-button--large">
              {loading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Ingresando...</> : 'Ingresar'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--sb-ui-color-grayscale-D100)' }}>
              ¿No tienes cuenta?{' '}
              <button onClick={() => { setIsLogin(false); setError(''); }}
                style={{ color: 'var(--sb-ui-color-primary-base, #05A660)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Regístrate gratis
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Wizard ──
  return (
    <div style={wrapperStyle}>
      <div className="sb-ui-card sb-ui-card--elevated" style={cardStyle}>
        <div className="sb-ui-card__body" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <LogoHeader />
            <button onClick={() => { setIsLogin(true); setError(''); }} className="sb-ui-button sb-ui-button--secondary sb-ui-button--small">
              Ya tengo cuenta
            </button>
          </div>

          <StepIndicator current={step} />

          {error && <div className="vinculo-alert vinculo-alert--error" role="alert" style={{ marginBottom: '16px' }}><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 6px' }}>
                <i className="fa-solid fa-building" style={{ marginRight: '8px', color: 'var(--sb-ui-color-primary-base)' }}></i>Tipo de aliado
              </h2>
              <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', fontSize: '14px', margin: '0 0 20px' }}>¿Qué tipo de organización eres?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ALIADO_TYPES.map(t => (
                  <button key={t.value} onClick={() => { update('type', t.value); setStep(2); }}
                    style={{
                      textAlign: 'left', cursor: 'pointer', padding: '16px', borderRadius: '12px',
                      border: form.type === t.value ? '2px solid var(--sb-ui-color-primary-base, #05A660)' : '1px solid var(--sb-ui-color-grayscale-L200, #e1e1e1)',
                      background: form.type === t.value ? 'var(--sb-ui-color-primary-L400, #f2f9f6)' : '#fff',
                      transition: 'all 0.15s',
                    }}>
                    <i className={t.icon} style={{ fontSize: '22px', color: 'var(--sb-ui-color-primary-D100, #038450)', marginBottom: '8px', display: 'block' }}></i>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{t.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--sb-ui-color-grayscale-D100, #757575)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 6px' }}>
                <i className="fa-solid fa-clipboard" style={{ marginRight: '8px', color: 'var(--sb-ui-color-primary-base)' }}></i>Datos de empresa
              </h2>
              <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', fontSize: '14px', margin: '0 0 20px' }}>Cuéntanos sobre tu empresa</p>
              <div className="sb-ui-input-container" style={{ marginBottom: '14px' }}>
                <label className="sb-ui-input-label" htmlFor="companyName">Razón social</label>
                <input id="companyName" className="sb-ui-input" value={form.companyName}
                  onChange={e => update('companyName', e.target.value)} placeholder="Mi Empresa SAS" />
              </div>
              <div className="sb-ui-input-container" style={{ marginBottom: '24px' }}>
                <label className="sb-ui-input-label" htmlFor="nit">NIT</label>
                <input id="nit" className="sb-ui-input" value={form.nit}
                  onChange={e => update('nit', e.target.value)} placeholder="900123456-7" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} className="sb-ui-button sb-ui-button--secondary sb-ui-button--block">Atrás</button>
                <button onClick={() => form.companyName && form.nit ? setStep(3) : setError('Completa todos los campos')}
                  className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--block">Siguiente</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 6px' }}>
                <i className="fa-solid fa-user" style={{ marginRight: '8px', color: 'var(--sb-ui-color-primary-base)' }}></i>Contacto principal
              </h2>
              <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', fontSize: '14px', margin: '0 0 20px' }}>Datos de contacto principal</p>
              <div className="sb-ui-input-container" style={{ marginBottom: '14px' }}>
                <label className="sb-ui-input-label" htmlFor="contactName">Nombre completo</label>
                <input id="contactName" className="sb-ui-input" value={form.contactName}
                  onChange={e => update('contactName', e.target.value)} placeholder="Juan Pérez" />
              </div>
              <div className="sb-ui-input-container" style={{ marginBottom: '24px' }}>
                <label className="sb-ui-input-label" htmlFor="contactPhone">Teléfono</label>
                <input id="contactPhone" className="sb-ui-input" value={form.contactPhone}
                  onChange={e => update('contactPhone', e.target.value)} placeholder="+57 310 1234567" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} className="sb-ui-button sb-ui-button--secondary sb-ui-button--block">Atrás</button>
                <button onClick={() => form.contactName && form.contactPhone ? setStep(4) : setError('Completa todos los campos')}
                  className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--block">Siguiente</button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 6px' }}>
                <i className="fa-solid fa-lock" style={{ marginRight: '8px', color: 'var(--sb-ui-color-primary-base)' }}></i>Credenciales
              </h2>
              <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', fontSize: '14px', margin: '0 0 20px' }}>Crea tus credenciales de acceso</p>
              <div className="sb-ui-input-container" style={{ marginBottom: '14px' }}>
                <label className="sb-ui-input-label" htmlFor="reg-email">Email corporativo</label>
                <input id="reg-email" type="email" className="sb-ui-input" value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="dev@empresa.co" />
              </div>
              <div className="sb-ui-input-container" style={{ marginBottom: '24px' }}>
                <label className="sb-ui-input-label" htmlFor="reg-password">Contraseña (mín. 8 caracteres)</label>
                <input id="reg-password" type="password" className="sb-ui-input" value={form.password}
                  onChange={e => update('password', e.target.value)} placeholder="••••••••" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(3)} className="sb-ui-button sb-ui-button--secondary sb-ui-button--block">Atrás</button>
                <button onClick={handleRegister} disabled={loading}
                  className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--block">
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Creando...</>
                    : <><i className="fa-solid fa-rocket" style={{ marginRight: '8px' }}></i>Crear cuenta y sandbox</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Success */}
          {step === 5 && result && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px',
                background: 'var(--sb-ui-color-feedback-success-L400, #e9f6ec)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '36px', color: 'var(--sb-ui-color-feedback-success-base, #28a745)' }}></i>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px' }}>¡Bienvenido a VÍNCULO!</h2>
              <p style={{ color: 'var(--sb-ui-color-grayscale-D100)', margin: '0 0 24px', fontSize: '14px' }}>Tu sandbox está listo. Aquí están tus credenciales:</p>

              <div className="code-block" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: 'var(--sb-ui-color-secondary-base, #ffe16f)' }}>Client ID:</span>{' '}
                  <span>{result.sandbox?.clientId || 'N/A'}</span>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ color: 'var(--sb-ui-color-secondary-base, #ffe16f)' }}>Client Secret:</span>{' '}
                  <span>{result.sandbox?.clientSecret || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--sb-ui-color-secondary-base, #ffe16f)' }}>Sandbox URL:</span>{' '}
                  <span>{window.location.origin}</span>
                </div>
              </div>

              <div className="vinculo-alert vinculo-alert--info" style={{ marginBottom: '24px', textAlign: 'left' }}>
                <i className="fa-solid fa-circle-info"></i>
                <span>Guarda tus credenciales en un lugar seguro. El Client Secret no se mostrará de nuevo.</span>
              </div>

              <button onClick={() => navigate('/dashboard')}
                className="sb-ui-button sb-ui-button--primary sb-ui-button--fill sb-ui-button--large">
                Ir al Dashboard <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }}></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
