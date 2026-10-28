import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, FileText, Scale, Gavel, Clock,
  Upload, Info, AlertCircle, ArrowLeft, Search, ChevronRight,
} from 'lucide-react';
import { DemoNotice } from '../../components/common';
import { uploadStore, type UploadedCase, type AnalysisStatus, getDocTypeLabel } from '../../services/uploadStore';
import { formatDate } from '../../utils/helpers';

// ── Event types ────────────────────────────────────────────────────────────────

type EventType = 'filed' | 'hearing' | 'order' | 'adjournment' | 'deadline' | 'upload' | 'other';

interface TimelineEvent {
  id:          string;
  date:        string;
  type:        EventType;
  label:       string;
  detail:      string;
  isPast:      boolean;
  isExtracted: boolean;
}

const EVENT_CFG: Record<EventType, { icon: React.FC<{ className?: string }>; label: string; bg: string; text: string; border: string }> = {
  filed:       { icon: Gavel,        label: 'Filed',       bg: '#F5F0E7', text: '#111111', border: '#DED6C9' },
  hearing:     { icon: Scale,        label: 'Hearing',     bg: '#FEF9EE', text: '#92400e', border: '#FDE68A' },
  order:       { icon: FileText,     label: 'Court Order', bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  adjournment: { icon: CalendarDays, label: 'Adjourned',   bg: '#FFF7ED', text: '#9a3412', border: '#FED7AA' },
  deadline:    { icon: Clock,        label: 'Deadline',    bg: '#FFF1F2', text: '#9f1239', border: '#FECDD3' },
  upload:      { icon: Upload,       label: 'Uploaded',    bg: '#F5F0E7', text: '#716B63', border: '#DED6C9' },
  other:       { icon: Info,         label: 'Event',       bg: '#F5F0E7', text: '#716B63', border: '#DED6C9' },
};

// ── Build timeline from uploaded case ─────────────────────────────────────────

function buildTimeline(record: UploadedCase): TimelineEvent[] {
  const now = new Date();
  const uploadedAt = new Date(record.uploadedAt);

  const events: TimelineEvent[] = [
    {
      id:          `upload-${record.id}`,
      date:        record.uploadedAt,
      type:        'upload',
      label:       'Document Uploaded',
      detail:      `"${record.fileName}" was added to local demo storage. No AI processing has completed yet.`,
      isPast:      uploadedAt < now,
      isExtracted: false,
    },
  ];

  if (record.caseNumber) {
    events.unshift({
      id:          `ref-${record.id}`,
      date:        record.uploadedAt,
      type:        'filed',
      label:       'Case Reference Noted',
      detail:      `Case number ${record.caseNumber} recorded from document metadata.`,
      isPast:      true,
      isExtracted: false,
    });
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: AnalysisStatus }) {
  const cfg = status === 'complete'
    ? { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', label: 'Complete' }
    : status === 'processing'
    ? { bg: '#FEF9EE', text: '#92400e', border: '#FDE68A', label: 'Processing' }
    : status === 'failed'
    ? { bg: '#FFF1F2', text: '#9f1239', border: '#FECDD3', label: 'Failed' }
    : { bg: '#F5F0E7', text: '#716B63', border: '#DED6C9', label: 'Pending' };
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────────

const EventCard: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
  const cfg  = EVENT_CFG[event.type];
  const Icon = cfg.icon;
  const dateStr = (() => {
    try { return formatDate(event.date.slice(0, 10)); }
    catch { return new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  })();

  return (
    <div className="flex gap-4 group">
      {/* Connector column */}
      <div className="flex flex-col items-center" style={{ width: 40 }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 border transition-all group-hover:scale-105"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <span style={{ color: cfg.text }}><Icon className="w-4 h-4" /></span>
        </div>
        {!isLast && (
          <div className="flex-1 w-0.5 mt-1" style={{ background: '#DED6C9', minHeight: 24 }} />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-2xl p-4 mb-4 border transition-all group-hover:-translate-y-0.5"
        style={{ background: '#FFFCF7', borderColor: '#DED6C9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
              >
                {cfg.label}
              </span>
              {event.isExtracted && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  AI Extracted · Unverified
                </span>
              )}
              {!event.isPast && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                  style={{ background: '#F5F0E7', color: '#716B63', borderColor: '#DED6C9' }}
                >
                  Upcoming
                </span>
              )}
            </div>
            <p className="text-sm font-bold mt-1" style={{ color: '#111111' }}>{event.label}</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#716B63' }}>{event.detail}</p>
          </div>
          <span className="text-xs font-semibold whitespace-nowrap shrink-0 mt-0.5" style={{ color: '#B5ADA3' }}>
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Case List Card ─────────────────────────────────────────────────────────────

const CaseListCard: React.FC<{ record: UploadedCase; onSelect: () => void }> = ({ record, onSelect }) => (
  <button
    onClick={onSelect}
    className="w-full text-left rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111111] group"
    style={{ background: '#FFFCF7', borderColor: '#DED6C9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#111111' }}
          >
            <FileText className="w-3.5 h-3.5" style={{ color: '#F5F0E7' }} />
          </div>
          <p className="text-sm font-bold truncate" style={{ color: '#111111' }}>
            {record.fileName}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {record.caseNumber && (
            <span className="text-xs" style={{ color: '#716B63' }}>
              Case No. <span className="font-semibold">{record.caseNumber}</span>
            </span>
          )}
          {record.docType && (
            <span className="text-xs" style={{ color: '#B5ADA3' }}>
              {getDocTypeLabel(record.docType)}
            </span>
          )}
          <StatusBadge status={record.status} />
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#B5ADA3' }}>
          Uploaded {new Date(record.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div
        className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all group-hover:bg-[#111111] group-hover:text-white group-hover:border-[#111111]"
        style={{ color: '#716B63', borderColor: '#DED6C9' }}
      >
        View Timeline
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  </button>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const TimelinePage: React.FC = () => {
  const [cases, setCases]         = useState<UploadedCase[]>([]);
  const [selectedId, setSelected] = useState<string | null>(null);
  const [search, setSearch]       = useState('');

  const refresh = useCallback(() => setCases(uploadStore.getAll()), []);
  useEffect(() => { refresh(); return uploadStore.onChange(refresh); }, [refresh]);

  const selectedCase = selectedId ? (cases.find((c) => c.id === selectedId) ?? null) : null;
  const events       = selectedCase ? buildTimeline(selectedCase) : [];

  const filteredCases = cases.filter((c) =>
    c.fileName.toLowerCase().includes(search.toLowerCase()) ||
    (c.caseNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Case-detail view ──────────────────────────────────────────────────────

  if (selectedCase) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-semibold mb-6 transition-all hover:-translate-x-0.5"
          style={{ color: '#716B63' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: '#B5ADA3' }}>
            CASE TIMELINE
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: '#111111' }}>
            {selectedCase.fileName}
          </h1>
          {selectedCase.caseNumber && (
            <p className="text-sm" style={{ color: '#716B63' }}>
              Case No. <span className="font-semibold">{selectedCase.caseNumber}</span>
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={selectedCase.status} />
            {selectedCase.docType && (
              <span className="text-xs" style={{ color: '#B5ADA3' }}>{getDocTypeLabel(selectedCase.docType)}</span>
            )}
          </div>
        </div>

        {/* Pending notice */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl border mb-6"
          style={{ background: '#FEF9EE', borderColor: '#FDE68A' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#92400e' }} />
          <p className="text-xs" style={{ color: '#92400e' }}>
            <strong>Timeline is based on uploaded metadata only.</strong>{' '}
            Court hearing dates, adjournments, and orders will appear here once the
            backend AI extraction pipeline processes this document. No events are fabricated.
          </p>
        </div>

        {/* Events */}
        {events.length > 0 ? (
          <div>
            {events.map((ev, i) => (
              <EventCard key={ev.id} event={ev} isLast={i === events.length - 1} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl border py-16 flex flex-col items-center text-center px-6"
            style={{ background: '#FFFCF7', borderColor: '#DED6C9' }}
          >
            <CalendarDays className="w-8 h-8 mb-3" style={{ color: '#DED6C9' }} />
            <p className="text-sm font-bold mb-1" style={{ color: '#111111' }}>
              No timeline events available for this case yet.
            </p>
            <p className="text-xs" style={{ color: '#716B63' }}>
              Events will appear after the document is processed by the AI pipeline.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Case list view ────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-in-up">
        <p className="text-xs text-gray-400 mb-1.5 font-medium tracking-wide">Citizen / Timeline</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2 text-gray-400">CITIZEN WORKSPACE</p>
        <h1 className="text-3xl font-extrabold text-black mb-1 tracking-tight leading-tight">Case Timeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Follow the progress of your court cases in chronological order.
        </p>
      </div>

      {cases.length === 0 ? (
        <>
          <DemoNotice message="No uploaded documents yet. Upload a court document from Upload Doc to see its timeline." />
          <div
            className="rounded-2xl border py-16 flex flex-col items-center text-center px-6"
            style={{ background: '#FFFCF7', borderColor: '#DED6C9' }}
          >
            <Upload className="w-10 h-10 mb-4" style={{ color: '#DED6C9' }} />
            <p className="text-sm font-bold mb-1" style={{ color: '#111111' }}>No documents uploaded yet</p>
            <p className="text-xs" style={{ color: '#716B63' }}>
              Upload a court document to start tracking its timeline.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#B5ADA3' }} />
            <input
              type="text"
              placeholder="Search by filename or case number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all"
              style={{ background: '#FFFCF7', border: '1px solid #DED6C9', color: '#111111' }}
            />
          </div>

          {filteredCases.length === 0 ? (
            <div
              className="rounded-2xl border py-12 flex flex-col items-center text-center px-6"
              style={{ background: '#FFFCF7', borderColor: '#DED6C9' }}
            >
              <Scale className="w-8 h-8 mb-3" style={{ color: '#DED6C9' }} />
              <p className="text-sm font-bold mb-1" style={{ color: '#111111' }}>No results</p>
              <p className="text-xs" style={{ color: '#716B63' }}>Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCases.map((record) => (
                <CaseListCard
                  key={record.id}
                  record={record}
                  onSelect={() => setSelected(record.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimelinePage;
