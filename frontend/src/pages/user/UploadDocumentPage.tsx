import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle2, AlertCircle,
  Clock, ChevronRight, Trash2,
} from 'lucide-react';
import { PageHeader, Button, DemoNotice } from '../../components/common';
import {
  uploadStore, validatePdfFile, formatFileSize,
  DOC_TYPE_OPTIONS, getDocTypeLabel,
  type UploadedCase,
} from '../../services/uploadStore';

// ── Input style helpers ────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl bg-white border border-[#DED6C9] text-sm text-[#111111] py-2.5 px-4 ' +
  'placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all';

const labelCls = 'block text-xs font-bold uppercase tracking-wide text-[#716B63] mb-1.5';

// ── History panel item ─────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:    { label: 'Pending Analysis', dot: '#B5ADA3', text: '#716B63' },
  processing: { label: 'Processing…',      dot: '#d97706', text: '#d97706' },
  complete:   { label: 'Analysis Ready',   dot: '#16a34a', text: '#16a34a' },
  failed:     { label: 'Processing Failed',dot: '#dc2626', text: '#dc2626' },
};

interface HistoryItemProps {
  record: UploadedCase;
  onRemove: (id: string) => void;
}
const HistoryItem: React.FC<HistoryItemProps> = ({ record, onRemove: _onRemove }) => {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const sc = STATUS_CFG[record.status];
  const uploadDate = new Date(record.uploadedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="p-4 rounded-xl border border-[#DED6C9] bg-[#FFFCF7] group animate-slide-in-up">
      <div className="flex items-start gap-3">
        {/* PDF icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9]">
          <FileText className="w-4 h-4 text-[#111111]" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Filename */}
          <p className="text-sm font-semibold text-[#111111] truncate leading-snug">
            {record.fileName}
          </p>

          {/* Case number */}
          <p className="text-xs text-[#716B63] mt-0.5">
            {record.caseNumber ? `Case: ${record.caseNumber}` : 'Case number not provided'}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[#B5ADA3] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {uploadDate}
            </span>
            <span className="text-xs text-[#B5ADA3]">
              {getDocTypeLabel(record.docType)}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.dot }} />
            <span className="text-xs font-semibold" style={{ color: sc.text }}>{sc.label}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmRemove ? (
            <>
              <button
                onClick={() => { uploadStore.remove(record.id); uploadStore.notify(); setConfirmRemove(false); }}
                className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, remove
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-2 py-1 text-xs font-semibold text-[#716B63] hover:text-[#111111] transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              className="p-1.5 rounded-lg text-[#B5ADA3] hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Remove record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Open case link */}
      <Link
        to={`/user/ai-analysis/${record.id}`}
        className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-[#F5F0E7] border border-[#DED6C9] hover:bg-[#EDE8DF] transition-colors group/btn"
      >
        <span className="text-xs font-semibold text-[#111111]">Open Case</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#716B63] group-hover/btn:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const UploadDocumentPage: React.FC = () => {

  // Form state
  const [caseNumber, setCaseNumber] = useState('');
  const [docType, setDocType]       = useState('court_order');
  const [court, setCourt]           = useState('');

  // File state
  const [selectedFile, setSelectedFile]       = useState<File | null>(null);
  const [fileError, setFileError]             = useState<string | null>(null);
  const [isDragging, setIsDragging]           = useState(false);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  // Upload state
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  // Track the last uploaded case ID so we can offer navigation buttons
  const [lastUploadedId, setLastUploadedId] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<UploadedCase[]>([]);

  const refreshHistory = useCallback(() => {
    setHistory(uploadStore.getAll());
  }, []);

  useEffect(() => {
    refreshHistory();
    return uploadStore.onChange(refreshHistory);
  }, [refreshHistory]);

  // ── File selection ──────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return;
    setFileError(null);
    setUploadState('idle');
    setProgress(0);

    const err = await validatePdfFile(file);
    if (err) {
      setFileError(err);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setSelectedFile(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
  };

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  }, [handleFileSelect]);

  const clearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadState('idle');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile || uploading || uploadState === 'done') return;

    setUploading(true);
    setUploadState('uploading');
    setProgress(0);
    setLastUploadedId(null);

    // Simulate upload progress (frontend demo — no real server upload)
    for (let p = 10; p <= 90; p += 10) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(p);
    }
    setProgress(100);

    const newCase = uploadStore.add({
      fileName:      selectedFile.name,
      fileSizeBytes: selectedFile.size,
      uploadedAt:    new Date().toISOString(),
      docType,
      caseNumber:    caseNumber.trim() || null,
      court:         court.trim() || null,
      status:        'pending', // Analysis pending — no fake risk assigned
      delayRisk:     null,
    });

    uploadStore.notify();
    setLastUploadedId(newCase.id);
    setUploadState('done');
    setUploading(false);
    // ✅ No automatic navigate() — user stays on Upload Doc and clicks manually.
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-6xl">
      <PageHeader
        breadcrumb="Citizen / Upload document"
        section="CITIZEN WORKSPACE"
        title="Upload Court Document"
        subtitle="Submit court orders, judgments, petitions, and other legal filings for analysis."
      />

      <DemoNotice message="Local demo storage only — documents are not uploaded to a server. Case metadata is saved in your browser's localStorage." />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Left: Upload form ────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Document details */}
          <div className="bg-white rounded-2xl border border-[#DED6C9] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#716B63] mb-4">Document Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Case number */}
              <div>
                <label className={labelCls} htmlFor="upload-case-number">
                  Case Number <span className="normal-case font-normal text-[#B5ADA3]">(optional)</span>
                </label>
                <input
                  id="upload-case-number"
                  type="text"
                  placeholder="e.g. CIV/2024/00142"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Document type */}
              <div>
                <label className={labelCls} htmlFor="upload-doc-type">Document Type</label>
                <select
                  id="upload-doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className={inputCls}
                >
                  {DOC_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Court */}
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="upload-court">
                  Court / Jurisdiction <span className="normal-case font-normal text-[#B5ADA3]">(optional)</span>
                </label>
                <input
                  id="upload-court"
                  type="text"
                  placeholder="e.g. Delhi High Court, Sessions Court Mumbai"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Drop zone */}
          {!selectedFile ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className="relative rounded-2xl border-2 border-dashed py-16 text-center transition-all duration-200 cursor-pointer group"
              style={{
                borderColor: isDragging ? '#111111' : '#DED6C9',
                background: isDragging ? '#F0EDE8' : '#FFFCF7',
              }}
            >
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept=".pdf,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={onInputChange}
                aria-label="Upload PDF file"
              />
              <div className="pointer-events-none flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105"
                  style={{ background: '#111111' }}
                >
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">
                    {isDragging ? 'Release to select file' : 'Drag & drop your PDF here'}
                  </p>
                  <p className="text-xs text-[#716B63] mt-1">or click to browse · PDF only · max 10 MB</p>
                </div>
              </div>
            </div>
          ) : (
            /* Selected file card */
            <div className="bg-white rounded-2xl border border-[#DED6C9] p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9]">
                  <FileText className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111111] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[#716B63] mt-0.5">
                    {formatFileSize(selectedFile.size)} · {getDocTypeLabel(docType)}
                    {caseNumber && ` · ${caseNumber}`}
                  </p>
                  <p className="text-xs text-[#B5ADA3] mt-0.5">
                    Selected {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {uploadState === 'idle' && (
                  <button
                    onClick={clearFile}
                    className="p-1.5 rounded-lg text-[#B5ADA3] hover:text-[#111111] hover:bg-[#F5F0E7] transition-colors shrink-0"
                    aria-label="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {(uploadState === 'uploading' || uploadState === 'done') && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#716B63]">
                      {uploadState === 'uploading' ? `Uploading… ${progress}%` : 'Upload recorded'}
                    </span>
                    {uploadState === 'done' && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-[#F5F0E7] border border-[#DED6C9]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, background: '#111111' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation error */}
          {fileError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-slide-in-up">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{fileError}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            variant="primary"
            size="lg"
            id="upload-analyze-btn"
            disabled={!selectedFile || uploading || uploadState === 'done'}
            isLoading={uploading}
            onClick={handleUpload}
            leftIcon={!uploading ? <Upload className="w-4 h-4" /> : undefined}
            className="w-full"
          >
            {uploading ? 'Uploading…' : uploadState === 'done' ? 'Uploaded — Upload Another Below' : 'Upload & Analyze'}
          </Button>

          {/* ── Success card shown after upload ──────────────────────────── */}
          {uploadState === 'done' && lastUploadedId && (
            <div className="rounded-2xl border border-[#DED6C9] bg-[#FFFCF7] p-5 animate-slide-in-up">
              <div className="flex items-center gap-2.5 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                <p className="text-sm font-bold text-[#111111]">Upload recorded successfully</p>
              </div>
              <p className="text-xs text-[#716B63] mb-1">
                <strong>{selectedFile?.name}</strong> has been saved to local demo storage.
                The case has been added to My Cases and AI Analysis.
              </p>
              <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Demo</span>
                <p className="text-xs text-amber-800">Stored in localStorage only — not uploaded to any server.</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/user/cases">
                  <Button variant="primary" size="sm" id="upload-success-view-cases">
                    View in My Cases
                  </Button>
                </Link>
                <Link to={`/user/ai-analysis/${lastUploadedId}`}>
                  <Button variant="outline" size="sm" id="upload-success-view-analysis">
                    View Analysis
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    setUploadState('idle');
                    setProgress(0);
                    setLastUploadedId(null);
                    setCaseNumber('');
                    setCourt('');
                    setDocType('court_order');
                    clearFile();
                  }}
                  className="text-sm font-semibold text-[#716B63] hover:text-[#111111] underline underline-offset-2"
                >
                  Upload another document
                </button>
              </div>
            </div>
          )}

          {/* Accepted formats notice */}
          <p className="text-xs text-[#B5ADA3] text-center">
            Accepted: PDF court documents only (court orders, judgments, petitions, filings) · Max 10 MB
          </p>
        </div>

        {/* ── Right: Upload history ─────────────────────────────────────────── */}
        <div className="flex flex-col">
          <div className="bg-white rounded-2xl border border-[#DED6C9] flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="px-5 py-4 border-b border-[#DED6C9] flex items-center justify-between shrink-0">
              <p className="text-sm font-bold text-[#111111]">Upload History</p>
              {history.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F5F0E7] text-[#716B63] border border-[#DED6C9]">
                  {history.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F5F0E7] border border-[#DED6C9] mb-3">
                    <FileText className="w-5 h-5 text-[#B5ADA3]" />
                  </div>
                  <p className="text-sm font-semibold text-[#716B63]">No documents uploaded yet</p>
                  <p className="text-xs text-[#B5ADA3] mt-1">Your uploaded court documents will appear here.</p>
                </div>
              ) : (
                history.map((record) => (
                  <HistoryItem
                    key={record.id}
                    record={record}
                    onRemove={(id) => { uploadStore.remove(id); uploadStore.notify(); }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentPage;
