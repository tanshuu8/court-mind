import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Eye, EyeOff, AlertCircle, FileText, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/common';

/* ── Brand Panel (Left) ─────────────────────────────────────────────────────── */
const BrandPanel: React.FC = () => (
  <div
    className="hidden lg:flex flex-col justify-between h-full px-12 py-14 relative overflow-hidden"
    style={{ background: '#111111' }}
  >
    {/* Subtle background texture */}
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage:
        'radial-gradient(circle at 20% 30%, rgba(245,240,231,0.04) 0%, transparent 50%),' +
        'radial-gradient(circle at 80% 70%, rgba(197,168,122,0.05) 0%, transparent 50%)',
    }} />

    {/* Logo */}
    <div className="relative z-10 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F5F0E7' }}>
        <Scale className="w-4 h-4 text-black" />
      </div>
      <span className="font-bold text-lg tracking-tight" style={{ color: '#F5F0E7' }}>CourtMind</span>
    </div>

    {/* Headline */}
    <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
      <h2
        className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight mb-6"
        style={{
          color: '#F5F0E7',
          textShadow: '0 2px 0 rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
        }}
      >
        Clarity for<br />Every Case.
      </h2>
      <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(245,240,231,0.5)' }}>
        A smarter workspace for understanding court documents, tracking case progress, and finding the information that matters.
      </p>

      {/* Layered document visual */}
      <div className="mt-10 relative" style={{ height: 180 }}>
        {/* Background doc */}
        <div
          className="absolute rounded-xl"
          style={{
            bottom: 0, left: 20, right: 40,
            height: 120,
            background: 'rgba(245,240,231,0.04)',
            border: '1px solid rgba(245,240,231,0.08)',
            transform: 'rotateZ(-3deg)',
          }}
        />
        {/* Middle doc */}
        <div
          className="absolute rounded-xl"
          style={{
            bottom: 12, left: 8, right: 24,
            height: 120,
            background: 'rgba(245,240,231,0.06)',
            border: '1px solid rgba(245,240,231,0.10)',
            transform: 'rotateZ(-1deg)',
          }}
        />
        {/* Front doc — floating */}
        <div
          className="absolute rounded-xl p-4 animate-card-center"
          style={{
            bottom: 20, left: 0, right: 12,
            height: 120,
            background: 'rgba(245,240,231,0.09)',
            border: '1px solid rgba(245,240,231,0.15)',
            boxShadow: '0 16px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3 h-3" style={{ color: 'rgba(245,240,231,0.4)' }} />
            <div className="h-1.5 rounded-full flex-1" style={{ background: 'rgba(245,240,231,0.15)' }} />
          </div>
          <div className="space-y-2">
            {[75, 55, 85, 40].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: 'rgba(245,240,231,0.12)' }} />
            ))}
          </div>
        </div>

        {/* Status pill */}
        <div
          className="absolute right-0 top-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-card-left"
          style={{ background: 'rgba(245,240,231,0.08)', border: '1px solid rgba(245,240,231,0.14)', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}
        >
          <Clock className="w-3 h-3" style={{ color: '#C5A87A' }} />
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(245,240,231,0.6)' }}>Timeline</span>
        </div>

        {/* Shield pill */}
        <div
          className="absolute left-2 top-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-card-right"
          style={{ background: 'rgba(245,240,231,0.06)', border: '1px solid rgba(245,240,231,0.10)', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}
        >
          <Shield className="w-3 h-3" style={{ color: '#C5A87A' }} />
          <span className="text-[10px] font-semibold" style={{ color: 'rgba(245,240,231,0.5)' }}>Verified</span>
        </div>
      </div>
    </div>

    {/* Footer note */}
    <p className="relative z-10 text-xs" style={{ color: 'rgba(245,240,231,0.2)' }}>
      Legal document intelligence · For research and information purposes
    </p>
  </div>
);

/* ── Login Page ─────────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShow] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true); setError(null);
    try {
      // Role is resolved from the authenticated user record — not chosen by the user at sign-in.
      // We pass 'citizen' as the default; the demo auth system uses the email-matched user's actual role.
      await login(email, password, 'citizen');
      // After login, navigate based on role stored in session
      const saved = sessionStorage.getItem('cm_user');
      const user = saved ? JSON.parse(saved) : null;
      const home = user?.role === 'admin' ? '/admin' : user?.role === 'lawyer' ? '/lawyer' : '/user';
      navigate(home, { replace: true });
    } catch {
      setError('Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#F5F0E7',
    border: '1px solid #DED6C9',
    color: '#111111',
  };
  const labelCls = 'block text-xs font-bold uppercase tracking-wide mb-1.5';

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F0E7' }}>
      {/* Left: brand panel */}
      <div className="hidden lg:block lg:w-[46%] xl:w-[44%] shrink-0" style={{ borderRight: '1px solid #DED6C9' }}>
        <BrandPanel />
      </div>

      {/* Right: auth panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: '#FFFCF7' }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#111111' }}>
              <Scale className="w-4 h-4" style={{ color: '#F5F0E7' }} />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: '#111111' }}>CourtMind</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: '#111111' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: '#716B63' }}>
              Sign in to continue to your CourtMind workspace.
            </p>
          </div>

          {error && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate id="login-form" className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className={labelCls} style={{ color: '#716B63' }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className={labelCls} style={{ color: '#716B63' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#716B63' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded"
                  style={{ color: '#B5ADA3' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-gray-900 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
              style={{ background: '#111111', color: '#F5F0E7', boxShadow: '0 4px 14px rgba(0,0,0,0.16)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 014 12z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#DED6C9' }} />
            <span className="text-xs" style={{ color: '#B5ADA3' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#DED6C9' }} />
          </div>

          <p className="text-sm text-center" style={{ color: '#B5ADA3' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold transition-opacity hover:opacity-70"
              style={{ color: '#111111' }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
