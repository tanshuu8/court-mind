import React from 'react';
import PageBackground from '../../components/landing/PageBackground';
import Navbar         from '../../components/landing/Navbar';
import Hero           from '../../components/landing/Hero';
import FeatureGrid    from '../../components/landing/FeatureGrid';
import HowItWorks     from '../../components/landing/HowItWorks';
import ForWhoSection  from '../../components/landing/ForWhoSection';
import DisclaimerNote from '../../components/landing/DisclaimerNote';
import CtaSection     from '../../components/landing/CtaSection';
import Footer         from '../../components/landing/Footer';

const HR = () => (
  <div
    aria-hidden="true"
    style={{
      width: '100%',
      height: 1,
      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.07) 25%, rgba(255,255,255,.07) 75%, transparent 100%)',
    }}
  />
);

const Landing: React.FC = () => (
  <div
    id="landing-root"
    style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: '#080808',
      color: '#FFFFFF',
      overflowX: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
    }}
  >
    <PageBackground />

    <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
      <Navbar />

      <main id="main-content" style={{ width: '100%' }}>

        {/* 1. Hero */}
        <Hero />
        <HR />

        {/* 2. Features */}
        <FeatureGrid />
        <HR />

        {/* 3. How It Works — horizontal flow */}
        <HowItWorks />
        <HR />

        {/* 4. For Citizens & Lawyers — extra top breathing room */}
        <div style={{ paddingTop: 20 }} aria-hidden="true" />
        <ForWhoSection />
        <HR />

        {/* 5. Disclaimer */}
        <DisclaimerNote />
        <HR />

        {/* 6. Contact */}
        <CtaSection />

      </main>

      <Footer />
    </div>
  </div>
);

export default Landing;
