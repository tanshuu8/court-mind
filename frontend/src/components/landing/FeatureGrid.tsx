import React from 'react';

const FEATURES = [
  {
    num: '01',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'AI Document Analysis',
    description:
      'Turn lengthy court documents into structured summaries, important dates, and key information — easier to review and understand.',
    detail: 'Summaries · Key dates · Source references',
  },
  {
    num: '02',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Case Delay Risk Insights',
    description:
      'Explore delay-risk indicators and the reasoning behind predictions — available when a trained model and suitable case data are connected.',
    detail: 'Risk indicators · Explainability · Model-dependent',
  },
  {
    num: '03',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Timeline & Document Q&A',
    description:
      'Follow chronological case events and ask questions about uploaded documents — source-grounded responses when the AI service is connected.',
    detail: 'Chronology · Source-grounded · AI-dependent',
  },
] as const;

const FeatureGrid: React.FC = () => (
  <section
    id="features"
    aria-labelledby="features-heading"
    style={{ padding: '72px 32px' }}
  >
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: 64 }}>
        <p className="ld-badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
          Features
        </p>
        <h2
          id="features-heading"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.55rem, 3vw, 2.1rem)',
            color: '#F0E4CC',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Three core capabilities in one platform
        </h2>
      </header>

      {/* 3-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1px',
          background: 'rgba(255,255,255,.07)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {FEATURES.map(({ num, icon, title, description, detail }) => (
          <div
            key={title}
            className="feat-col"
            style={{
              background: '#080808',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              transition: 'background .22s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = '#0D0D0D';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = '#080808';
            }}
          >
            {/* Top row: number + icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <span style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 800,
                fontSize: '.7rem',
                letterSpacing: '.12em',
                color: 'rgba(201,154,107,.45)',
              }}>
                {num}
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(201,154,107,.07)',
                border: '1px solid rgba(201,154,107,.14)',
                color: '#C99A6B',
              }}>
                {icon}
              </span>
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 700,
              fontSize: '1.05rem',
              color: '#F0E4CC',
              marginBottom: 12,
              lineHeight: 1.3,
            }}>
              {title}
            </h3>

            {/* Description */}
            <p style={{
              fontSize: '.82rem',
              color: 'rgba(255,255,255,.4)',
              lineHeight: 1.72,
              margin: '0 0 24px',
              flex: 1,
            }}>
              {description}
            </p>

            {/* Footer tag */}
            <div style={{
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,.06)',
              fontSize: '.68rem',
              color: 'rgba(201,154,107,.45)',
              letterSpacing: '.04em',
            }}>
              {detail}
            </div>
          </div>
        ))}
      </div>

    </div>
  </section>
);

export default FeatureGrid;
