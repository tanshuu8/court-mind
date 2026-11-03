import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = 'October 2026';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div style={{ marginBottom: 36 }}>
    <h2
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '1rem',
        color: '#F0E4CC',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,.07)',
      }}
    >
      {title}
    </h2>
    <div
      style={{
        fontSize: '.875rem',
        color: 'rgba(255,255,255,.5)',
        lineHeight: 1.75,
      }}
    >
      {children}
    </div>
  </div>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ marginBottom: 12 }}>{children}</p>
);

const TermsPage: React.FC = () => (
  <div
    style={{
      width: '100%',
      minHeight: '100vh',
      background: '#080808',
      color: 'rgba(255,255,255,.82)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}
  >
    {/* Header */}
    <header
      style={{
        borderBottom: '1px solid rgba(255,255,255,.07)',
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(8,8,8,.96)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Link
        to="/landing"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontSize: '.8rem',
          color: 'rgba(255,255,255,.45)',
          textDecoration: 'none',
          transition: 'color .15s',
        }}
        aria-label="Back to CourtMind home"
      >
        <ArrowLeft size={15} />
        CourtMind
      </Link>
      <span style={{ color: 'rgba(255,255,255,.15)', fontSize: '.8rem' }}>/</span>
      <span style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>
        Terms of Service
      </span>
    </header>

    {/* Content */}
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '52px 32px 80px',
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.6rem, 3vw, 2rem)',
            color: '#F0E4CC',
            marginBottom: 8,
          }}
        >
          Terms of Service
        </h1>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.3)', margin: 0 }}>
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <Section title="1. Acceptance of Terms">
        <P>
          By accessing or using CourtMind, you agree to be bound by these Terms
          of Service. If you do not agree, please do not use the platform.
        </P>
        <P>
          CourtMind is an academic project and is provided on an as-is basis.
          These terms reflect the current state of the platform and will be
          updated as the service evolves.
        </P>
      </Section>

      <Section title="2. Description of Service">
        <P>
          CourtMind provides AI-assisted tools to help users understand court
          documents, explore case timelines, and review available case
          information. The platform is intended as an informational aid and
          is not a substitute for professional legal advice.
        </P>
        <P>
          Certain features, including AI document analysis, delay-risk
          insights, and document Q&amp;A, are dependent on AI services and ML
          models that may not be fully connected or available at all times.
        </P>
      </Section>

      <Section title="3. User Responsibilities">
        <P>When using CourtMind, you agree to:</P>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          {[
            'Provide accurate information when registering or using the service.',
            'Upload only documents that you have the legal right to share and process.',
            'Not use the platform to process documents belonging to others without authorisation.',
            'Not attempt to reverse-engineer, copy, or circumvent the platform\'s security.',
            'Not use AI-generated outputs as a substitute for qualified legal advice.',
            'Comply with applicable laws when using the service.',
          ].map(item => (
            <li key={item} style={{ marginBottom: 6 }}>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="4. AI-Generated Content Disclaimer">
        <P>
          All AI-generated content within CourtMind — including document
          summaries, delay-risk predictions, timeline entries, and Q&amp;A
          responses — is provided for informational reference only.
        </P>
        <P>
          CourtMind does not guarantee the accuracy, completeness, or legal
          validity of any AI-generated content. AI outputs may contain errors,
          omissions, or outdated information. Users must independently verify
          important information and consult a qualified, licensed lawyer before
          acting on any information provided by the platform.
        </P>
      </Section>

      <Section title="5. Accounts and Access">
        <P>
          You are responsible for maintaining the confidentiality of your
          account credentials. Notify the CourtMind team immediately if you
          suspect unauthorised access to your account.
        </P>
        <P>
          Lawyer accounts require verification. Providing false credentials
          during verification is a violation of these terms and may result in
          account suspension.
        </P>
      </Section>

      <Section title="6. Uploaded Documents">
        <P>
          Documents you upload remain your property. By uploading, you grant
          CourtMind a limited licence to process and analyse the content solely
          for the purpose of providing the service to you.
        </P>
        <P>
          Do not upload documents containing sensitive third-party personal
          data, confidential information subject to legal privilege, or content
          that you are not authorised to process digitally.
        </P>
      </Section>

      <Section title="7. Limitations of Liability">
        <P>
          CourtMind and its developers are not liable for any loss or damage
          arising from reliance on AI-generated content, platform downtime,
          data loss, or any decisions made based on information provided by
          the platform.
        </P>
        <P>
          The platform is provided without warranty of any kind, express or
          implied. Use it at your own risk.
        </P>
      </Section>

      <Section title="8. Intellectual Property">
        <P>
          The CourtMind platform, its design, and underlying code are the
          intellectual property of the development team. You may not reproduce,
          distribute, or create derivative works without explicit permission.
        </P>
      </Section>

      <Section title="9. Changes to These Terms">
        <P>
          These Terms of Service may be updated as the platform develops.
          Continued use of CourtMind after changes constitutes acceptance of
          the revised terms.
        </P>
      </Section>

      <div
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,.07)',
          fontSize: '.78rem',
          color: 'rgba(255,255,255,.22)',
        }}
      >
        <p style={{ marginBottom: 12 }}>
          For questions about these terms, use the{' '}
          <Link
            to="/landing#contact"
            style={{ color: '#C99A6B', textDecoration: 'none' }}
          >
            Contact section
          </Link>{' '}
          on the landing page.
        </p>
        <Link
          to="/landing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#C99A6B',
            textDecoration: 'none',
            fontSize: '.8rem',
          }}
        >
          <ArrowLeft size={13} />
          Back to CourtMind
        </Link>
      </div>
    </main>
  </div>
);

export default TermsPage;
