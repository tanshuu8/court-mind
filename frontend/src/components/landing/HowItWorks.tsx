import React from 'react';

interface Step {
  num: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

/* ─── Inline SVG micro-icons ─────────────────────────────────────────────── */
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const AnalysisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);
const RiskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const TimelineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Upload Documents',
    description: 'Add a court document or select available case records to begin your AI-powered analysis.',
    icon: <UploadIcon />,
  },
  {
    num: '02',
    title: 'Review AI Analysis',
    description: 'Explore structured summaries, extracted key dates, and source-referenced insights from your document.',
    icon: <AnalysisIcon />,
  },
  {
    num: '03',
    title: 'Understand Delay Risk',
    description: 'Review delay-risk indicators and explanations when the trained ML model and required data are available.',
    icon: <RiskIcon />,
  },
  {
    num: '04',
    title: 'Explore the Timeline',
    description: 'Follow recorded case events chronologically and ask questions about available documents.',
    icon: <TimelineIcon />,
  },
];

const HowItWorks: React.FC = () => (
  <section
    id="about"
    aria-labelledby="hiw-heading"
    style={{ padding: '72px 32px' }}
  >
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="ld-badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
          How It Works
        </p>
        <h2
          id="hiw-heading"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.55rem, 3vw, 2.1rem)',
            color: '#F0E4CC',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          From document to insight in four steps
        </h2>
        <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.35)', maxWidth: 440, margin: '0 auto' }}>
          A clear, structured workflow that turns raw legal documents into
          understandable information.
        </p>
      </header>

      {/* ── Desktop: horizontal flow ── */}
      <div className="hiw-desktop" style={{ position: 'relative' }}>

        {/* Progress track line */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 36,
            left: '12.5%',
            right: '12.5%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(201,154,107,.3) 15%, rgba(201,154,107,.3) 85%, transparent)',
          }}
        />

        {/* Steps row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="hiw-step"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 20px',
                cursor: 'default',
              }}
            >
              {/* Node — circle on the track */}
              <div
                className="hiw-node"
                style={{
                  position: 'relative',
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(201,154,107,.45)',
                  background: '#080808',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 28,
                  transition: 'border-color .25s, box-shadow .25s',
                  boxShadow: '0 0 0 0 rgba(201,154,107,0)',
                  zIndex: 1,
                }}
              >
                {/* Step number */}
                <span
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 800,
                    fontSize: '.65rem',
                    letterSpacing: '.12em',
                    color: '#D9A66E',
                    lineHeight: 1,
                    marginBottom: 5,
                  }}
                >
                  {step.num}
                </span>
                {/* Icon */}
                <span style={{ color: 'rgba(201,154,107,.65)', display: 'flex' }}>
                  {step.icon}
                </span>

                {/* Active dot — bottom of circle touching the line */}
                {i < STEPS.length && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: i === 0 ? '#C99A6B' : 'rgba(201,154,107,.3)',
                      border: '1.5px solid rgba(201,154,107,.5)',
                    }}
                  />
                )}
              </div>

              {/* Content below node */}
              <h3
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: '.95rem',
                  color: '#F0E4CC',
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: '.78rem',
                  color: 'rgba(255,255,255,.38)',
                  lineHeight: 1.68,
                  margin: 0,
                  maxWidth: 200,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: vertical timeline ── */}
      <div className="hiw-mobile" style={{ display: 'none', position: 'relative' }}>
        {/* Left vertical line */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 35,
            top: 36,
            bottom: 36,
            width: 1,
            background: 'linear-gradient(to bottom, transparent, rgba(201,154,107,.25) 10%, rgba(201,154,107,.25) 90%, transparent)',
          }}
        />

        {STEPS.map((step) => (
          <div
            key={step.num}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 20,
              marginBottom: 36,
              paddingLeft: 4,
            }}
          >
            {/* Node */}
            <div
              style={{
                flexShrink: 0,
                width: 62,
                height: 62,
                borderRadius: '50%',
                border: '1.5px solid rgba(201,154,107,.4)',
                background: '#080808',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <span style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: '.6rem', letterSpacing: '.1em', color: '#D9A66E', marginBottom: 4 }}>
                {step.num}
              </span>
              <span style={{ color: 'rgba(201,154,107,.65)', display: 'flex' }}>
                {step.icon}
              </span>
            </div>

            {/* Content */}
            <div style={{ paddingTop: 8 }}>
              <h3 style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '.92rem', color: '#F0E4CC', marginBottom: 6, lineHeight: 1.3 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.38)', lineHeight: 1.65, margin: 0 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>

    {/* Hover and responsive styles */}
    <style>{`
      .hiw-step:hover .hiw-node {
        border-color: rgba(201,154,107,.75) !important;
        box-shadow: 0 0 0 6px rgba(201,154,107,.07) !important;
      }
      @media (max-width: 720px) {
        .hiw-desktop { display: none !important; }
        .hiw-mobile  { display: block !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .hiw-node { transition: none !important; }
      }
    `}</style>
  </section>
);

export default HowItWorks;
