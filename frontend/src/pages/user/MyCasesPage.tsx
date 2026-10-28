import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, ChevronRight, Upload, TrendingUp, FileText,
  Trash2, AlertCircle, Info,
} from 'lucide-react';
import { PageHeader, Button, EmptyState } from '../../components/common';
import {
  uploadStore, getDocTypeLabel, formatFileSize,
  type UploadedCase,
} from '../../services/uploadStore';

// ── Risk badge config ──────────────────────────────────────────────────────────

const RISK_CFG = {
  high:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'High Risk',   dot: '#ef4444' },
  medium: { color: '#d97706', bg: '#fffbeb', border: '#fed7aa', label: 'Medium Risk', dot: '#f59e0b' },
  low:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low Risk',    dot: '#22c55e' },
};

// ── Analysis status config ─────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:    { label: 'Analysis Pending',  dot: '#B5ADA3', text: '#716B63', bg: '#F5F0E7', border: '#DED6C9' },
  processing: { label: 'Processing…',       dot: '#d97706', text: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  complete:   { label: 'Analysis Ready',    dot: '#16a34a', text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  failed:     { label: 'Processing Failed', dot: '#dc2626', text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

// ── Case card ─────────────────────────────────────────────────────────────────

interface CaseCardProps {
  record: UploadedCase;
  index: number;
  onRemove: (id: string) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ record, index, onRemove }) => {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const navigate = useNavigate();

  const sc = STATUS_CFG[record.status];
  const rc = record.delayRisk ? RISK_CFG[record.delayRisk] : null;

  const uploadDate = new Date(record.uploadedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="bg-white rounded-2xl border border-[#DED6C9] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm animate-slide-in-up flex flex-col group"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Top row: status/risk badge + remove */}
      <div className="flex items-center justify-between mb-3">
        {/* Risk or analysis-status badge */}
        {rc ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: rc.dot }} />
            {rc.label}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
            {sc.label}
          </span>
        )}

        {/* Remove */}
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#B5ADA3] hover:text-red-600 hover:bg-red-50 transition-all"
            aria-label="Remove case"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRemove(record.id)}
              className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="px-2 py-1 text-xs text-[#716B63] hover:text-[#111111]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* PDF icon + filename */}
      <div className="flex items-start gap-3 mb-3 flex-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9] mt-0.5">
          <FileText className="w-4 h-4 text-[#111111]" />
        </div>
        <div className="min-w-0">
          {/* Actual filename — never a fabricated case name */}
          <p className="text-sm font-bold text-[#111111] leading-snug break-all">
            {record.fileName}
          </p>
          {/* Case number */}
          <p className="text-xs text-[#716B63] mt-0.5">
            {record.caseNumber ? `Case No. ${record.caseNumber}` : 'Case number not provided'}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-1 mb-4">
        <p className="text-xs text-[#B5ADA3]">{getDocTypeLabel(record.docType)}</p>
        {record.court && <p className="text-xs text-[#B5ADA3]">{record.court}</p>}
        <p className="text-xs text-[#B5ADA3] flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Uploaded {uploadDate}
        </p>
        <p className="text-xs text-[#B5ADA3]">{formatFileSize(record.fileSizeBytes)}</p>
      </div>

      {/* Pending notice */}
      {record.status === 'pending' && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#F5F0E7] border border-[#DED6C9] mb-3">
          <Info className="w-3.5 h-3.5 text-[#716B63] shrink-0 mt-0.5" />
          <p className="text-xs text-[#716B63]">
            Analysis pending — no risk score assigned until backend processes this document.
          </p>
        </div>
      )}

      {/* Action */}
      <div className="border-t border-[#DED6C9] pt-3 mt-auto">
        <button
          onClick={() => navigate('/user/ai-analysis')}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#111111] hover:gap-2 transition-all duration-150"
          id={`open-case-${record.id}`}
        >
          View Analysis <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const MyCasesPage: React.FC = () => {
  const [cases, setCases] = useState<UploadedCase[]>([]);

  const refresh = useCallback(() => {
    setCases(uploadStore.getAll());
  }, []);

  useEffect(() => {
    refresh();
    return uploadStore.onChange(refresh);
  }, [refresh]);

  const handleRemove = (id: string) => {
    uploadStore.remove(id);
    uploadStore.notify();
  };

  const pendingCount  = cases.filter((c) => c.status === 'pending').length;
  const analygedCount = cases.filter((c) => c.status === 'complete').length;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <PageHeader
        breadcrumb="Citizen / My cases"
        section="CITIZEN WORKSPACE"
        title="My Cases"
        subtitle="Court documents you have uploaded. Analysis results appear here once processed."
        action={
          <Link to="/user/upload">
            <Button variant="primary" leftIcon={<Upload className="w-4 h-4" />} id="upload-doc-btn">
              Upload Document
            </Button>
          </Link>
        }
      />

      {cases.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No documents uploaded yet"
          description="Upload a PDF court order, judgment, or petition to create your first case record."
          action={
            <Link to="/user/upload">
              <Button variant="primary" leftIcon={<Upload className="w-4 h-4" />} id="empty-upload-btn">
                Upload Document
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-2xl border border-[#DED6C9]">
            <div>
              <p className="text-2xl font-extrabold text-[#111111]">{cases.length}</p>
              <p className="text-xs text-[#716B63]">Total documents</p>
            </div>
            <div className="w-px h-8 bg-[#DED6C9]" />
            <div>
              <p className="text-2xl font-extrabold text-[#716B63]">{pendingCount}</p>
              <p className="text-xs text-[#716B63]">Pending analysis</p>
            </div>
            <div className="w-px h-8 bg-[#DED6C9]" />
            <div>
              <p className="text-2xl font-extrabold text-green-700">{analygedCount}</p>
              <p className="text-xs text-[#716B63]">Analysis ready</p>
            </div>

            {pendingCount > 0 && (
              <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F0E7] border border-[#DED6C9]">
                <AlertCircle className="w-3.5 h-3.5 text-[#716B63]" />
                <p className="text-xs text-[#716B63]">
                  {pendingCount} document{pendingCount !== 1 ? 's' : ''} awaiting backend analysis. No risk score is shown until a real prediction is available.
                </p>
              </div>
            )}
          </div>

          {/* Cases grid — uploaded documents only */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {cases.map((c, i) => (
              <CaseCard key={c.id} record={c} index={i} onRemove={handleRemove} />
            ))}
          </div>
        </>
      )}

      {/* Bottom CTA */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: '#111111' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Need a lawyer?</p>
            <p className="text-xs text-gray-400 mt-0.5">Only Bar Council verified lawyers are shown.</p>
          </div>
        </div>
        <Link to="/user/lawyers">
          <Button variant="secondary" id="find-lawyer-cta-btn">Find Lawyer</Button>
        </Link>
      </div>
    </div>
  );
};

export default MyCasesPage;
