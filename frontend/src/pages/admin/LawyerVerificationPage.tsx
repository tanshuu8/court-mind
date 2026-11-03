import React, { useState } from 'react';
import { PageHeader, Button, Modal, Textarea } from '../../components/common';
import { DEMO_LAWYERS } from '../../utils/demoData';
import type { Lawyer } from '../../types';
import { getVerificationStatusColor, getVerificationStatusLabel } from '../../utils/helpers';

type Action = 'approve' | 'reject' | 'more_info';

const LawyerVerificationPage: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>(DEMO_LAWYERS);
  const [selected, setSelected] = useState<Lawyer | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');

  const confirm = () => {
    if (!selected || !action) return;
    const map: Record<Action, Lawyer['verificationStatus']> = { approve: 'approved', reject: 'rejected', more_info: 'more_info_required' };
    setLawyers((prev) => prev.map((l) => l.id === selected.id ? { ...l, verificationStatus: map[action] } : l));
    setFeedback(`${selected.name} — ${map[action].replace('_', ' ')}.`);
    setTimeout(() => setFeedback(''), 4000);
    setSelected(null); setAction(null); setNote('');
  };

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader breadcrumb="Admin / Lawyer verification" section="ADMIN WORKSPACE" title="Lawyer verification" subtitle="Review and approve lawyer registration applications." />

      {feedback && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{feedback}</div>}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {lawyers.map((l) => (
          <div key={l.id} className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusColor(l.verificationStatus)}`}>
                    {getVerificationStatusLabel(l.verificationStatus)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-0.5">{l.email}</p>
                <p className="text-xs text-gray-500">{l.specializations.join(', ')} · {l.location} · {l.experience} yrs · {l.barCouncilNumber ?? 'No Bar Council no.'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setSelected(l); setAction('approve'); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                  Approve
                </button>
                <button onClick={() => { setSelected(l); setAction('reject'); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  Reject
                </button>
                <button onClick={() => { setSelected(l); setAction('more_info'); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  Return for More Info
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selected && !!action}
        onClose={() => { setSelected(null); setAction(null); }}
        title={action === 'approve' ? 'Approve Lawyer' : action === 'reject' ? 'Reject Application' : 'Request More Information'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setSelected(null); setAction(null); }}>Cancel</Button>
            <Button variant="primary" onClick={confirm} id="confirm-verification-btn">Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          You are about to <strong className="text-gray-900">{action?.replace('_', ' ')}</strong> the application for <strong className="text-gray-900">{selected?.name}</strong>.
        </p>
        <Textarea id="verification-note" label="Admin note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note or reason…" rows={3} />
      </Modal>
    </div>
  );
};

export default LawyerVerificationPage;
