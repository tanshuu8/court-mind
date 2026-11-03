import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, StatsCard } from '../../components/common';
import { DEMO_CONSULTATIONS } from '../../utils/demoData';
import { formatDateTime } from '../../utils/helpers';
import type { ConsultationRequest } from '../../types';
import { ArrowRight, UserCircle, Briefcase, ShieldCheck } from 'lucide-react';

function statusStyle(status: ConsultationRequest['status']): React.CSSProperties {
  if (status === 'pending')   return { background: '#FEF9EE', color: '#92400e', border: '1px solid #FDE68A' };
  if (status === 'accepted')  return { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' };
  if (status === 'completed') return { background: '#F5F0E7', color: '#716B63', border: '1px solid #DED6C9' };
  return { background: '#FFF1F2', color: '#9f1239', border: '1px solid #FECDD3' };
}

const LawyerDashboard: React.FC = () => {
  const [consultations] = useState<ConsultationRequest[]>(DEMO_CONSULTATIONS);
  const pending   = consultations.filter((c) => c.status === 'pending').length;
  const accepted  = consultations.filter((c) => c.status === 'accepted').length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl animate-fade-in">
      <PageHeader
        breadcrumb="Lawyer / Dashboard"
        section="LAWYER WORKSPACE"
        title="Dashboard"
        subtitle="Your consultation and practice overview."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatsCard label="PENDING"    value={pending} />
        <StatsCard label="ACCEPTED"   value={accepted} />
        <StatsCard label="TOTAL"      value={consultations.length} />
        <StatsCard label="AVG RATING" value="4.8" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/lawyer/profile',       icon: <UserCircle className="w-5 h-5" />,  label: 'My Profile',           desc: 'Update your availability and bio.' },
          { to: '/lawyer/consultations', icon: <Briefcase  className="w-5 h-5" />,  label: 'Consultations',        desc: 'Review and respond to requests.' },
          { to: '/lawyer/verification',  icon: <ShieldCheck className="w-5 h-5" />, label: 'Verification Status',  desc: 'Track your verification progress.' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 group"
            style={{ background: '#FFFCF7', borderColor: '#DED6C9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
              style={{ background: '#111111', color: '#F5F0E7' }}
            >
              {item.icon}
            </div>
            <p className="text-sm font-bold mb-0.5" style={{ color: '#111111' }}>{item.label}</p>
            <p className="text-xs" style={{ color: '#B5ADA3' }}>{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent consultations */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: '#FFFCF7', borderColor: '#DED6C9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #DED6C9' }}>
          <p className="text-sm font-bold" style={{ color: '#111111' }}>Recent Consultation Requests</p>
          <Link
            to="/lawyer/consultations"
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: '#716B63' }}
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: '#F5F0E7' }}>
          {consultations.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F5F0E7]/40 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>{c.citizenName}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: '#716B63' }}>{c.caseTitle}</p>
                <p className="text-xs mt-0.5" style={{ color: '#B5ADA3' }}>{formatDateTime(c.requestedAt)}</p>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ml-3"
                style={statusStyle(c.status)}
              >
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard;
