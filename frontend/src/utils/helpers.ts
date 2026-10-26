import type { CaseStatus, DelayRisk, LawyerVerificationStatus } from '../types';

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function getCaseStatusColor(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    active:      'bg-blue-50 text-blue-700 border border-blue-200',
    pending:     'bg-amber-50 text-amber-700 border border-amber-200',
    adjourned:   'bg-orange-50 text-orange-700 border border-orange-200',
    decided:     'bg-green-50 text-green-700 border border-green-200',
    transferred: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
}

export function getCaseStatusLabel(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    active: 'Active', pending: 'Pending', adjourned: 'Adjourned',
    decided: 'Decided', transferred: 'Transferred',
  };
  return map[status] ?? status;
}

export function getDelayRiskColor(risk: DelayRisk): string {
  const map: Record<DelayRisk, string> = {
    low:    'bg-green-50 text-green-700 border border-green-200',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    high:   'bg-red-50 text-red-700 border border-red-200',
  };
  return map[risk] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
}

export function getDelayRiskDotColor(risk: DelayRisk): string {
  const map: Record<DelayRisk, string> = {
    low: 'bg-green-500', medium: 'bg-amber-500', high: 'bg-red-500',
  };
  return map[risk] ?? 'bg-gray-400';
}

export function getVerificationStatusColor(status: LawyerVerificationStatus): string {
  const map: Record<LawyerVerificationStatus, string> = {
    approved:          'bg-green-50 text-green-700 border border-green-200',
    pending:           'bg-amber-50 text-amber-700 border border-amber-200',
    rejected:          'bg-red-50 text-red-700 border border-red-200',
    more_info_required:'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
}

export function getVerificationStatusLabel(status: LawyerVerificationStatus): string {
  const map: Record<LawyerVerificationStatus, string> = {
    approved: 'Verified', pending: 'Pending Review',
    rejected: 'Rejected', more_info_required: 'More Info Required',
  };
  return map[status] ?? status;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
