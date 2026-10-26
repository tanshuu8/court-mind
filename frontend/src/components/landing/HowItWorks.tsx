import React from 'react';

interface Step {
  number: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: '1',
    title: 'Upload Document',
    description: 'Add your court document. PDF only, securely processed.',
  },
  {
    number: '2',
    title: 'Review Analysis',
    description: 'Get a structured summary, important dates, and key details.',
  },
  {
    number: '3',
    title: 'Explore Risk Insights',
    description: 'Understand delay factors and predictions when a model is available.',
  },
  {
    number: '4',
    title: 'Follow the Timeline',
    description: 'Track case progress and ask questions about available documents.',
  },
];

/* Dashed connector line between steps — horizontal on desktop, hidden on mobile */
const Connector: React.FC = () => (
  <div
    aria-hidden="true"
    className="hidden lg:block"
    style={{
      flex: 1,
      height: 0,
      borderTop: '1.5px dashed rgba(201,154,107,.3)',
      marginTop: '38px',   /* vertically centred with the 76-px circles */
      minWidth: 24,
      maxWidth: 64,
    }}
  />
);

const HowItWorks: React.FC = () => (
  <section
    id="about"
    aria-labelledby="hiw-heading"
    className="relative"
    style={{ padding: '96px 32px' }}
  >
    <div className="mx-auto" style={{ maxWidth: '1120px' }}>
      {/* Section header */}
      <header className="text-center mb-16">
        <p className="ld-badge mb-4" style={{ display: 'inline-flex' }}>
          Simple Process
        </p>
        <h2
          id="hiw-heading"
          className="font-display font-bold text-ltext"
          style={{ fontSize: 'clamp(1.75rem,3.5vw,2.4rem)', lineHeight: 1.2 }}
        >
          How It Works
        </h2>
      </header>

      {/* Steps row */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-0">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.number}>
            {/* Step */}
            <div
              className="ld-step flex flex-col items-center text-center"
              style={{ maxWidth: 220, flex: '0 0 auto' }}
            >
              {/* Circle number */}
              <div
                className="ld-step-circle font-display font-bold mb-5 flex items-center justify-center"
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  border: '1.5px solid #C99A6B',
                  background: '#0B0907',  /* solid page-bg so dashed line doesn't show through */
                  color: '#E8C9A0',
                  fontSize: '1.5rem',
                  letterSpacing: '-.02em',
                  boxShadow: '0 0 0 0 rgba(201,154,107,0)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {step.number}
              </div>

              <h3
                className="font-display font-semibold mb-2"
                style={{ fontSize: '1rem', color: '#F4EBDD' }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: '.85rem',
                  color: '#C9BBA6',
                  lineHeight: 1.65,
                }}
              >
                {step.description}
              </p>
            </div>

            {/* Connector after every step except the last */}
            {i < STEPS.length - 1 && <Connector />}
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
