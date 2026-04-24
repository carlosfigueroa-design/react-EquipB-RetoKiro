import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

type AuthStep = 'email' | 'otp';
type AuthStatus = 'idle' | 'sending' | 'verifying' | 'error' | 'success';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const IS_DEV = import.meta.env.DEV;

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { login, user } = useAuthStore();

  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        redirectByRole(user.role);
      }
    }
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  function redirectByRole(role: string) {
    switch (role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'LIDER_TECNICO':
        navigate('/observability');
        break;
      case 'EXTERNO':
        navigate('/catalog');
        break;
      default:
        navigate('/');
    }
  }

  function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setOtpSentSuccess(false);

    if (!isValidEmail(email)) {
      setErrorMessage('Por favor ingresa un email válido.');
      return;
    }

    setStatus('sending');
    try {
      const response = await apiClient.post('/auth/request-otp', { email });
      setStep('otp');
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      setOtpSentSuccess(true);
      setStatus('idle');
      // In dev mode, auto-fill the OTP from the backend response
      if (response.data?.devOtp) {
        const code = response.data.devOtp;
        setDevOtp(code);
        setOtp(code.split(''));
      }
      if (response.data?.emailPreviewUrl) {
        setEmailPreviewUrl(response.data.emailPreviewUrl);
      }
    } catch (err: unknown) {
      setStatus('error');
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 429) {
        setErrorMessage('Cuenta bloqueada temporalmente. Intenta en 15 minutos.');
      } else {
        setErrorMessage(error.response?.data?.message || 'Error al enviar el código OTP.');
      }
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Ingresa los 6 dígitos del código OTP.');
      return;
    }

    setStatus('verifying');
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp: otpCode });
      const { accessToken, refreshToken, user: userData } = response.data;
      login(accessToken, refreshToken, userData);
      setStatus('success');
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        redirectByRole(userData.role);
      }
    } catch (err: unknown) {
      setStatus('error');
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 429) {
        setErrorMessage('Demasiados intentos. Cuenta bloqueada por 15 minutos.');
      } else if (error.response?.status === 401) {
        setErrorMessage('Código OTP inválido. Verifica e intenta de nuevo.');
      } else {
        setErrorMessage(error.response?.data?.message || 'Error al verificar el código.');
      }
    }
  }

  async function handleResendOtp() {
    setErrorMessage('');
    setOtpSentSuccess(false);
    setDevOtp(null);
    setEmailPreviewUrl(null);
    setStatus('sending');
    try {
      const response = await apiClient.post('/auth/request-otp', { email });
      setOtp(['', '', '', '', '', '']);
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      setOtpSentSuccess(true);
      setStatus('idle');
      // In dev mode, auto-fill the OTP
      if (response.data?.devOtp) {
        const code = response.data.devOtp;
        setDevOtp(code);
        setOtp(code.split(''));
      }
      if (response.data?.emailPreviewUrl) {
        setEmailPreviewUrl(response.data.emailPreviewUrl);
      } else {
        otpRefs.current[0]?.focus();
      }
    } catch {
      setStatus('error');
      setErrorMessage('Error al reenviar el código OTP.');
    }
  }

  function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-6 bg-gradient-to-br from-[#F5F7F2] to-[#E8F0E2]">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with branding */}
          <div className="bg-gradient-to-r from-[#1A3C0E] to-[#2E7D32] px-6 py-4 text-center">
            <img src="https://teasesoramos.com/wp-content/uploads/2025/09/Logo-Seguros-Bolivar.png" alt="Seguros Bolívar" className="h-8 w-auto mx-auto mb-2" />
            <h1 className="text-lg font-display font-extrabold text-white tracking-tight">Vínculo</h1>
            <p className="text-[#76C442] text-[10px] font-body">Developer Portal</p>
          </div>

          {/* Form body */}
          <div className="px-6 py-5">
            <h2 className="text-base font-display font-bold text-[#1A3C0E] mb-1 text-center">
              {step === 'email' ? 'Iniciar sesión' : 'Verificar código'}
            </h2>
            <p className="text-xs font-body text-gray-500 text-center mb-4">
              {step === 'email'
                ? 'Ingresa tu email corporativo para recibir un código de acceso.'
                : (
                  <>Enviamos un código de 6 dígitos a <span className="font-semibold text-[#1A3C0E]">{email}</span></>
                )}
            </p>

            {/* Email Step */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} aria-label="Formulario de email">
                <div className="mb-5">
                  <label htmlFor="auth-email" className="block text-sm font-body font-semibold text-[#1A3C0E] mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-[#76C442] focus:ring-2 focus:ring-[#76C442]/20 transition-all"
                      aria-describedby={errorMessage ? 'auth-error' : undefined}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div id="auth-error" role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-[#2E7D32] hover:bg-[#1A3C0E] active:scale-[0.98] text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#2E7D32]/20"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Enviar código de acceso
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} aria-label="Formulario de verificación OTP">
                {/* Dev mode OTP display */}
                {IS_DEV && devOtp && (
                  <div className="bg-amber-50 border-2 border-amber-300 text-amber-800 rounded-xl p-4 text-sm mb-5" role="status">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <span className="font-bold">Modo Desarrollo</span>
                    </div>
                    <p className="text-xs">Tu código OTP es: <span className="font-mono font-bold text-lg text-[#1A3C0E] tracking-widest">{devOtp}</span></p>
                    <p className="text-xs text-amber-600 mt-1">Se ha auto-completado en los campos.</p>
                    {emailPreviewUrl && (
                      <a href={emailPreviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] mt-2 hover:text-[#F9A825] transition-colors">
                        📬 Ver correo enviado →
                      </a>
                    )}
                  </div>
                )}

                {otpSentSuccess && !devOtp && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm mb-4 flex items-center gap-2" role="status">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Código OTP enviado a tu correo.
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-sm font-body font-semibold text-[#1A3C0E] mb-3 text-center">
                    Código de verificación
                  </label>
                  <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-12 h-14 text-center text-xl font-mono font-bold border-2 rounded-xl transition-all duration-200 focus:outline-none focus:border-[#76C442] focus:ring-2 focus:ring-[#76C442]/20 ${
                          digit ? 'border-[#2E7D32] bg-[#F5F7F2]' : 'border-gray-200'
                        }`}
                        aria-label={`Dígito ${index + 1} del código OTP`}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown */}
                {countdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm font-body text-gray-500 mb-4" aria-live="polite">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Expira en{' '}
                    <span className="font-mono font-bold text-[#1A3C0E]">
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                )}
                {countdown === 0 && step === 'otp' && (
                  <div className="flex items-center justify-center gap-2 text-sm font-body text-red-600 mb-4" role="alert">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    El código ha expirado. Solicita uno nuevo.
                  </div>
                )}

                {errorMessage && (
                  <div id="auth-error" role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'verifying' || otp.join('').length !== 6}
                  className="w-full bg-[#2E7D32] hover:bg-[#1A3C0E] active:scale-[0.98] text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#2E7D32]/20"
                >
                  {status === 'verifying' ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Verificar código
                    </>
                  )}
                </button>

                {/* Resend & Back */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp(['', '', '', '', '', '']);
                      setErrorMessage('');
                      setStatus('idle');
                      setCountdown(0);
                      setOtpSentSuccess(false);
                      setDevOtp(null);
                      setEmailPreviewUrl(null);
                    }}
                    className="text-sm font-body text-gray-400 hover:text-[#1A3C0E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#76C442] rounded"
                  >
                    ← Cambiar email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend && countdown > 0}
                    className="text-sm font-body font-semibold text-[#2E7D32] hover:text-[#1A3C0E] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#76C442] rounded"
                    aria-label="Reenviar código OTP"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-400 mt-6 font-body">
          © {new Date().getFullYear()} Seguros Bolívar — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
