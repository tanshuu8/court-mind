import React from 'react';
import { ChevronRight, LogIn, FileText, MessageSquare, Clock } from 'lucide-react';
import { ButtonLink } from '../ui/Button';

/* ─── Product Preview Panel ──────────────────────────────────────────────── */
const TIMELINE_STEPS = [
  { label: 'Case Filed',     date: 'Jan 2024', done: true  },
  { label: 'First Hearing',  date: 'Mar 2024', done: true  },
  { label: 'Evidence Round', date: 'May 2024', done: true  },
  { label: 'Next Date',      date: 'Pending',  done: false },
] as const;

const ProductPreview: React.FC = () => (
  <div
    className="ld-preview"
    aria-label="CourtMind interface preview — illustrative only"
    style={{ width: '100%', maxWidth: 430 }}
  >
    {/* ── Window chrome ── */}
    <div className="ld-preview-header">
      <div className="ld-preview-dot" style={{ background: '#FF5F57' }} />
      <div className="ld-preview-dot" style={{ background: '#FEBC2E' }} />
      <div className="ld-preview-dot" style={{ background: '#28C840' }} />
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', color: 'rgba(255,255,255,.45)' }}>
        <FileText size={12} style={{ color: '#C99A6B' }} />
        court_order.pdf
        <span style={{ fontSize: '.58rem', background: 'rgba(201,154,107,.14)', color: '#C99A6B', padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(201,154,107,.18)', marginLeft: 3 }}>
          Analysed
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.18)', fontStyle: 'italic' }}>
        Illustrative only
      </span>
    </div>

    {/* ── Q & A ── */}
    <div className="ld-preview-qa">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <MessageSquare size={13} style={{ color: 'rgba(255,255,255,.28)', marginTop: 1, flexShrink: 0 }} />
        <p className="ld-preview-question" style={{ margin: 0 }}>
          "What happened in the last hearing?"
        </p>
      </div>
      <div style={{ paddingLeft: 21, borderLeft: '2px solid rgba(201,154,107,.22)' }}>
        <p className="ld-preview-answer" style={{ margin: '0 0 9px' }}>
          The last recorded hearing on{' '}
          <strong style={{ color: '#F0E4CC' }}>12 March 2024</strong>{' '}
          involved arguments on the admissibility of digital evidence.
          The judge deferred the ruling pending additional documents from both parties.
        </p>
        <div className="ld-preview-source">
          <FileText size={9} />
          Source: Para. 4, Page 3 — court_order.pdf
        </div>
      </div>
    </div>

    {/* ── Timeline ── */}
    <div className="ld-preview-timeline">
      <div className="ld-preview-tl-label">
        <Clock size={9} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
        Case Timeline
      </div>
      <div className="ld-preview-tl-row">
        {TIMELINE_STEPS.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="ld-preview-tl-step">
              <div
                className="ld-preview-tl-dot"
                style={{
                  background: step.done ? '#C99A6B' : 'rgba(255,255,255,.14)',
                  boxShadow: step.done ? '0 0 0 2px rgba(201,154,107,.2)' : 'none',
                }}
              />
              <div className="ld-preview-tl-name">{step.label}</div>
              <div className="ld-preview-tl-date">{step.date}</div>
            </div>
            {i < TIMELINE_STEPS.length - 1 && <div className="ld-preview-tl-line" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Hero ────────────────────────────────────────────────────────────────── */
const Hero: React.FC = () => (
  <section
    id="home"
    aria-labelledby="hero-heading"
    style={{
      width: '100%',
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Subtle background grid */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
        pointerEvents: 'none',
      }}
    />

    {/* Very faint warm glow — top-left only */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '-5%',
        left: '-5%',
        width: '45vw',
        height: '60vh',
        background: 'radial-gradient(ellipse at 25% 30%, rgba(201,154,107,.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }}
    />

    {/* ── Two-column grid ─────────────────────────────────────────────────── */}
    <div
      style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(28px, 5vw, 56px) clamp(20px, 4vw, 48px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(24px, 4vw, 52px)',
        alignItems: 'center',
      }}
    >
      {/* ── Left: Copy ────────────────────────────────────────────────────── */}
      <div className="ld-slide-up">
        {/* Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '.6rem',
            fontWeight: 700,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: '#C99A6B',
            marginBottom: '1.1rem',
            opacity: .8,
          }}
        >
          <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#C99A6B' }} />
          AI-Powered Legal Intelligence
        </div>

        {/* H1 */}
        <h1
          id="hero-heading"
          style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2.1rem, 3.8vw, 3.4rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            margin: '0 0 1.4rem',
            color: '#FFFFFF',
          }}
        >
          Understand Your Case.
          <br />
          <span style={{ color: 'rgba(255,255,255,.48)' }}>
            See the Bigger Picture.
          </span>
          <br />
          <span style={{ color: 'rgba(255,255,255,.72)' }}>
            Move Forward with Clarity.
          </span>
        </h1>




        {/* Paragraph */}
        <p
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(.875rem, 1.2vw, 1rem)',
            lineHeight: 1.72,
            color: 'rgba(255,255,255,.46)',
            maxWidth: 500,
            margin: '0 0 1.75rem',
          }}
        >
          CourtMind helps you understand legal documents, explore case timelines,
          and uncover important insights with AI-powered legal intelligence.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <ButtonLink to="/register" variant="primary">
            Explore CourtMind <ChevronRight size={15} />
          </ButtonLink>
          <ButtonLink to="/login" variant="ghost">
            <LogIn size={14} /> Sign In
          </ButtonLink>
        </div>
      </div>

      {/* ── Right: Preview ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ProductPreview />
      </div>
    </div>

    {/* Bottom fade */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 100,
        background: 'linear-gradient(to bottom, transparent, rgba(8,8,8,.6))',
        pointerEvents: 'none',
      }}
    />
  </section>
);

export default Hero;
