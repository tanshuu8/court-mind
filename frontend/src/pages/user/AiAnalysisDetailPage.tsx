import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Clock, Scale, AlertCircle,
  Info, ChevronDown, ChevronUp, TrendingUp, Upload, Sparkles, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/common';
import {
  uploadStore, getDocTypeLabel, formatFileSize,
  type UploadedCase, type AnalysisStatus,
} from '../../services/uploadStore';
import { ragApi } from '../../services/api';
import type { SummarizeResponse } from '../../types';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AnalysisStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  pending:    { label: 'Analysis Pending',  dot: '#B5ADA3', text: '#716B63', bg: '#F5F0E7', border: '#DED6C9' },
  processing: { label: 'Processing...',     dot: '#d97706', text: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  complete:   { label: 'Analysis Ready',    dot: '#16a34a', text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  failed:     { label: 'Processing Failed', dot: '#dc2626', text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

// ── Collapsible section wrapper ────────────────────────────────────────────────

const Section: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ id, title, icon, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-[#DED6C9] overflow-hidden">
      <button
        id={`section-toggle-${id}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAFAF8] transition-colors"
        style={{ borderBottom: open ? '1px solid #DED6C9' : 'none' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[#111111]">{icon}</span>
          <p className="text-sm font-bold text-[#111111]">{title}</p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#B5ADA3]" />
          : <ChevronDown className="w-4 h-4 text-[#B5ADA3]" />
        }
      </button>
      {open && <div className="px-5 py-5">{children}</div>}
    </div>
  );
};

// ── Info row helper ────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-4 py-2.5 border-b border-[#F0EAE0] last:border-0">
    <p className="text-xs font-bold uppercase tracking-wide text-[#B5ADA3] w-36 shrink-0 pt-0.5">{label}</p>
    <div className="text-sm text-[#111111] font-medium">{value}</div>
  </div>
);

// ── Pending notice box ─────────────────────────────────────────────────────────

const PendingBox: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-[#F5F0E7] border border-[#DED6C9]">
    <Info className="w-4 h-4 text-[#716B63] shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-bold text-[#111111]">{title}</p>
      <p className="text-xs text-[#716B63] mt-0.5">{message}</p>
    </div>
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────────

const AiAnalysisDetailPage: React.FC = () => {
  const { caseId }  = useParams<{ caseId: string }>();
  const navigate    = useNavigate();
  const [record, setRecord] = useState<UploadedCase | null | undefined>(undefined);

  const [summaryData, setSummaryData] = useState<SummarizeResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setRecord(null);
      return;
    }
    const found = uploadStore.get(caseId);
    setRecord(found ?? null);
  }, [caseId]);

  // Loading state
  if (record === undefined) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in max-w-3xl">
        <div className="h-6 w-32 bg-[#F5F0E7] rounded-lg animate-pulse mb-6" />
        <div className="h-10 w-64 bg-[#F5F0E7] rounded-xl animate-pulse mb-8" />
        <div className="h-48 bg-[#F5F0E7] rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Not found
  if (record === null) {
    return (
      <div className="p-6 lg:p-8 animate-fade-in max-w-3xl">
        <button
          onClick={() => navigate('/user/ai-analysis')}
          className="flex items-center gap-2 text-sm font-semibold text-[#716B63] hover:text-[#111111] transition-colors mb-6"
          id="detail-back-not-found"
        >
          <ArrowLeft className="w-4 h-4" /> Back to AI Analysis
        </button>
        <div className="bg-white rounded-2xl border border-[#DED6C9] p-10 flex flex-col items-center text-center">
          <AlertCircle className="w-8 h-8 text-[#DED6C9] mb-3" />
          <p className="text-sm font-bold text-[#111111] mb-1">Document not found</p>
          <p className="text-xs text-[#716B63] mb-5">
            This case record does not exist or may have been removed.
          </p>
          <Button variant="primary" onClick={() => navigate('/user/ai-analysis')} id="detail-back-btn">
            Back to AI Analysis
          </Button>
        </div>
      </div>
    );
  }

  const sc = STATUS_CFG[record.status];
  const uploadDate = new Date(record.uploadedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const docId = record?.backendDocId || record?.id;
  const hasRealAnalysis = Boolean(summaryData?.summary || record?.summary);

  const handleGenerateSummary = async () => {
    if (!docId) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await ragApi.summarize(docId);
      setSummaryData(res);
      uploadStore.update(record.id, { summary: res.summary, status: 'complete' });
    } catch (err: unknown) {
      setSummaryError(err instanceof Error ? err.message : 'Summarization failed. Ensure document is indexed in vector store.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const hasRealRiskPrediction = false;

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-3xl">

      {/* Back link */}
      <button
        onClick={() => navigate('/user/ai-analysis')}
        className="flex items-center gap-2 text-sm font-semibold text-[#716B63] hover:text-[#111111] transition-colors mb-6"
        id="detail-back-link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to AI Analysis
      </button>

      {/* Page title */}
      <div className="mb-6">
        <p className="text-xs text-[#B5ADA3] mb-1 font-medium">Citizen / AI Analysis / Document Detail</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B5ADA3] mb-2">CITIZEN WORKSPACE</p>
        <h1 className="text-2xl font-extrabold text-[#111111] leading-tight break-all">
          {record.fileName}
        </h1>
        {/* Status pill */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.dot }} />
          <span className="text-sm font-semibold" style={{ color: sc.text }}>{sc.label}</span>
        </div>
      </div>

      {/* ── Section A: Document Details ────────────────────────────────────────── */}
      <div className="space-y-4">
        <Section id="document-details" title="Document Details" icon={<FileText className="w-4 h-4" />}>
          <div className="divide-y divide-[#F0EAE0]">
            <InfoRow label="Filename"      value={record.fileName} />
            <InfoRow label="Case Number"   value={record.caseNumber ?? <span className="text-[#B5ADA3] italic font-normal">Not provided</span>} />
            <InfoRow label="Document Type" value={getDocTypeLabel(record.docType)} />
            <InfoRow label="Court"         value={record.court ?? <span className="text-[#B5ADA3] italic font-normal">Not provided</span>} />
            <InfoRow label="File Size"     value={formatFileSize(record.fileSizeBytes)} />
            <InfoRow
              label="Upload Date"
              value={
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#B5ADA3]" />
                  {uploadDate}
                </span>
              }
            />
            <InfoRow
              label="Status"
              value={
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                  {sc.label}
                </span>
              }
            />
          </div>

          {/* Demo storage label */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Demo</span>
            <p className="text-xs text-amber-800">
              Case metadata stored in local demo storage (localStorage). Not uploaded to any server.
            </p>
          </div>
        </Section>

        {/* ── Section B: AI Document Analysis ─────────────────────────────────── */}
        <Section id="ai-analysis" title="AI Document Analysis" icon={<Scale className="w-4 h-4" />} defaultOpen>
          {hasRealAnalysis ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F0E7] border border-[#DED6C9] text-xs">
                <div>
                  <span className="font-bold text-[#111111]">{summaryData?.title || record.fileName}</span>
                  {summaryData?.total_pages ? (
                    <span className="text-[#716B63] ml-2">({summaryData.total_pages} pages · {summaryData.total_chunks || 0} chunks)</span>
                  ) : null}
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                  RAG 6-Part Summary
                </span>
              </div>
              <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed p-4 rounded-xl bg-[#FFFCF7] border border-[#DED6C9]">
                {summaryData?.summary || record.summary}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                isLoading={summaryLoading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Re-generate Summary
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {summaryError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Backend Summarization Notice</p>
                    <p className="mt-0.5">{summaryError}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-[#F5F0E7] border border-[#DED6C9] gap-3">
                <div>
                  <p className="text-sm font-bold text-[#111111]">Generate Structured 6-Part Legal Summary</p>
                  <p className="text-xs text-[#716B63] mt-0.5">
                    Connects to CourtMind RAG backend at <code className="font-mono text-[11px]">/api/rag/summarize</code>
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateSummary}
                  isLoading={summaryLoading}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  id="btn-summarize-doc"
                >
                  Generate Summary
                </Button>
              </div>

              <PendingBox
                title={record.status === 'failed' ? 'Analysis service error' : 'Analysis service ready'}
                message={
                  record.status === 'failed'
                    ? 'Document processing failed. Please re-upload or contact support.'
                    : record.status === 'processing'
                    ? 'Document is currently being processed. Check back shortly.'
                    : 'Click "Generate Summary" above to query the CourtMind RAG backend. The backend will extract a structured 6-part legal summary (case title, parties, facts, issues, holding, reasoning) using the indexed vector chunks.'
                }
              />

              {/* Analysis subsections shown as locked */}
              {['Document Summary', 'Parties & Key Entities', 'Important Dates & Deadlines', 'Key Legal Issues', 'Source References'].map((sub) => (
                <div
                  key={sub}
                  className="px-4 py-3 rounded-xl border border-[#DED6C9] bg-[#FAFAF8] flex items-center justify-between"
                >
                  <p className="text-sm font-semibold text-[#B5ADA3]">{sub}</p>
                  <span className="text-xs text-[#B5ADA3] italic">Pending</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Section C: Delay Risk Assessment ─────────────────────────────────── */}
        <Section id="delay-risk" title="Delay Risk Assessment" icon={<TrendingUp className="w-4 h-4" />} defaultOpen>
          {hasRealRiskPrediction ? (
            /* When ML model provides a real prediction, render it here */
            <div>
              {/* Risk level, confidence, SHAP chart go here */}
              <p className="text-sm text-[#716B63]">Prediction results will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Honest unavailable notice */}
              <PendingBox
                title="Delay risk prediction is not available yet"
                message={
                  'The XGBoost delay-prediction model has not been connected to this frontend. ' +
                  'No risk score, confidence percentage, or SHAP values are shown to avoid misleading you. ' +
                  'Risk Level (Low / Medium / High) and factor explanations will appear here once the ' +
                  'backend model produces a genuine prediction for this document.'
                }
              />

              {/* Risk meter placeholder */}
              <div className="rounded-xl border border-[#DED6C9] bg-[#FAFAF8] overflow-hidden">
                <div className="flex">
                  {(['Low', 'Medium', 'High'] as const).map((level) => (
                    <div
                      key={level}
                      className="flex-1 py-3 text-center text-xs font-semibold text-[#DED6C9] border-r border-[#DED6C9] last:border-r-0"
                    >
                      {level}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-[#DED6C9]">
                  <p className="text-xs text-[#B5ADA3] text-center">
                    Risk level: <span className="font-semibold">Unavailable</span> — prediction model not configured
                  </p>
                </div>
              </div>

              {/* SHAP placeholder */}
              <div className="px-4 py-3 rounded-xl border border-[#DED6C9] bg-[#FAFAF8]">
                <p className="text-xs font-bold text-[#B5ADA3] uppercase tracking-wide mb-2">
                  SHAP Factor Breakdown
                </p>
                <p className="text-xs text-[#B5ADA3] italic">
                  SHAP explanations will appear here after the prediction model processes this document.
                  Illustrative values are not shown.
                </p>
              </div>
            </div>
          )}

          {/* Find lawyer CTA */}
          <div
            className="mt-5 rounded-xl p-4 flex items-center justify-between"
            style={{ background: '#111111' }}
          >
            <div>
              <p className="text-sm font-bold text-white">Need legal help?</p>
              <p className="text-xs text-gray-400 mt-0.5">Connect with a Bar Council verified lawyer.</p>
            </div>
            <Link to="/user/lawyers">
              <Button variant="secondary" size="sm" id="detail-find-lawyer">Find Lawyer</Button>
            </Link>
          </div>
        </Section>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/user/ai-analysis')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            id="detail-back-btn-bottom"
          >
            All Documents
          </Button>
          <Link to="/user/upload">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              id="detail-upload-more"
            >
              Upload Another
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisDetailPage;
