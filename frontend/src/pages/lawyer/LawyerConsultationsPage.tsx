import React, { useState } from 'react';
import { CheckCircle2, XCircle, User, MessageSquare } from 'lucide-react';
import { PageHeader, Tabs } from '../../components/common';
import { DEMO_CONSULTATIONS } from '../../utils/demoData';
import { formatDateTime } from '../../utils/helpers';
import type { ConsultationRequest } from '../../types';

type Status = ConsultationRequest['status'];

const STATUS_CFG: Record<Status, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: '#92400e', bg: '#FEF9EE', border: '#FDE68A',  label: 'Pending'   },
  accepted:  { color: '#166534', bg: '#F0FDF4', border: '#BBF7D0',  label: 'Accepted'  },
  declined:  { color: '#9f1239', bg: '#FFF1F2', border: '#FECDD3',  label: 'Declined'  },
  completed: { color: '#716B63', bg: '#F5F0E7', border: '#DED6C9',  label: 'Completed' },
};

const LawyerConsultationsPage: React.FC = () => {
  const [activeTab, setActiveTab]         = useState('pending');
  const [consultations, setConsultations] = useState<ConsultationRequest[]>(DEMO_CONSULTATIONS);
  const [toast, setToast]                 = useState('');

  const update = (id: string, status: Status) => {
    setConsultations((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setToast(status === 'accepted' ? 'Consultation accepted.' : 'Request declined.');
    setTimeout(() => setToast(''), 3000);
  };

  const filtered = consultations.filter((c) => activeTab === 'all' || c.status === activeTab);
  const tabs = [
    { id: 'pending',  label: 'Pending',  count: consultations.filter((c) => c.status === 'pending').length  },
    { id: 'accepted', label: 'Accepted', count: consultations.filter((c) => c.status === 'accepted').length },
    { id: 'all',      label: 'All',      count: consultations.length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl animate-fade-in">
      <PageHeader
        breadcrumb="Lawyer / Consultation requests"
        section="LAWYER WORKSPACE"
        title="Consultation Requests"
        subtitle="Review and respond to client consultation requests."
      />

      {/* Toast */}
      {toast && (
        <div
          className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm animate-slide-in-up"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="space-y-4 stagger-children">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl py-16 text-center text-sm animate-fade-in"
            style={{ background: '#FFFCF7', border: '1px solid #DED6C9', color: '#B5ADA3' }}
          >
            No requests in this category.
          </div>
        ) : (
          filtered.map((c, idx) => {
            const cfg = STATUS_CFG[c.status];
            return (
              <div
                key={c.id}
                className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 animate-slide-in-up"
                style={{
                  background: '#FFFCF7',
                  border: '1px solid #DED6C9',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                  animationDelay: `${idx * 0.07}s`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <User className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#111111' }}>{c.citizenName}</p>
                        <span
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-medium mb-0.5" style={{ color: '#111111' }}>{c.caseTitle}</p>
                    <p className="text-xs mb-3" style={{ color: '#B5ADA3' }}>{formatDateTime(c.requestedAt)}</p>

                    {c.message && (
                      <div
                        className="flex items-start gap-2 p-3 rounded-xl"
                        style={{ background: '#F5F0E7', border: '1px solid #DED6C9' }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#B5ADA3' }} />
                        <p className="text-xs leading-relaxed" style={{ color: '#716B63' }}>{c.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {c.status === 'pending' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => update(c.id, 'accepted')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
                        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534' }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => update(c.id, 'declined')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
                        style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9f1239' }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LawyerConsultationsPage;
