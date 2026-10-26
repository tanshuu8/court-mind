import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Scale, User, Building2, Clock, AlertTriangle, FileText,
} from 'lucide-react';
import { DEMO_CASES } from '../../utils/demoData';
import { Card, Badge, Button, Alert } from '../../components/common';
import { getCaseStatusColor, getCaseStatusLabel, getDelayRiskColor, formatDate } from '../../utils/helpers';

const DEMO_HEARINGS = [
  { id: 'h-1', date: '2024-10-01', type: 'Evidence Hearing', outcome: 'Adjourned', adjournmentReason: 'Witness not present', nextDate: '2024-11-12' },
  { id: 'h-2', date: '2024-08-20', type: 'Arguments', outcome: 'Partial arguments heard', nextDate: '2024-10-01' },
  { id: 'h-3', date: '2024-06-14', type: 'Document Submission', outcome: 'Documents filed and accepted', nextDate: '2024-08-20' },
  { id: 'h-4', date: '2024-04-09', type: 'Preliminary Hearing', outcome: 'Case admitted, notices issued', nextDate: '2024-06-14' },
];

const DEMO_DOCUMENTS = [
  { id: 'd-1', name: 'Petition.pdf', type: 'Petition', uploadedAt: '2024-03-15', size: '1.2 MB', status: 'analyzed' as const },
  { id: 'd-2', name: 'Evidence_Bundle.pdf', type: 'Evidence', uploadedAt: '2024-06-12', size: '4.5 MB', status: 'analyzed' as const },
  { id: 'd-3', name: 'Witness_Statement.pdf', type: 'Affidavit', uploadedAt: '2024-08-18', size: '0.8 MB', status: 'analyzed' as const },
];

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courtCase = DEMO_CASES.find((c) => c.id === id) ?? DEMO_CASES[0];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/user/cases" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to My Cases
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getCaseStatusColor(courtCase.status)}>
              {getCaseStatusLabel(courtCase.status)}
            </Badge>
            {courtCase.delayRisk && (
              <Badge className={getDelayRiskColor(courtCase.delayRisk)}>
                {courtCase.delayRisk.charAt(0).toUpperCase() + courtCase.delayRisk.slice(1)} Delay Risk
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-100">{courtCase.title}</h1>
          <p className="text-sm text-slate-400 font-mono mt-1">{courtCase.caseNumber}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/user/delay-analysis?caseId=${courtCase.id}`}>
            <Button variant="primary" size="sm" leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}>
              View Prediction
            </Button>
          </Link>
        </div>
      </div>

      {/* Case Metadata */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Case Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <Building2 className="w-4 h-4 text-sky-400" />, label: 'Court', value: courtCase.court },
            { icon: <User className="w-4 h-4 text-sky-400" />, label: 'Petitioner', value: courtCase.petitioner },
            { icon: <User className="w-4 h-4 text-sky-400" />, label: 'Respondent', value: courtCase.respondent },
            { icon: <Scale className="w-4 h-4 text-sky-400" />, label: 'Presiding Judge', value: courtCase.judge ?? '—' },
            { icon: <Calendar className="w-4 h-4 text-sky-400" />, label: 'Filing Date', value: formatDate(courtCase.filingDate) },
            { icon: <Clock className="w-4 h-4 text-sky-400" />, label: 'Next Hearing', value: courtCase.nextHearing ? formatDate(courtCase.nextHearing) : '—' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                {item.icon}
                {item.label}
              </div>
              <p className="text-sm text-slate-200 font-medium">{item.value}</p>
            </div>
          ))}
        </div>
        {courtCase.description && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed">{courtCase.description}</p>
          </div>
        )}
      </Card>

      {/* Hearing Timeline */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Hearing Timeline</h2>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />
            <div className="space-y-6">
              {DEMO_HEARINGS.map((h, i) => (
                <div key={h.id} className="flex gap-4">
                  <div className="relative shrink-0">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 relative ${
                      i === 0
                        ? 'border-sky-500 bg-sky-950 text-sky-400'
                        : 'border-slate-700 bg-slate-900 text-slate-400'
                    }`}>
                      {DEMO_HEARINGS.length - i}
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-200">{h.type}</p>
                      {h.adjournmentReason && (
                        <Badge className="bg-orange-950/50 text-orange-300 border-orange-800/60 text-xs">Adjourned</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{formatDate(h.date)}</p>
                    <p className="text-sm text-slate-400">{h.outcome}</p>
                    {h.adjournmentReason && (
                      <p className="text-xs text-slate-500 mt-1">Reason: {h.adjournmentReason}</p>
                    )}
                    {h.nextDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="text-slate-400">Next date set:</span> {formatDate(h.nextDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Case Documents</h2>
          <Link to="/user/upload">
            <Button variant="outline" size="sm">Upload More</Button>
          </Link>
        </div>
        <div className="divide-y divide-slate-800">
          {DEMO_DOCUMENTS.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.type} · {doc.size} · {formatDate(doc.uploadedAt)}</p>
                </div>
              </div>
              <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60">Analyzed</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Alert variant="info" title="Data Notice">
        This is demo data. In a live deployment, case information is retrieved from the CourtMind backend API.
      </Alert>
    </div>
  );
};

export default CaseDetailPage;
