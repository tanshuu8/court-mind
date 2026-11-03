import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, DemoNotice, Badge, Tabs } from '../../components/common';
import { DEMO_FEEDBACK } from '../../utils/demoData';
import { formatDateTime } from '../../utils/helpers';
import type { FeedbackReport } from '../../types';

const FeedbackPage: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackReport[]>(DEMO_FEEDBACK);
  const [activeTab, setActiveTab] = useState('all');

  const filtered = feedback.filter((f) => activeTab === 'all' || f.status === activeTab);

  const updateStatus = (id: string, status: FeedbackReport['status']) => {
    setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
  };

  const typeIcons: Record<string, React.ReactNode> = {
    bug: <AlertTriangle className="w-4 h-4 text-red-400" />,
    feedback: <MessageSquare className="w-4 h-4 text-sky-400" />,
    complaint: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  };

  const typeColors: Record<string, string> = {
    bug: 'bg-red-950/60 text-red-400 border-red-800/60',
    feedback: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
    complaint: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  };

  const statusColors: Record<string, string> = {
    open: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    in_review: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    resolved: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
  };

  const tabs = [
    { id: 'all', label: 'All', count: feedback.length },
    { id: 'open', label: 'Open', count: feedback.filter((f) => f.status === 'open').length },
    { id: 'in_review', label: 'In Review', count: feedback.filter((f) => f.status === 'in_review').length },
    { id: 'resolved', label: 'Resolved', count: feedback.filter((f) => f.status === 'resolved').length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Feedback &amp; Issue Reports</h1>
        <p className="text-sm text-slate-400 mt-1">Review and manage user feedback and platform issue reports.</p>
      </div>

      <DemoNotice />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="space-y-4">
        {filtered.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 shrink-0">{typeIcons[item.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={typeColors[item.type]}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                    <Badge className={statusColors[item.status]}>
                      {item.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                    <span className="text-xs text-slate-500">{item.userName}</span>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">{formatDateTime(item.submittedAt)}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
                <div className="flex gap-2 mt-3">
                  {item.status !== 'in_review' && (
                    <button
                      onClick={() => updateStatus(item.id, 'in_review')}
                      className="text-xs px-3 py-1 rounded border border-purple-800/50 text-purple-400 hover:bg-purple-950/20 transition-colors"
                      id={`review-${item.id}`}
                    >
                      Mark In Review
                    </button>
                  )}
                  {item.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(item.id, 'resolved')}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded border border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/20 transition-colors"
                      id={`resolve-${item.id}`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedbackPage;
