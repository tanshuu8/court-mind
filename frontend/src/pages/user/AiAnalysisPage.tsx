import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot, Upload, FileText, Clock, Search, X,
  ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { PageHeader, Button } from '../../components/common';
import {
  uploadStore, getDocTypeLabel,
  type UploadedCase, type AnalysisStatus,
} from '../../services/uploadStore';

// ── Status pill config ─────────────────────────────────────────────────────────

const STATUS_CFG: Record<AnalysisStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  pending:    { label: 'Analysis Pending',  dot: '#B5ADA3', text: '#716B63', bg: '#F5F0E7', border: '#DED6C9' },
  processing: { label: 'Processing…',       dot: '#d97706', text: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  complete:   { label: 'Analysis Ready',    dot: '#16a34a', text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  failed:     { label: 'Processing Failed', dot: '#dc2626', text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const ALL_STATUSES: AnalysisStatus[] = ['pending', 'processing', 'complete', 'failed'];

// ── Case card ─────────────────────────────────────────────────────────────────

interface CaseCardProps {
  record: UploadedCase;
  index: number;
  onClick: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ record, index, onClick }) => {
  const sc = STATUS_CFG[record.status];
  const uploadDate = new Date(record.uploadedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-[#DED6C9] p-4 sm:p-5
                 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm
                 animate-slide-in-up group focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      style={{ animationDelay: `${index * 0.04}s` }}
      id={`case-card-${record.id}`}
    >
      <div className="flex items-start gap-3">
        {/* PDF icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9] mt-0.5">
          <FileText className="w-4 h-4 text-[#111111]" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Filename */}
          <p className="text-sm font-bold text-[#111111] truncate leading-snug">
            {record.fileName}
          </p>

          {/* Case number */}
          <p className="text-xs text-[#716B63] mt-0.5 truncate">
            {record.caseNumber ? `Case No. ${record.caseNumber}` : 'Case number not provided'}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="text-xs text-[#B5ADA3]">{getDocTypeLabel(record.docType)}</span>
            <span className="text-xs text-[#B5ADA3] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {uploadDate}
            </span>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: sc.dot }}
            />
            <span className="text-xs font-semibold" style={{ color: sc.text }}>
              {sc.label}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          className="w-4 h-4 text-[#B5ADA3] shrink-0 mt-3 group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const AiAnalysisPage: React.FC = () => {
  const navigate = useNavigate();

  const [allCases, setAllCases]         = useState<UploadedCase[]>([]);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<AnalysisStatus | 'all'>('all');
  const [showFilters, setShowFilters]   = useState(false);

  const refresh = useCallback(() => { setAllCases(uploadStore.getAll()); }, []);

  useEffect(() => {
    refresh();
    return uploadStore.onChange(refresh);
  }, [refresh]);

  // Filter logic
  const filtered = allCases.filter((c) => {
    const matchSearch =
      !search ||
      c.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (c.caseNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      getDocTypeLabel(c.docType).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); };
  const hasActiveFilter = search !== '' || statusFilter !== 'all';

  // ── Empty state ───────────────────────────────────────────────────────────

  if (allCases.length === 0) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in max-w-4xl">
        <PageHeader
          breadcrumb="Citizen / AI analysis"
          section="CITIZEN WORKSPACE"
          title="AI Analysis"
          subtitle="Select an uploaded court document to view its analysis and delay-risk assessment."
        />

        <div className="bg-white rounded-2xl border border-[#DED6C9] py-20 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#F5F0E7] border border-[#DED6C9] mb-4">
            <Bot className="w-7 h-7 text-[#B5ADA3]" />
          </div>
          <p className="text-base font-bold text-[#111111] mb-1">No uploaded documents yet</p>
          <p className="text-sm text-[#716B63] max-w-sm mb-6">
            Upload a court document from the Upload Doc page to get started.
          </p>
          <Link to="/user/upload">
            <Button variant="primary" leftIcon={<Upload className="w-4 h-4" />} id="ai-goto-upload-btn">
              Go to Upload Doc
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Case list ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-4xl">
      <PageHeader
        breadcrumb="Citizen / AI analysis"
        section="CITIZEN WORKSPACE"
        title="AI Analysis"
        subtitle="Select an uploaded court document to view its analysis and delay-risk assessment."
      />

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B5ADA3] pointer-events-none" />
          <input
            id="ai-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename, case number, or type…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DED6C9] text-sm
                       text-[#111111] placeholder-[#B5ADA3] focus:outline-none focus:ring-2
                       focus:ring-black/20 focus:border-[#111111] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#B5ADA3] hover:text-[#111111]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((o) => !o)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold
                      border transition-all ${showFilters || statusFilter !== 'all'
            ? 'bg-[#111111] text-white border-[#111111]'
            : 'bg-white text-[#111111] border-[#DED6C9] hover:border-[#111111]'}`}
          id="ai-filter-toggle"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {statusFilter !== 'all' && (
            <span className="w-2 h-2 rounded-full bg-white shrink-0" />
          )}
        </button>
      </div>

      {/* Status filter chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-5 animate-slide-in-up">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${statusFilter === 'all'
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white text-[#716B63] border-[#DED6C9] hover:border-[#111111] hover:text-[#111111]'}`}
          >
            All ({allCases.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const count = allCases.filter((c) => c.status === s).length;
            if (count === 0) return null;
            const sc = STATUS_CFG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                            ${statusFilter === s
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white border-[#DED6C9] hover:border-[#111111]'}`}
                style={statusFilter !== s ? { color: sc.text } : undefined}
              >
                {sc.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Result count / clear */}
      {hasActiveFilter && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#716B63]">
            {filtered.length} of {allCases.length} document{allCases.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-[#111111] underline underline-offset-2 hover:no-underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* No results after filter */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DED6C9] py-14 flex flex-col items-center text-center px-6">
          <Search className="w-8 h-8 text-[#DED6C9] mb-3" />
          <p className="text-sm font-bold text-[#111111] mb-1">No matching documents</p>
          <p className="text-xs text-[#716B63]">Try adjusting your search or filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-[#111111] underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((record, i) => (
            <CaseCard
              key={record.id}
              record={record}
              index={i}
              onClick={() => navigate(`/user/ai-analysis/${record.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AiAnalysisPage;
