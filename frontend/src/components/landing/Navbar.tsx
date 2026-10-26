import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { ButtonLink } from '../ui/Button';

interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home',     href: '#home',     active: true },
  { label: 'Features', href: '#features' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
];

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMenuOpen(false);
    }
  };

  return (
    <header className="ld-nav" role="banner">
      <div
        className="mx-auto flex items-center gap-6 px-8 h-16"
        style={{ maxWidth: '1120px' }}
      >
        {/* Logo mark */}
        <Link
          to="/landing"
          className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze rounded-lg"
          aria-label="CourtMind home"
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg,#C99A6B,#E8C9A0)',
              color: '#1B1612',
            }}
          >
            CM
          </span>
          <span className="font-display font-semibold text-ltext" style={{ fontSize: '1.05rem', letterSpacing: '-.01em' }}>
            CourtMind
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav
          className="hidden md:flex items-center gap-1 ml-8"
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map(({ label, href, active }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => handleAnchor(e, href)}
              className={`ld-nav-link${active ? ' active' : ''}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Auth buttons — desktop */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link
            to="/login"
            className="ld-nav-link"
            style={{ color: 'rgba(244,235,221,.75)' }}
          >
            Sign In
          </Link>
          <ButtonLink to="/register" variant="primary">
            Create Account
          </ButtonLink>
        </div>

        {/* Hamburger — mobile */}
        <button
          type="button"
          className="md:hidden ml-auto p-2 rounded-lg text-ltext-muted hover:text-ltext focus-visible:outline-2 focus-visible:outline-bronze"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-8 pb-5 pt-3 flex flex-col gap-1"
          style={{ borderColor: 'rgba(232,201,160,.1)', background: 'rgba(11,9,7,.97)' }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => handleAnchor(e, href)}
              className="ld-nav-link py-2.5"
            >
              {label}
            </a>
          ))}
          <hr className="my-2" style={{ borderColor: 'rgba(232,201,160,.1)' }} />
          <Link
            to="/login"
            className="ld-nav-link py-2.5"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
          <ButtonLink
            to="/register"
            variant="primary"
            className="mt-1 self-start"
            onClick={() => setMenuOpen(false)}
          >
            Create Account
          </ButtonLink>
        </div>
      )}
    </header>
  );
};

export default Navbar;
