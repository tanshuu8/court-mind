import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer
    role="contentinfo"
    style={{
      borderTop: '1px solid rgba(232,201,160,.1)',
      padding: '28px 32px',
    }}
  >
    <div
      className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
      style={{ maxWidth: '1120px' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs"
          style={{
            background: 'linear-gradient(135deg,#C99A6B,#E8C9A0)',
            color: '#1B1612',
          }}
          aria-hidden="true"
        >
          CM
        </span>
        <span
          className="font-display font-semibold"
          style={{ color: '#D3C7B3', fontSize: '.9rem' }}
        >
          CourtMind
        </span>
        <span style={{ color: 'rgba(211,199,179,.3)', fontSize: '.85rem' }}>
          · B.Tech Major Project
        </span>
      </div>

      {/* Links */}
      <nav aria-label="Footer navigation" className="flex items-center gap-5">
        {[
          { label: 'Privacy',  href: '/privacy'  },
          { label: 'Terms',    href: '/terms'    },
          { label: 'Sign In',  href: '/login'    },
        ].map(({ label, href }) => (
          <Link
            key={label}
            to={href}
            style={{
              fontSize: '.8rem',
              color: 'rgba(211,199,179,.4)',
              textDecoration: 'none',
              transition: 'color .15s',
            }}
            className="hover:text-bronze focus-visible:outline-2 focus-visible:outline-bronze rounded"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Copyright */}
      <p style={{ fontSize: '.75rem', color: 'rgba(211,199,179,.25)' }}>
        © {new Date().getFullYear()} CourtMind
      </p>
    </div>
  </footer>
);

export default Footer;
