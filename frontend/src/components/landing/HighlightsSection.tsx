import React from 'react';

const HIGHLIGHTS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Document Intelligence',
    body: 'Instantly convert lengthy court documents into structured, readable summaries with key dates highlighted.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Case Timeline',
    body: 'Visualise chronological case events from filing to latest hearing — all in one organised view.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'AI-Powered Insights',
    body: 'Access delay-risk analysis and source-grounded answers — powered by AI when connected to trained models.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Lawyer Connect',
    body: 'Browse verified lawyers on the platform and request consultations directly through CourtMind.',
  },
];

const HighlightsSection: React.FC = () => (
  <section
    aria-labelledby="highlights-heading"
    style={{ padding: '64px 32px' }}
  >
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      {/* Section label */}
      <h2
        id="highlights-heading"
        style={{
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.45rem, 2.8vw, 2rem)',
          color: '#F0E4CC',
          marginBottom: 10,
        }}
      >
        Everything in One Workspace
      </h2>
      <p style={{ textAlign: 'center', fontSize: '.88rem', color: 'rgba(255,255,255,.35)', marginBottom: 48, maxWidth: 420, margin: '0 auto 48px' }}>
        CourtMind brings the tools you need to understand and follow a court case into a single, clear platform.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 20,
        }}
      >
        {HIGHLIGHTS.map(({ icon, title, body }) => (
          <div
            key={title}
            style={{
              padding: '24px 22px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.07)',
              background: 'rgba(255,255,255,.018)',
              transition: 'border-color .22s, transform .22s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,154,107,.28)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.07)';
              (e.currentTarget as HTMLDivElement).style.transform = 'none';
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'rgba(201,154,107,.09)',
                border: '1px solid rgba(201,154,107,.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C99A6B',
                marginBottom: 16,
              }}
            >
              {icon}
            </div>

            <h3
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '.92rem',
                color: '#F0E4CC',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '.78rem',
                color: 'rgba(255,255,255,.38)',
                lineHeight: 1.68,
                margin: 0,
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HighlightsSection;
