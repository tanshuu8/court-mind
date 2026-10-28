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

const PrivacyPage: React.FC = () => (
  <div
    style={{
      width: '100%',
      minHeight: '100vh',
      background: '#080808',
      color: 'rgba(255,255,255,.82)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}
  >
    {/* Header bar */}
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
      <span style={{ color: 'rgba(255,255,255,.15)', fontSize: '.8rem' }}>
        /
      </span>
      <span style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>
        Privacy Policy
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.3)', margin: 0 }}>
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <Section title="1. Overview">
        <P>
          CourtMind is an AI-powered platform designed to help users understand
          court documents, explore case timelines, and review delay-risk
          insights. This Privacy Policy explains how information is collected,
          used, and handled when you use CourtMind.
        </P>
        <P>
          CourtMind is an academic project and may not yet have all production
          infrastructure in place. Please review this policy carefully and
          contact the development team if you have questions.
        </P>
      </Section>

      <Section title="2. Information We Collect">
        <P>
          <strong style={{ color: '#F0E4CC' }}>Account information:</strong>{' '}
          When you register, we collect your name, email address, and password
          (stored as a secure hash). Lawyers additionally provide professional
          details for verification.
        </P>
        <P>
          <strong style={{ color: '#F0E4CC' }}>Documents you upload:</strong>{' '}
          Court documents and case files uploaded through the platform are
          stored to enable AI analysis. Only files you explicitly upload are
          processed.
        </P>
        <P>
          <strong style={{ color: '#F0E4CC' }}>Usage data:</strong> Basic
          interaction data (pages visited, features used) may be collected to
          improve the service. This is not sold or shared with advertising
          networks.
        </P>
      </Section>

      <Section title="3. How We Use Your Information">
        <P>
          Your information is used solely to operate and improve CourtMind:
        </P>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          {[
            'Authenticate your account and maintain session security.',
            'Process and analyse uploaded documents using AI services.',
            'Display case timelines and generate delay-risk insights.',
            'Enable lawyer-user consultation features.',
            'Improve AI model accuracy and service reliability.',
          ].map(item => (
            <li key={item} style={{ marginBottom: 6 }}>
              {item}
            </li>
          ))}
        </ul>
        <P>
          We do not sell, rent, or share your personal data or documents with
          third parties for marketing or commercial purposes.
        </P>
      </Section>

      <Section title="4. Document Handling">
        <P>
          Documents uploaded to CourtMind are processed by AI services to
          generate summaries, extract dates, and produce insights. Documents
          are associated with your account and are not shared with other users.
        </P>
        <P>
          The AI-generated analysis is for informational reference only. It
          does not constitute legal advice and may not be accurate or complete.
          Always verify important information with a qualified lawyer.
        </P>
      </Section>

      <Section title="5. Data Security">
        <P>
          CourtMind implements standard security practices including password
          hashing, HTTPS communication, and access controls. However, no
          system is completely secure, and we cannot guarantee the absolute
          security of your data.
        </P>
        <P>
          As an academic project, some production-level security controls may
          not yet be fully implemented. Exercise caution about the sensitivity
          of documents you upload during this phase.
        </P>
      </Section>

      <Section title="6. Data Retention">
        <P>
          Account data and uploaded documents are retained as long as your
          account remains active. We do not currently have an automated
          deletion process in place. You may contact the development team to
          request removal of your data.
        </P>
      </Section>

      <Section title="7. AI-Generated Information">
        <P>
          All AI-generated summaries, insights, and responses within CourtMind
          are for informational purposes only and are not a substitute for
          professional legal advice. CourtMind makes no representations about
          the accuracy, completeness, or legal validity of AI-generated content.
        </P>
        <P>
          Always consult a qualified and licensed lawyer before making decisions
          based on information from this platform.
        </P>
      </Section>

      <Section title="8. Your Rights">
        <P>
          You have the right to access the information stored about your
          account, correct inaccuracies, and request deletion of your data. To
          exercise these rights, contact the CourtMind development team through
          the Contact section of the platform.
        </P>
      </Section>

      <Section title="9. Changes to This Policy">
        <P>
          This policy may be updated as the platform evolves. Significant
          changes will be communicated through the application. Continued use
          of CourtMind after changes constitutes acceptance of the updated
          policy.
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
          This Privacy Policy applies to the CourtMind application. For
          questions, use the{' '}
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

export default PrivacyPage;
