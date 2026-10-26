import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';

// ─── Shared ──────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'ghost';

// ─── ButtonLink (renders as React Router <Link>) ──────────────────────────────
interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
}

export const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const cls =
    variant === 'primary'
      ? 'ld-btn ld-btn-primary'
      : 'ld-btn ld-btn-ghost';
  return (
    <Link className={`${cls} ${className}`} {...rest}>
      {children}
    </Link>
  );
};

// ─── ButtonAnchor (renders as <a>) ────────────────────────────────────────────
interface ButtonAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
}

export const ButtonAnchor: React.FC<ButtonAnchorProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const cls =
    variant === 'primary'
      ? 'ld-btn ld-btn-primary'
      : 'ld-btn ld-btn-ghost';
  return (
    <a className={`${cls} ${className}`} {...rest}>
      {children}
    </a>
  );
};

// ─── Button (native button element) ──────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const cls =
    variant === 'primary'
      ? 'ld-btn ld-btn-primary'
      : 'ld-btn ld-btn-ghost';
  return (
    <button className={`${cls} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export default Button;
