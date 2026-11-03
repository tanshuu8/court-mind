import React from 'react';


/* ── 3D CSS icon shapes ──────────────────────────────────────────────────── */

/** PDF-style document icon */
const PdfIcon: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      width: 48,
      height: 60,
      background: 'linear-gradient(145deg,#2A1C0F,#1A0E06)',
      border: '1.5px solid rgba(232,201,160,.28)',
      borderRadius: 6,
      transform: 'perspective(200px) rotateY(-18deg) rotateX(6deg)',
      boxShadow: '4px 6px 18px rgba(0,0,0,.45)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: 5,
      padding: '8px 10px',
      position: 'relative',
    }}
  >
    {/* Corner fold */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        background: 'rgba(232,201,160,.18)',
        clipPath: 'polygon(100% 0,100% 100%,0 0)',
      }}
    />
    {[85, 65, 75, 50].map((w, i) => (
      <div
        key={i}
        style={{
          height: 3,
          width: `${w}%`,
          background: i === 0
            ? 'linear-gradient(90deg,#C99A6B,#E8C9A0)'
            : 'rgba(232,201,160,.22)',
          borderRadius: 2,
        }}
      />
    ))}
  </div>
);

/** Semi-circle risk gauge icon */
const GaugeIcon: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      width: 56,
      height: 32,
      transform: 'perspective(200px) rotateY(16deg) rotateX(-8deg)',
      position: 'relative',
    }}
  >
    <svg viewBox="0 0 56 32" fill="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="gauge-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#8B5E2A" />
          <stop offset="60%"  stopColor="#C99A6B" />
          <stop offset="100%" stopColor="#E8C9A0" />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d="M4 30 A24 24 0 0 1 52 30" stroke="rgba(232,201,160,.15)" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Fill ~65% */}
      <path d="M4 30 A24 24 0 0 1 45 11" stroke="url(#gauge-arc)" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Needle */}
      <line x1="28" y1="30" x2="42" y2="13" stroke="#E8C9A0" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="28" cy="30" r="3" fill="#C99A6B"/>
    </svg>
  </div>
);

/** Chat / Q&A icon */
const ChatIcon: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      width: 52,
      height: 44,
      transform: 'perspective(200px) rotateY(-14deg) rotateX(4deg)',
      position: 'relative',
    }}
  >
    {/* Main bubble */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 44,
        height: 34,
        background: 'linear-gradient(135deg,rgba(201,154,107,.28),rgba(232,201,160,.1))',
        border: '1.5px solid rgba(232,201,160,.28)',
        borderRadius: '10px 10px 10px 2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: '0 8px',
        boxShadow: '3px 4px 14px rgba(0,0,0,.4)',
      }}
    >
      {[30, 22, 28].map((w, i) => (
        <div key={i} style={{ width: w, height: 3, background: 'rgba(232,201,160,.4)', borderRadius: 2 }} />
      ))}
    </div>
    {/* Reply bubble */}
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 20,
        background: 'rgba(201,154,107,.15)',
        border: '1px solid rgba(232,201,160,.2)',
        borderRadius: '8px 8px 2px 8px',
        boxShadow: '2px 3px 8px rgba(0,0,0,.3)',
      }}
    />
  </div>
);

/* ── Feature card types ──────────────────────────────────────────────────── */
interface FeatureCardProps {
  iconType: 'pdf' | 'gauge' | 'chat';
  title: string;
  description: string;
}

const ICONS: Record<FeatureCardProps['iconType'], React.ReactNode> = {
  pdf:   <PdfIcon   />,
  gauge: <GaugeIcon />,
  chat:  <ChatIcon  />,
};

/* ── FeatureCard ─────────────────────────────────────────────────────────── */
const FeatureCard: React.FC<FeatureCardProps> = ({ iconType, title, description }) => (
  <article
    className="ld-feature-card relative flex flex-col gap-4 rounded-2xl p-6"
    style={{
      background: '#0E0E0E',
      border: '1px solid rgba(255,255,255,.08)',
      minHeight: 260,
    }}
  >
    {/* 3D icon */}
    <div className="mb-1" style={{ height: 64, display: 'flex', alignItems: 'flex-end' }}>
      {ICONS[iconType]}
    </div>

    {/* Text */}
    <div className="flex-1 flex flex-col gap-3">
      <h3
        className="font-display font-semibold leading-snug"
        style={{ fontSize: '1.1rem', color: '#F4EBDD' }}
      >
        {title}
      </h3>
      <p
        className="leading-relaxed text-sm flex-1"
        style={{ color: '#C9BBA6', lineHeight: 1.7 }}
      >
        {description}
      </p>
    </div>



    {/* Top accent line (shows on hover via parent class) */}
    <div
      className="absolute top-0 left-6 right-6 h-px"
      aria-hidden="true"
      style={{
        background: 'linear-gradient(90deg,transparent,rgba(232,201,160,.35),transparent)',
        opacity: 0,
        transition: 'opacity .25s',
      }}
    />
  </article>
);

export default FeatureCard;
