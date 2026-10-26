import React from 'react';
import { ButtonLink } from '../ui/Button';

const CtaSection: React.FC = () => (
  <section
    id="contact"
    aria-labelledby="cta-heading"
    className="relative text-center"
    style={{ padding: '96px 32px' }}
  >
    {/* Subtle centred glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        style={{
          width: 600,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(201,154,107,.1) 0%, transparent 70%)',
        }}
      />
    </div>

    <div className="relative mx-auto" style={{ maxWidth: 560 }}>
      {/* Scale icon mark */}
      <div
        aria-hidden="true"
        className="inline-flex items-center justify-center mb-8"
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: '1.5px solid rgba(232,201,160,.25)',
          background: 'rgba(201,154,107,.08)',
        }}
      >
        <svg viewBox="0 0 32 32" width={28} height={28} fill="none" aria-hidden="true">
          <rect x="15" y="4"  width="2" height="22" rx="1" fill="#C99A6B"/>
          <rect x="4"  y="11" width="24" height="2"  rx="1" fill="#C99A6B"/>
          <ellipse cx="9"  cy="19" rx="5" ry="2" fill="rgba(201,154,107,.5)"/>
          <ellipse cx="23" cy="19" rx="5" ry="2" fill="rgba(201,154,107,.5)"/>
          <circle cx="9"  cy="13" r="1.5" fill="#E8C9A0"/>
          <circle cx="23" cy="13" r="1.5" fill="#E8C9A0"/>
        </svg>
      </div>

      <h2
        id="cta-heading"
        className="font-display font-bold text-ltext mb-4"
        style={{ fontSize: 'clamp(1.9rem,4vw,2.75rem)', lineHeight: 1.15 }}
      >
        Start with one document.
      </h2>
      <p
        className="mb-10 leading-relaxed"
        style={{ color: '#D3C7B3', fontSize: '1rem', lineHeight: 1.7 }}
      >
        Upload a court document and let CourtMind help you understand what it contains,
        key dates, and what might affect how the case progresses.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <ButtonLink to="/register" variant="primary">
          Create Account
        </ButtonLink>
        <ButtonLink to="/login" variant="ghost">
          Sign In
        </ButtonLink>
      </div>
    </div>
  </section>
);

export default CtaSection;
