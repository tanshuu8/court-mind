import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/common';
import type { UserRole } from '../../types';

const ROLES: { id: UserRole; label: string; desc: string }[] = [
  { id: 'citizen', label: 'Citizen',  desc: 'Track cases, AI analysis & legal guidance.' },
  { id: 'lawyer',  label: 'Lawyer',   desc: 'Manage profile and receive consultations.' },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirm] = useState('');
  const [role, setRole]         = useState<UserRole>('citizen');
  const [showPwd, setShowPwd]   = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [errors, setErrors]     = useState<Partial<Record<string, string>>>({});

  const validate = (): boolean => {
    const e: Partial<Record<string, string>> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirmPwd) e.confirmPwd = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError(null);
    try {
      await register(name, email, password, role);
      const map: Record<UserRole, string> = { citizen: '/user/cases', lawyer: '/lawyer/profile', admin: '/admin/dashboard' };
      navigate(map[role], { replace: true });
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { background: '#F5F0E7', border: '1px solid #DED6C9', color: '#111111' };
  const labelCls = 'block text-xs font-bold uppercase tracking-wide mb-1.5';
  const fieldCls = 'w-full rounded-xl px-4 py-3 text-sm placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all';

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F0E7' }}>

      {/* Left brand strip */}
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[40%] shrink-0 flex-col justify-between px-12 py-14 relative overflow-hidden"
        style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 25% 40%, rgba(245,240,231,0.04) 0%, transparent 60%)',
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F5F0E7' }}>
            <Scale className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#F5F0E7' }}>CourtMind</span>
        </div>

        <div className="relative z-10">
          <h2
            className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight mb-6"
            style={{ color: '#F5F0E7', textShadow: '0 2px 0 rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)' }}
          >
            Your legal<br />workspace<br />starts here.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,231,0.45)' }}>
            Get a clearer view of your court documents, case information, and progress — all in one place.
          </p>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(245,240,231,0.2)' }}>
          For research and information purposes
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto" style={{ background: '#FFFCF7' }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#111111' }}>
              <Scale className="w-4 h-4" style={{ color: '#F5F0E7' }} />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: '#111111' }}>CourtMind</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: '#111111' }}>
              Create your account
            </h1>
            <p className="text-sm" style={{ color: '#716B63' }}>
              Get a clearer view of your court documents, case information, and progress.
            </p>
          </div>

          {error && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate id="register-form" className="space-y-4">
            {/* Role picker */}
            <div>
              <label className={labelCls} style={{ color: '#716B63' }}>I am a…</label>
              <div className="flex gap-2">
                {ROLES.map((r) => {
                  const sel = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className="flex-1 flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-150"
                      style={sel
                        ? { background: '#111111', border: '1px solid #111111' }
                        : { background: '#F5F0E7', border: '1px solid #DED6C9' }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: sel ? '#F5F0E7' : '#B5ADA3' }}
                      >
                        {sel && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#F5F0E7' }} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: sel ? '#F5F0E7' : '#111111' }}>{r.label}</p>
                      </div>
                      {sel && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: '#F5F0E7' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label htmlFor="register-name" className={labelCls} style={{ color: '#716B63' }}>Full name</label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className={fieldCls}
                style={inputStyle}
              />
              {errors.name && <p className="text-xs mt-1 font-medium" style={{ color: '#9f1239' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className={labelCls} style={{ color: '#716B63' }}>Email address</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={fieldCls}
                style={inputStyle}
              />
              {errors.email && <p className="text-xs mt-1 font-medium" style={{ color: '#9f1239' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className={labelCls} style={{ color: '#716B63' }}>Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`${fieldCls} pr-11`}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ color: '#B5ADA3' }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="flex-1 h-1 rounded-full" style={{ background: '#DED6C9' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (password.length / 8) * 100)}%`, background: password.length < 5 ? '#9f1239' : '#92400e' }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: '#B5ADA3' }}>Weak</span>
                </div>
              )}
              {errors.password && <p className="text-xs mt-1 font-medium" style={{ color: '#9f1239' }}>{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="register-confirm-password" className={labelCls} style={{ color: '#716B63' }}>Confirm password</label>
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                className={fieldCls}
                style={inputStyle}
              />
              {errors.confirmPwd && <p className="text-xs mt-1 font-medium" style={{ color: '#9f1239' }}>{errors.confirmPwd}</p>}
            </div>

            {/* Lawyer notice */}
            {role === 'lawyer' && (
              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{ background: '#F5F0E7', border: '1px solid #DED6C9', color: '#716B63' }}
              >
                <strong className="block mb-0.5" style={{ color: '#111111' }}>Lawyer Registration</strong>
                Your profile will show as <strong>Pending Verification</strong> until reviewed by an admin. Complete your profile details after registration.
              </div>
            )}

            <button
              type="submit"
              id="register-submit-btn"
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
                  Creating account…
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: '#B5ADA3' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-bold transition-opacity hover:opacity-70" style={{ color: '#111111' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
