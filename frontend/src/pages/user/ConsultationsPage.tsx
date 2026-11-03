import React, { useState } from 'react';
import { ClipboardList, Calendar, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, Badge, DemoNotice, EmptyState, Tabs } from '../../components/common';
import { DEMO_CONSULTATIONS } from '../../utils/demoData';
import { formatDateTime } from '../../utils/helpers';
import type { ConsultationRequest } from '../../types';

function getStatusStyle(status: ConsultationRequest['status']) {
  const map = {
    pending: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    accepted: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    declined: 'bg-red-950/60 text-red-400 border-red-800/60',
    completed: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  return map[status];
}

const ConsultationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [consultations, setConsultations] = useState<ConsultationRequest[]>(DEMO_CONSULTATIONS);

  const filtered = consultations.filter((c) => activeTab === 'all' || c.status === activeTab);

  const cancelConsultation = (id: string) => {
    setConsultations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'declined' as const } : c))
    );
  };

  const tabs = [
    { id: 'all', label: 'All', count: consultations.length },
    { id: 'pending', label: 'Pending', count: consultations.filter((c) => c.status === 'pending').length },
    { id: 'accepted', label: 'Accepted', count: consultations.filter((c) => c.status === 'accepted').length },
    { id: 'completed', label: 'Completed', count: consultations.filter((c) => c.status === 'completed').length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Consultation Requests</h1>
        <p className="text-sm text-slate-400 mt-1">Track the status of your lawyer consultation requests.</p>
      </div>

      <DemoNotice />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" />}
          title="No Consultations"
          description="You have no consultation requests in this category."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusStyle(c.status)}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">{c.id}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 mb-1">{c.caseTitle}</p>
                  {c.message && (
                    <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{c.message}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Requested: {formatDateTime(c.requestedAt)}
                    </span>
                    {c.scheduledDate && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3 h-3" />
                        Scheduled: {formatDateTime(c.scheduledDate)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Lawyer ID: {c.lawyerId}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {c.status === 'accepted' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Consultation confirmed
                    </div>
                  )}
                  {c.status === 'pending' && (
                    <button
                      onClick={() => cancelConsultation(c.id)}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-800/50 px-3 py-1.5 rounded-lg hover:bg-red-950/20 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                  {c.status === 'declined' && (
                    <span className="text-xs text-slate-500">Consultation cancelled / declined</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsultationsPage;
