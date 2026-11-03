import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────── */
type Status = 'idle' | 'success' | 'error';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL: FormState = { name: '', email: '', subject: '', message: '' };

/* ── Field ──────────────────────────────────────────────────────────────── */
const Field: React.FC<{
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, id, error, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label htmlFor={id} className="ld-label">
      {label}
    </label>
    {children}
    {error && (
      <p style={{ fontSize: '.7rem', color: '#E8957A', marginTop: 4 }}>
        {error}
      </p>
    )}
  </div>
);

/* ── Contact Section ──────────────────────────────────────────────────── */
const CtaSection: React.FC = () => {
  const [form, setForm]     = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<Status>('idle');

  const change = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.name.trim())    errs.name    = 'Name is required.';
    if (!form.email.trim())   errs.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              errs.email   = 'Enter a valid email address.';
    if (!form.subject.trim()) errs.subject = 'Subject is required.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    /*
     * TODO: Replace this placeholder with a real API call or email service
     * (e.g., EmailJS, Resend, or a backend /api/contact endpoint).
     * Currently the form validates input only — no message is sent externally.
     */
    setStatus('success');
    setForm(INITIAL);
    setErrors({});
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      style={{ padding: '64px 32px' }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr',
          gap: 'clamp(32px, 5vw, 72px)',
          alignItems: 'start',
        }}
      >
        {/* ── Left: info ────────────────────────────────────────────────── */}
        <div>
          <p
            className="ld-badge"
            style={{ display: 'inline-flex', marginBottom: 16 }}
          >
            Contact
          </p>
          <h2
            id="contact-heading"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.55rem, 3vw, 2.1rem)',
              lineHeight: 1.2,
              color: '#F0E4CC',
              marginBottom: 16,
            }}
          >
            Get in Touch
          </h2>
          <p
            style={{
              fontSize: '.9rem',
              color: 'rgba(255,255,255,.44)',
              lineHeight: 1.72,
              maxWidth: 360,
              marginBottom: 36,
            }}
          >
            Have a question about CourtMind, encountered an issue, or want to
            share feedback? Fill in the form and we'll get back to you.
          </p>

          {/* Info items */}
          {[
            {
              label: 'Project',
              value: 'CourtMind — AI-Powered Legal Intelligence',
            },
            {
              label: 'Disclaimer',
              value:
                'AI responses are informational and are not a substitute for advice from a qualified lawyer.',
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                marginBottom: 20,
                paddingLeft: 14,
                borderLeft: '2px solid rgba(201,154,107,.28)',
              }}
            >
              <div
                style={{
                  fontSize: '.65rem',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(201,154,107,.7)',
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.55 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: form ───────────────────────────────────────────────── */}
        <div
          style={{
            background: 'rgba(255,255,255,.025)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 14,
            padding: 'clamp(24px, 4vw, 36px)',
          }}
        >
          {status === 'success' ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle
                size={40}
                style={{ color: '#7EC89A', margin: '0 auto 16px' }}
              />
              <h3
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: '#F0E4CC',
                  marginBottom: 10,
                }}
              >
                Message recorded
              </h3>
              <p
                style={{
                  fontSize: '.82rem',
                  color: 'rgba(255,255,255,.4)',
                  lineHeight: 1.65,
                  maxWidth: 320,
                  margin: '0 auto 20px',
                }}
              >
                Your details have been saved. Note: external email delivery
                requires backend configuration that is not yet connected — this
                will be integrated in the next phase of development.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                style={{
                  fontSize: '.8rem',
                  color: '#D9A66E',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0 16px',
                }}
              >
                <Field label="Name" id="contact-name" error={errors.name}>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={change}
                    className="ld-input"
                    style={errors.name ? { borderColor: 'rgba(232,149,122,.5)' } : undefined}
                  />
                </Field>
                <Field label="Email" id="contact-email" error={errors.email}>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={change}
                    className="ld-input"
                    style={errors.email ? { borderColor: 'rgba(232,149,122,.5)' } : undefined}
                  />
                </Field>
              </div>

              <Field label="Subject" id="contact-subject" error={errors.subject}>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  placeholder="What is this about?"
                  value={form.subject}
                  onChange={change}
                  className="ld-input"
                  style={errors.subject ? { borderColor: 'rgba(232,149,122,.5)' } : undefined}
                />
              </Field>

              <Field label="Message" id="contact-message" error={errors.message}>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Your message…"
                  value={form.message}
                  onChange={change}
                  className="ld-input"
                  style={errors.message ? { borderColor: 'rgba(232,149,122,.5)' } : undefined}
                />
              </Field>

              {status === 'error' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: 'rgba(232,149,122,.08)',
                    border: '1px solid rgba(232,149,122,.2)',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: '.8rem',
                    color: '#E8957A',
                  }}
                >
                  <AlertCircle size={14} />
                  Something went wrong. Please try again.
                </div>
              )}

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'center',
                  width: '100%',
                  padding: '12px 24px',
                  background: '#F3E3C8',
                  color: '#1B1612',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: '.875rem',
                  cursor: 'pointer',
                  transition: 'opacity .18s, transform .18s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '.88';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                }}
              >
                <Send size={15} />
                Send Message
              </button>

              <p
                style={{
                  fontSize: '.68rem',
                  color: 'rgba(255,255,255,.22)',
                  textAlign: 'center',
                  marginTop: 12,
                  lineHeight: 1.55,
                }}
              >
                Form validation is active. External email delivery requires
                backend integration (not yet connected).
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
