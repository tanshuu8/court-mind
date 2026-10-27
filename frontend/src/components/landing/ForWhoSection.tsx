import React from 'react';
import { ButtonLink } from '../ui/Button';

const CITIZEN_POINTS = [
  'Upload court documents and get structured plain-language summaries.',
  'Follow your case timeline and see key events in order.',
  'Understand possible delay factors when AI insights are available.',
  'Ask questions about your documents and get source-referenced answers.',
];

const LAWYER_POINTS = [
  'Review uploaded client documents quickly with AI-generated summaries.',
  'Accept consultation requests from citizens on the platform.',
  'View case timelines to support client advising and preparation.',
  'Professional verification badge displayed on your profile.',
];

interface PanelProps {
  badge: string;
  heading: string;
  description: string;
  points: string[];
  cta: string;
  ctaTo: string;
  accent?: boolean;
}

const Panel: React.FC<PanelProps> = ({ badge, heading, description, points, cta, ctaTo, accent }) => (
  <div
    style={{
      flex: 1,
      padding: 'clamp(28px, 4vw, 40px)',
      borderRadius: 16,
      border: accent
        ? '1px solid rgba(201,154,107,.3)'
        : '1px solid rgba(255,255,255,.08)',
      background: accent
        ? 'rgba(201,154,107,.045)'
        : 'rgba(255,255,255,.02)',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <span
      style={{
        display: 'inline-block',
        fontSize: '.62rem',
        fontWeight: 700,
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: accent ? '#D9A66E' : 'rgba(255,255,255,.35)',
        marginBottom: 14,
      }}
    >
      {badge}
    </span>
    <h3
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
        color: '#F0E4CC',
        marginBottom: 10,
        lineHeight: 1.2,
      }}
    >
      {heading}
    </h3>
    <p
      style={{
        fontSize: '.85rem',
        color: 'rgba(255,255,255,.4)',
        lineHeight: 1.68,
        marginBottom: 24,
      }}
    >
      {description}
    </p>

    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: '0 0 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {points.map(point => (
        <li
          key={point}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: '.82rem',
            color: 'rgba(255,255,255,.52)',
            lineHeight: 1.6,
          }}
        >
          <span
            style={{
              flexShrink: 0,
              marginTop: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: accent ? '#C99A6B' : 'rgba(255,255,255,.22)',
            }}
          />
          {point}
        </li>
      ))}
    </ul>

    <div style={{ marginTop: 'auto' }}>
      <ButtonLink to={ctaTo} variant={accent ? 'primary' : 'ghost'}>
        {cta}
      </ButtonLink>
    </div>
  </div>
);

const ForWhoSection: React.FC = () => (
  <section
    aria-labelledby="forwho-heading"
    style={{ padding: '72px 32px' }}
  >
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: 72 }}>
        <p className="ld-badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
          Built For You
        </p>
        <h2
          id="forwho-heading"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.55rem, 3vw, 2.1rem)',
            color: '#F0E4CC',
            marginBottom: 14,
            lineHeight: 1.2,
          }}
        >
          Designed for Citizens and Legal Professionals
        </h2>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 'clamp(16px, 3vw, 28px)',
          flexWrap: 'wrap',
        }}
      >
        <Panel
          badge="For Citizens"
          heading="Understand Your Legal Documents"
          description="Navigate court documents and case information with AI assistance — no legal background required."
          points={CITIZEN_POINTS}
          cta="Create Account"
          ctaTo="/register"
          accent
        />
        <Panel
          badge="For Lawyers"
          heading="Assist Clients More Efficiently"
          description="Use CourtMind's tools alongside your professional practice to review documents and support client consultations."
          points={LAWYER_POINTS}
          cta="Join as a Lawyer"
          ctaTo="/register"
        />
      </div>
    </div>
  </section>
);

export default ForWhoSection;
