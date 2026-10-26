import React from 'react';
import FeatureCard from './FeatureCard';

const FEATURES = [
  {
    iconType: 'pdf' as const,
    title: 'AI-Powered Document Analysis',
    description:
      'Turn lengthy court documents into structured summaries, important dates, and key information that is easier to review.',
  },
  {
    iconType: 'gauge' as const,
    title: 'Explainable Delay-Risk Insights',
    description:
      'Explore potential case-delay indicators and the factors behind a prediction when a trained model and suitable data are available.',
  },
  {
    iconType: 'chat' as const,
    title: 'Case Timeline and Document Q&A',
    description:
      'Keep relevant case events organized and ask questions about available documents with source-grounded responses when the AI service is connected.',
  },
] as const;

const FeatureGrid: React.FC = () => (
  <section
    id="features"
    aria-labelledby="features-heading"
    className="relative"
    style={{ padding: '96px 32px' }}
  >
    <div className="mx-auto" style={{ maxWidth: '1120px' }}>
      {/* Section header */}
      <header className="text-center mb-14">
        <p className="ld-badge mb-4" style={{ display: 'inline-flex' }}>
          Powerful Features
        </p>
        <h2
          id="features-heading"
          className="font-display font-bold text-ltext"
          style={{ fontSize: 'clamp(1.75rem,3.5vw,2.4rem)', lineHeight: 1.2, marginBottom: '1rem' }}
        >
          Everything You Need for Smarter Case Management
        </h2>
        <p style={{ color: '#D3C7B3', maxWidth: 520, margin: '0 auto', lineHeight: 1.7, fontSize: '.95rem' }}>
          One workspace to analyse documents, explore delay-risk insights, and follow your case timeline.
        </p>
      </header>

      {/* Card grid — min 280 px per column */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </div>
  </section>
);

export default FeatureGrid;
