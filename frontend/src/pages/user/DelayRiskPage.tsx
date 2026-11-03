import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertCircle, ChevronRight, Upload, Info, FileText } from 'lucide-react';
import { PageHeader, Button } from '../../components/common';
import { uploadStore, type UploadedCase } from '../../services/uploadStore';

// ── Risk badge config ──────────────────────────────────────────────────────────

const RISK_CFG = {
  high:   { label: 'High Risk',   bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444', bar: '#ef4444' },
  medium: { label: 'Medium Risk', bg: '#fffbeb', border: '#fed7aa', text: '#d97706', dot: '#f59e0b', bar: '#f59e0b' },
  low:    { label: 'Low Risk',    bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '#22c55e', bar: '#22c55e' },
};

// ── Overview stats from actual uploaded documents ──────────────────────────────

function computeStats(cases: UploadedCase[]) {
  const analysed = cases.filter((c) => c.status === 'complete' && c.delayRisk);
  const pending   = cases.filter((c) => c.status === 'pending' || c.status === 'processing');
  const high      = analysed.filter((c) => c.delayRisk === 'high').length;
  const medium    = analysed.filter((c) => c.delayRisk === 'medium').length;
  const low       = analysed.filter((c) => c.delayRisk === 'low').length;
  return { total: cases.length, analysed: analysed.length, pending: pending.length, high, medium, low };
}

// ── Individual case risk row ───────────────────────────────────────────────────

const CaseRiskRow: React.FC<{ record: UploadedCase }> = ({ record }) => {
  const rc = record.delayRisk ? RISK_CFG[record.delayRisk] : null;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#DED6C9] last:border-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9]">
        <FileText className="w-3.5 h-3.5 text-[#111111]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111111] truncate">{record.fileName}</p>
        <p className="text-xs text-[#716B63]">
          {record.caseNumber ? `Case ${record.caseNumber}` : 'Case number not provided'}
        </p>
      </div>
      {rc ? (
        <span
          className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
          style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
        >
          {rc.label}
        </span>
      ) : (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 bg-[#F5F0E7] text-[#716B63] border border-[#DED6C9]">
          {record.status === 'processing' ? 'Processing…' : 'Pending'}
        </span>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const DelayRiskPage: React.FC = () => {
  const [cases, setCases] = useState<UploadedCase[]>([]);

  const refresh = useCallback(() => { setCases(uploadStore.getAll()); }, []);
  useEffect(() => { refresh(); return uploadStore.onChange(refresh); }, [refresh]);

  const stats = computeStats(cases);

  return (
    <div className="p-6 lg:p-8 max-w-4xl animate-fade-in">
      <PageHeader
        breadcrumb="Citizen / Delay risk"
        section="CITIZEN WORKSPACE"
        title="Delay Risk"
        subtitle="Overall delay risk summary across your uploaded court documents."
      />

      {/* Model status notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F5F0E7] border border-[#DED6C9] mb-6">
        <Info className="w-4 h-4 text-[#716B63] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#111111]">Prediction model not configured</p>
          <p className="text-xs text-[#716B63] mt-0.5">
            The XGBoost delay-prediction model has not been connected to this frontend yet.
            Risk scores shown below reflect actual backend predictions when available.
            No risk is automatically assigned to uploaded documents.
          </p>
        </div>
      </div>

      {cases.length === 0 ? (
        /* No documents uploaded */
        <div className="bg-white rounded-2xl border border-[#DED6C9] p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#F5F0E7] border border-[#DED6C9] mb-4">
            <TrendingUp className="w-6 h-6 text-[#B5ADA3]" />
          </div>
          <p className="text-base font-bold text-[#111111] mb-1">No documents to analyse</p>
          <p className="text-sm text-[#716B63] max-w-sm mb-6">
            Upload a court document first. Delay risk predictions will appear here after backend analysis.
          </p>
          <Link to="/user/upload">
            <Button variant="primary" leftIcon={<Upload className="w-4 h-4" />} id="delay-upload-btn">
              Upload a Document
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Overall summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Documents',   value: stats.total,    color: '#111111',  bg: '#F5F0E7', border: '#DED6C9' },
              { label: 'Pending Analysis',  value: stats.pending,  color: '#716B63',  bg: '#F5F0E7', border: '#DED6C9' },
              { label: 'High Risk',         value: stats.high,     color: '#dc2626',  bg: '#fef2f2', border: '#fecaca' },
              { label: 'Low Risk',          value: stats.low,      color: '#16a34a',  bg: '#f0fdf4', border: '#bbf7d0' },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 animate-slide-in-up"
                style={{ background: s.bg, border: `1px solid ${s.border}`, animationDelay: `${i * 0.05}s` }}
              >
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-semibold text-[#716B63] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Per-document risk table */}
          <div className="bg-white rounded-2xl border border-[#DED6C9] mb-6">
            <div className="px-5 py-4 border-b border-[#DED6C9]">
              <p className="text-sm font-bold text-[#111111]">Document Risk Status</p>
              <p className="text-xs text-[#716B63] mt-0.5">
                Only documents that have been processed by the backend prediction model will show a risk level.
              </p>
            </div>
            <div className="px-5 py-1">
              {cases.map((c) => (
                <CaseRiskRow key={c.id} record={c} />
              ))}
            </div>
          </div>

          {/* Risk distribution bar (only when at least one is analysed) */}
          {stats.analysed > 0 && (
            <div className="bg-white rounded-2xl border border-[#DED6C9] p-5 mb-6">
              <p className="text-sm font-bold text-[#111111] mb-4">Risk Distribution (Analysed documents)</p>
              {(['high', 'medium', 'low'] as const).map((level) => {
                const count  = level === 'high' ? stats.high : level === 'medium' ? stats.medium : stats.low;
                const pct    = stats.analysed > 0 ? Math.round((count / stats.analysed) * 100) : 0;
                const cfg    = RISK_CFG[level];
                return (
                  <div key={level} className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#111111]">{cfg.label}</span>
                      <span className="text-xs text-[#716B63]">{count} / {stats.analysed} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[#F5F0E7] border border-[#DED6C9]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: cfg.bar }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SHAP notice */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F5F0E7] border border-[#DED6C9] mb-6">
            <AlertCircle className="w-4 h-4 text-[#716B63] shrink-0 mt-0.5" />
            <p className="text-sm text-[#716B63]">
              SHAP factor explanations will appear here once the XGBoost model produces predictions.
              Illustrative SHAP values are not shown to avoid misleading you.
            </p>
          </div>
        </>
      )}

      {/* Find lawyer CTA */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: '#111111' }}
      >
        <div>
          <p className="text-sm font-bold text-white">Need legal help?</p>
          <p className="text-xs text-gray-400 mt-0.5">Connect with a Bar Council verified lawyer.</p>
        </div>
        <Link to="/user/lawyers">
          <Button variant="secondary" id="delay-find-lawyer" leftIcon={<ChevronRight className="w-4 h-4" />}>
            Find a Lawyer
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DelayRiskPage;
