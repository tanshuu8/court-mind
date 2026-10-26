import React from 'react';
import { classNames } from '../../utils/helpers';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', isLoading = false,
  leftIcon, rightIcon, children, className, disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]';
  const variants = {
    primary:   'bg-black text-white hover:bg-gray-900 shadow-sm',
    secondary: 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300',
    ghost:     'text-gray-600 hover:bg-black/5 hover:text-black',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    outline:   'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
  };
  const sizes = { sm: 'text-xs px-3.5 py-1.5', md: 'text-sm px-5 py-2.5', lg: 'text-sm px-6 py-3' };
  return (
    <button className={classNames(base, variants[variant], sizes[size], className)} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 014 12z"/>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps { className?: string; children: React.ReactNode }
export const Badge: React.FC<BadgeProps> = ({ className, children }) => (
  <span className={classNames('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border', className)}>
    {children}
  </span>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps { children: React.ReactNode; className?: string; hoverable?: boolean; }
export const Card: React.FC<CardProps> = ({ children, className, hoverable }) => (
  <div className={classNames(
    'rounded-2xl transition-all duration-200',
    hoverable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
    className
  )}
  style={{ background: '#FFFFFF', border: '1px solid #E8E3DA' }}>
    {children}
  </div>
);

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  breadcrumb: string;
  section: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumb, section, title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-8 animate-slide-in-up">
    <div>
      <p className="text-xs text-gray-400 mb-1.5 font-medium tracking-wide">{breadcrumb}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2 text-gray-400">{section}</p>
      <h1 className="text-3xl font-extrabold text-black mb-1 tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 mt-1">{action}</div>}
  </div>
);

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; leftElement?: React.ReactNode; rightElement?: React.ReactNode; id: string;
}
export const Input: React.FC<InputProps> = ({ label, error, leftElement, rightElement, className, id, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
    <div className="relative">
      {leftElement && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{leftElement}</div>}
      <input id={id} className={classNames(
        'w-full rounded-xl bg-white border text-sm text-gray-900 py-2.5 px-4 transition-all duration-150',
        'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-900',
        leftElement ? 'pl-10' : 'pl-4', rightElement ? 'pr-10' : 'pr-4',
        error ? 'border-red-400' : 'border-gray-200',
        className
      )} {...props} />
      {rightElement && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{rightElement}</div>}
    </div>
    {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; id: string; }
export const Textarea: React.FC<TextareaProps> = ({ label, className, id, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
    <textarea id={id} className={classNames(
      'w-full rounded-xl bg-white border border-gray-200 text-sm text-gray-900 px-4 py-2.5 resize-y transition-all duration-150',
      'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-900',
      className
    )} {...props} />
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; id: string; options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, id, options, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
    <select id={id} className={classNames(
      'w-full rounded-xl bg-white border border-gray-200 text-sm text-gray-900 px-4 py-2.5 transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-900',
      className
    )} {...props}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ─── Alert ────────────────────────────────────────────────────────────────────

interface AlertProps { variant?: 'info'|'success'|'warning'|'error'; title?: string; children?: React.ReactNode; icon?: React.ReactNode; className?: string; }
const ALERT_STYLES = {
  info:    { wrap: 'bg-blue-50 border border-blue-200 text-blue-800',      icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> },
  success: { wrap: 'bg-emerald-50 border border-emerald-200 text-emerald-800', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> },
  warning: { wrap: 'bg-amber-50 border border-amber-200 text-amber-800',   icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> },
  error:   { wrap: 'bg-red-50 border border-red-200 text-red-800',         icon: <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> },
};
export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, icon, className }) => {
  const s = ALERT_STYLES[variant];
  return (
    <div className={classNames('flex gap-3 rounded-xl px-4 py-3 text-sm', s.wrap, className)} role="alert">
      {icon ?? s.icon}
      <div>{title && <strong className="font-bold block mb-0.5">{title}</strong>}{children}</div>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps { isOpen: boolean; onClose: () => void; title?: string; children?: React.ReactNode; footer?: React.ReactNode; }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in-up bg-white"
        style={{ border: '1px solid #E8E3DA' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-black">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-gray-700">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps { tabs: { id: string; label: string; count?: number; icon?: React.ReactNode }[]; activeTab: string; onTabChange: (id: string) => void; }
export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200">
    {tabs.map((t) => (
      <button key={t.id} onClick={() => onTabChange(t.id)}
        className={classNames(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex-1 justify-center',
          activeTab === t.id
            ? 'bg-white text-black shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-800'
        )}>
        {t.icon}{t.label}
        {t.count !== undefined && (
          <span className={classNames('px-1.5 py-0.5 rounded-full text-xs font-bold',
            activeTab === t.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-600')}>
            {t.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── StatsCard ────────────────────────────────────────────────────────────────

interface StatsCardProps {
  label: string; value: string | number;
  trend?: { value: string; up: boolean };
  icon?: React.ReactNode; accentClass?: string;
}
export const StatsCard: React.FC<StatsCardProps> = ({ label, value, trend, icon, accentClass }) => (
  <div className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 animate-slide-in-up bg-white"
    style={{ border: '1px solid #E8E3DA' }}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      {icon && <span className={classNames('opacity-60', accentClass)}>{icon}</span>}
    </div>
    <p className="text-3xl font-extrabold text-black tabular-nums">{value}</p>
    {trend && (
      <p className={classNames('text-xs mt-2 font-semibold', trend.up ? 'text-emerald-600' : 'text-gray-400')}>
        {trend.up ? '↑' : '↓'} {trend.value}
      </p>
    )}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={classNames('animate-pulse bg-gray-100 rounded-xl', className)} />
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {icon && <div className="text-gray-300 mb-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">{icon}</div>}
    <p className="text-base font-bold text-gray-800 mb-1.5">{title}</p>
    {description && <p className="text-sm text-gray-400 max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps { page: number; totalPages: number; onPageChange: (p: number) => void; }
export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-5">
      <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors">
          Previous
        </button>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
          className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors">
          Next
        </button>
      </div>
    </div>
  );
};

// ─── DemoNotice ───────────────────────────────────────────────────────────────

interface DemoNoticeProps { message?: string; }
export const DemoNotice: React.FC<DemoNoticeProps> = ({ message }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-amber-800 mb-4 bg-amber-50 border border-amber-200">
    <span className="font-bold shrink-0 px-2 py-0.5 rounded-lg text-xs bg-amber-200 text-amber-900">
      Demo
    </span>
    <span>{message ?? 'Data is illustrative only. No real court records are used.'}</span>
  </div>
);
