import React from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Scales of Justice SVG
   The <g className="ld-beam"> group rocks around the pivot point.
───────────────────────────────────────────────────────────────────────────── */
const ScalesSVG: React.FC = () => (
  <svg
    viewBox="0 0 220 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ width: 220, height: 300 }}
  >
    <defs>
      <linearGradient id="sc-bronze" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#6B4826" />
        <stop offset="35%"  stopColor="#C99A6B" />
        <stop offset="65%"  stopColor="#E8C9A0" />
        <stop offset="100%" stopColor="#7A5230" />
      </linearGradient>
      <linearGradient id="sc-bronze-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#E8C9A0" />
        <stop offset="100%" stopColor="#8B6030" />
      </linearGradient>
      <linearGradient id="sc-pan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#C99A6B" />
        <stop offset="100%" stopColor="#5C3A18" />
      </linearGradient>
      <radialGradient id="sc-base" cx="50%" cy="30%" r="60%">
        <stop offset="0%"   stopColor="#3A2410" />
        <stop offset="100%" stopColor="#1A0E06" />
      </radialGradient>
      <filter id="sc-glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* ── Base ─────────────────────────────────────────────────────────── */}
    <ellipse cx="110" cy="282" rx="54" ry="10" fill="url(#sc-base)" />
    <rect x="82" y="268" width="56" height="18" rx="4" fill="url(#sc-bronze-v)" />

    {/* ── Central post ─────────────────────────────────────────────────── */}
    <rect x="107" y="52" width="6" height="220" rx="3" fill="url(#sc-bronze)" />

    {/* ── Top finial ───────────────────────────────────────────────────── */}
    <circle cx="110" cy="46" r="10" fill="url(#sc-bronze)" filter="url(#sc-glow)" />
    <circle cx="110" cy="46" r="5"  fill="#E8C9A0" />

    {/* ── Beam group — rocks around pivot (110, 95) ─────────────────────── */}
    <g
      className="ld-beam"
      style={{ transformOrigin: '110px 95px' }}
    >
      {/* Cross beam */}
      <rect x="18" y="92" width="184" height="6" rx="3" fill="url(#sc-bronze)" />

      {/* Left fulcrum connection */}
      <circle cx="38"  cy="95" r="5" fill="#E8C9A0" />
      {/* Right fulcrum connection */}
      <circle cx="182" cy="95" r="5" fill="#E8C9A0" />

      {/* ── Left chain (dashed, 3 segments) ────────────────────────────── */}
      <line x1="38"  y1="100" x2="34"  y2="130" stroke="#C99A6B" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="34"  y1="130" x2="30"  y2="160" stroke="#C99A6B" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="30"  y1="160" x2="28"  y2="190" stroke="#C99A6B" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* ── Right chain ────────────────────────────────────────────────── */}
      <line x1="182" y1="100" x2="186" y2="130" stroke="#C99A6B" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="186" y1="130" x2="190" y2="160" stroke="#C99A6B" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="190" y1="160" x2="192" y2="190" stroke="#C99A6B" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* ── Left pan ────────────────────────────────────────────────────── */}
      <path d="M6 197 Q28 207 50 197" stroke="#C99A6B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="28"  cy="194" rx="26" ry="6" fill="url(#sc-pan)" />
      <path d="M4 194 Q28 204 52 194" fill="none" stroke="rgba(232,201,160,.3)" strokeWidth="1" />

      {/* ── Right pan ───────────────────────────────────────────────────── */}
      <path d="M170 197 Q192 207 214 197" stroke="#C99A6B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="192" cy="194" rx="26" ry="6" fill="url(#sc-pan)" />
      <path d="M168 194 Q192 204 216 194" fill="none" stroke="rgba(232,201,160,.3)" strokeWidth="1" />
    </g>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Podium — 7 stacked oval discs (visual illusion; real 3D via rig sway)
───────────────────────────────────────────────────────────────────────────── */
const DISC_SIZES = [90, 110, 136, 162, 190, 218, 248] as const; // top → bottom

const Podium: React.FC = () => (
  <div
    className="flex flex-col items-center"
    style={{ marginTop: 'auto' }}
    aria-hidden="true"
  >
    {DISC_SIZES.map((w, i) => {
      const isTop = i === 0;
      return (
        <div
          key={i}
          style={{
            width: w,
            height: 17,
            borderRadius: '50%',
            marginTop: i === 0 ? 0 : -4,
            zIndex: 10 - i,
            position: 'relative',
            background: `radial-gradient(ellipse at 40% 35%, #2E1E10 0%, #110A04 100%)`,
            border: isTop ? '2.5px solid #E8C9A0' : '1px solid rgba(232,201,160,.18)',
            boxShadow: isTop
              ? '0 0 14px rgba(232,201,160,.25), 0 2px 8px rgba(0,0,0,.6)'
              : '0 2px 6px rgba(0,0,0,.5)',
          }}
        />
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Court Document Card (left side)
───────────────────────────────────────────────────────────────────────────── */
const CHECKLIST = [
  'Case Summary',
  'Key Entities',
  'Important Dates',
  'Legal Issues',
  'References',
] as const;

const DocCard: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      left: '2%',
      top: '10%',
      width: 200,
      transform: 'rotateY(24deg) rotateZ(-2deg) translateZ(30px)',
      background: '#FBF5E9',
      borderRadius: 10,
      padding: '14px 16px',
      boxShadow: '0 24px 56px rgba(0,0,0,.55), 0 4px 12px rgba(0,0,0,.35)',
    }}
  >
    {/* PDF badge */}
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: '#C99A6B',
        color: '#1B1612',
        fontSize: 9,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 4,
        marginBottom: 10,
        letterSpacing: '.07em',
      }}
    >
      <span style={{ fontSize: 10 }}>📄</span> COURT DOCUMENT
    </div>

    {/* Title bar */}
    <div
      style={{
        height: 6,
        background: 'linear-gradient(90deg,#C99A6B,#E8C9A0)',
        borderRadius: 3,
        marginBottom: 10,
        width: '75%',
      }}
    />

    {/* Checklist */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {CHECKLIST.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: 'linear-gradient(135deg,#C99A6B,#8B5E2A)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 5, height: 3, borderLeft: '1.5px solid #FBF5E9', borderBottom: '1.5px solid #FBF5E9', transform: 'rotate(-45deg) translateY(-1px)' }} />
          </div>
          <span style={{ fontSize: 9.5, color: '#3A2814', fontWeight: 500 }}>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Delay Risk Panel (right side)
───────────────────────────────────────────────────────────────────────────── */
const RISK_BARS = [
  { label: 'Case Complexity',  pct: 78 },
  { label: 'Hearing Delays',   pct: 61 },
  { label: 'Document Gaps',    pct: 44 },
  { label: 'Legal Precedents', pct: 33 },
  { label: 'Jurisdiction',     pct: 25 },
] as const;

const RiskPanel: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      right: '1%',
      top: '6%',
      width: 210,
      transform: 'rotateY(-22deg) translateZ(-20px)',
      background: 'rgba(12,8,5,.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(232,201,160,.18)',
      borderRadius: 12,
      padding: '14px 15px',
      boxShadow: '0 24px 56px rgba(0,0,0,.65), 0 4px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(232,201,160,.08)',
    }}
  >
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'linear-gradient(135deg,#C99A6B,#E8C9A0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#1B1612' }} />
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#E8C9A0', letterSpacing: '.06em', textTransform: 'uppercase' }}>Delay Risk Analysis</div>
        <div style={{ fontSize: 7.5, color: 'rgba(211,199,179,.45)', marginTop: 1 }}>Illustrative preview only</div>
      </div>
    </div>

    {/* Conic-gradient donut — purely decorative */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'conic-gradient(#C99A6B 0%, #E8C9A0 55%, rgba(232,201,160,.12) 55%)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(201,154,107,.22)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(12,8,5,.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: '#E8C9A0', lineHeight: 1 }}>Med</span>
          <span style={{ fontSize: 7, color: 'rgba(211,199,179,.5)', marginTop: 1 }}>Risk Level</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(244,235,221,.7)', lineHeight: 1.4 }}>
          Moderate<br />delay likelihood
        </div>
        <div style={{ fontSize: 7.5, color: 'rgba(211,199,179,.35)', marginTop: 3 }}>when model available</div>
      </div>
    </div>

    {/* 5-bar mini chart */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
      {RISK_BARS.map((b) => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 7.5, color: 'rgba(211,199,179,.5)', width: 80, flexShrink: 0 }}>{b.label}</span>
          <div style={{ flex: 1, height: 4, background: 'rgba(232,201,160,.08)', borderRadius: 2 }}>
            <div
              style={{
                width: `${b.pct}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#8B5E2A,#E8C9A0)',
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Key risk factors list */}
    <div style={{ borderTop: '1px solid rgba(232,201,160,.1)', paddingTop: 8 }}>
      <div style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(232,201,160,.45)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>
        Key Risk Factors
      </div>
      {RISK_BARS.slice(0, 4).map((b) => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C99A6B', flexShrink: 0 }} />
          <span style={{ fontSize: 7.5, color: 'rgba(211,199,179,.6)' }}>{b.label}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   HeroScene3D — main export
───────────────────────────────────────────────────────────────────────────── */
const HeroScene3D: React.FC = () => (
  <div
    className="ld-scene"
    aria-hidden="true"
    style={{
      position: 'relative',
      width: '100%',
      height: 580,
      userSelect: 'none',
      pointerEvents: 'none',
    }}
  >
    <div
      className="ld-rig"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 16,
      }}
    >
      {/* Document card — left */}
      <DocCard />

      {/* Risk panel — right */}
      <RiskPanel />

      {/* Scales — floats above podium */}
      <div
        className="ld-scale-float"
        style={{
          position: 'absolute',
          bottom: 138,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          filter: 'drop-shadow(0 8px 24px rgba(201,154,107,.3))',
        }}
      >
        <ScalesSVG />
      </div>

      {/* Podium discs */}
      <div style={{ position: 'relative', zIndex: 4, flexShrink: 0 }}>
        <Podium />
      </div>

      {/* Ground reflection blur */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 260,
          height: 24,
          background: 'radial-gradient(ellipse, rgba(201,154,107,.18) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 3,
        }}
      />
    </div>
  </div>
);

export default HeroScene3D;
