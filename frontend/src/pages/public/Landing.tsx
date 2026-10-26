import React from 'react';
import PageBackground from '../../components/landing/PageBackground';
import Navbar         from '../../components/landing/Navbar';
import Hero           from '../../components/landing/Hero';
import FeatureGrid    from '../../components/landing/FeatureGrid';
import HowItWorks     from '../../components/landing/HowItWorks';
import DisclaimerNote from '../../components/landing/DisclaimerNote';
import CtaSection     from '../../components/landing/CtaSection';
import Footer         from '../../components/landing/Footer';

/**
 * Landing — public marketing page at route "/"
 *
 * All sections are imported from src/components/landing/.
 * The route is registered in App.tsx and requires no changes there.
 */
const Landing: React.FC = () => (
  <div
    id="landing-root"
    className="font-body antialiased relative"
    style={{
      minHeight: '100vh',
      background: '#0B0907',
      color: '#F4EBDD',
      overflowX: 'hidden',
    }}
  >
    {/* Decorative full-page 3D background (grids + glow) */}
    <PageBackground />

    {/* All real content sits above the background */}
    <div className="relative" style={{ zIndex: 1 }}>
      {/* ── Navigation ─────────────────────────────────────────── */}
      <Navbar />

      {/* ── Main content ────────────────────────────────────────── */}
      <main id="main-content">
        {/* 1. Hero */}
        <Hero />

        {/* Divider */}
        <div
          aria-hidden="true"
          className="mx-auto"
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(232,201,160,.12),transparent)',
          }}
        />

        {/* 2. Features */}
        <FeatureGrid />

        {/* Divider */}
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(232,201,160,.12),transparent)',
          }}
        />

        {/* 3. How It Works */}
        <HowItWorks />

        {/* 4. Disclaimer */}
        <DisclaimerNote />

        {/* Divider */}
        <div
          aria-hidden="true"
          style={{
            height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(232,201,160,.12),transparent)',
          }}
        />

        {/* 5. CTA */}
        <CtaSection />
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <Footer />
    </div>
  </div>
);

export default Landing;
