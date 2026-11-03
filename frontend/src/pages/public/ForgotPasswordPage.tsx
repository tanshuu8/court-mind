import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail]     = useState('');
  const [isLoading, setLoad]  = useState(false);
  const [submitted, setDone]  = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setLoad(true); setError(null);
    // NOTE: No real password reset API is connected in this demo.
    // We simulate a network delay and show an honest confirmation.
    await new Promise((r) => setTimeout(r, 900));
    setLoad(false);
    setDone(true);
  };

  const inputStyle: React.CSSProperties = { background: '#F5F0E7', border: '1px solid #DED6C9', color: '#111111' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#F5F0E7' }}>
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#111111' }}>
            <Scale className="w-4 h-4" style={{ color: '#F5F0E7' }} />
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: '#111111' }}>CourtMind</span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: '#FFFCF7', border: '1px solid #DED6C9', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {submitted ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <div className="text-center py-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: '#F5F0E7', border: '1px solid #DED6C9' }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: '#111111' }} />
              </div>
              <h1 className="text-xl font-extrabold mb-2 tracking-tight" style={{ color: '#111111' }}>
                Check your email
              </h1>
              <p className="text-sm leading-relaxed mb-2" style={{ color: '#716B63' }}>
                If an account exists for <strong style={{ color: '#111111' }}>{email}</strong>, a password reset link has been sent.
              </p>
              <p className="text-xs mb-8" style={{ color: '#B5ADA3' }}>
                Note: Password recovery is not yet connected to a live backend in this demo.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold transition-all hover:bg-gray-900 hover:-translate-y-0.5"
                style={{ background: '#111111', color: '#F5F0E7' }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ────────────────────────────────────────────────── */
            <>
              <div className="mb-7">
                <h1 className="text-xl font-extrabold tracking-tight mb-1.5" style={{ color: '#111111' }}>
                  Reset your password
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: '#716B63' }}>
                  Enter the email address associated with your account. If password recovery is available, we'll guide you through the next steps.
                </p>
              </div>

              {error && (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm mb-5"
                  style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9f1239' }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate id="forgot-password-form" className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-bold uppercase tracking-wide mb-1.5"
                    style={{ color: '#716B63' }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#B5ADA3' }} />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="forgot-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-gray-900 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  style={{ background: '#111111', color: '#F5F0E7', boxShadow: '0 4px 14px rgba(0,0,0,0.14)' }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 014 12z" />
                      </svg>
                      Sending…
                    </>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#716B63' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
