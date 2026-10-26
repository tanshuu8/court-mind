import React from 'react';
import { ChevronRight, ArrowRight, ShieldCheck, Brain, Clock } from 'lucide-react';
import { ButtonLink, ButtonAnchor } from '../ui/Button';
import HeroScene3D from './HeroScene3D';

const TRUST_ITEMS = [
  {
    icon: <Brain size={14} />,
    title: 'Smarter Analysis',
    sub: 'From complex documents',
  },
  {
    icon: <ShieldCheck size={14} />,
    title: 'Clear Insights',
    sub: 'With explainable AI',
  },
  {
    icon: <Clock size={14} />,
    title: 'Better Decisions',
    sub: 'For your legal journey',
  },
] as const;

const Hero: React.FC = () => (
  <section
    id="home"
    aria-labelledby="hero-heading"
    className="relative overflow-hidden"
    style={{ minHeight: 'calc(100vh - 4rem)' }}
  >
    <div
      className="mx-auto px-8 flex flex-col lg:flex-row items-center gap-14 py-20 lg:py-0"
      style={{ maxWidth: '1120px', minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* ── Left: Copy ─────────────────────────────────────────────────────── */}
      <div className="flex-1 ld-slide-up lg:py-20" style={{ maxWidth: 540 }}>
        {/* Eyebrow badge */}
        <div className="ld-badge mb-7">
          ✦ AI-Powered Legal Intelligence
        </div>

        {/* H1 */}
        <h1
          id="hero-heading"
          className="font-display font-bold text-ltext leading-[1.08] tracking-tight mb-6"
          style={{
            fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
            textShadow: '0 2px 16px rgba(0,0,0,.4)',
          }}
        >
          <span
            className="block"
            style={{
              textShadow:
                '0 1px 0 rgba(201,154,107,.5), 0 2px 0 rgba(201,154,107,.3), 0 4px 12px rgba(0,0,0,.5)',
            }}
          >
            Understand Your Case.
          </span>
          <span className="block mt-1" style={{ color: '#D3C7B3' }}>
            See the Bigger Picture.
          </span>
          {/* Highlighted pill */}
          <span className="block mt-2">
            <span
              className="inline-block px-4 py-1.5 rounded-xl font-bold"
              style={{
                background: '#F3E3C8',
                color: '#1B1612',
                fontSize: '0.9em',
                boxShadow: '0 4px 18px rgba(243,227,200,.22), 0 1px 4px rgba(0,0,0,.2)',
                transform: 'perspective(500px) rotateX(1.5deg)',
                display: 'inline-block',
              }}
            >
              Move Forward with Clarity.
            </span>
          </span>
        </h1>

        {/* Supporting paragraph */}
        <p
          className="text-ltext-muted leading-relaxed mb-8"
          style={{ fontSize: '1.05rem', maxWidth: 480 }}
        >
          CourtMind helps bring court-document analysis, case timelines, and explainable
          delay-risk insights together in one workspace so important case information is
          easier to understand and follow.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          <ButtonLink to="/register" variant="primary">
            Get Started <ChevronRight size={16} />
          </ButtonLink>
          <ButtonAnchor
            href="#features"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Features <ArrowRight size={16} />
          </ButtonAnchor>
        </div>

        {/* Trust items */}
        <div className="flex flex-wrap gap-5">
          {TRUST_ITEMS.map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(201,154,107,.14)', color: '#C99A6B' }}
              >
                {icon}
              </span>
              <div>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#D3C7B3', lineHeight: 1.2 }}>{title}</div>
                <div style={{ fontSize: '.7rem', color: 'rgba(201,187,166,.5)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: 3D Scene ────────────────────────────────────────────────── */}
      <div
        className="flex-1 hidden lg:flex items-center justify-center"
        style={{ minHeight: 580 }}
      >
        <HeroScene3D />
      </div>
    </div>

    {/* Bottom fade into next section */}
    <div
      className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
      aria-hidden="true"
      style={{ background: 'linear-gradient(to bottom, transparent, rgba(11,9,7,.8))' }}
    />
  </section>
);

export default Hero;
