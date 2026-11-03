import React from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',     href: '#home'     },
  { label: 'Features', href: '#features' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy',    to: '/privacy' },
  { label: 'Terms of Service',  to: '/terms'   },
];

const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (href.startsWith('#')) {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  }
};

const linkStyle: React.CSSProperties = {
  fontSize: '.78rem',
  color: 'rgba(255,255,255,.35)',
  textDecoration: 'none',
  transition: 'color .15s',
};

const Footer: React.FC = () => (
  <footer
    role="contentinfo"
    style={{
      borderTop: '1px solid rgba(255,255,255,.07)',
      background: '#050505',
      padding: '40px 32px 28px',
    }}
  >
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>

      {/* Top row — brand + nav + legal */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr',
          gap: 'clamp(24px, 4vw, 48px)',
          marginBottom: 32,
          alignItems: 'start',
        }}
      >
        {/* Brand + description */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(135deg,#C99A6B,#E8C9A0)',
                color: '#1B1612',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: '.7rem',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              CM
            </span>
            <span
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 700,
                fontSize: '.95rem',
                color: 'rgba(255,255,255,.7)',
              }}
            >
              CourtMind
            </span>
          </div>
          <p
            style={{
              fontSize: '.78rem',
              color: 'rgba(255,255,255,.28)',
              lineHeight: 1.65,
              maxWidth: 280,
              margin: 0,
            }}
          >
            AI-powered legal intelligence — helping you understand court
            documents, explore case timelines, and follow case progress.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <p
            style={{
              fontSize: '.62rem',
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.22)',
              marginBottom: 12,
            }}
          >
            Navigation
          </p>
          <nav
            aria-label="Footer site navigation"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={e => scrollTo(e, href)}
                style={linkStyle}
                className="hover:text-bronze"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Legal */}
        <div>
          <p
            style={{
              fontSize: '.62rem',
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.22)',
              marginBottom: 12,
            }}
          >
            Legal
          </p>
          <nav
            aria-label="Footer legal links"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {LEGAL_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                style={linkStyle}
                className="hover:text-bronze"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom row — disclaimer + copyright */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,.05)',
          paddingTop: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            fontSize: '.68rem',
            color: 'rgba(255,255,255,.18)',
            maxWidth: 560,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          CourtMind provides AI-generated information for reference purposes only.
          It is not legal advice. Always consult a qualified lawyer for matters
          relating to your case.
        </p>
        <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.2)', margin: 0 }}>
          © {new Date().getFullYear()} CourtMind. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
