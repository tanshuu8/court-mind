import React, { useEffect, useState, useRef } from 'react';
import {
  Scale,
  FileText,
  UploadCloud,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Users,
  ArrowRight,
  RefreshCw,
  FileQuestion,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Building,
} from 'lucide-react';

interface Citation {
  doc_id: string;
  chunk_id: string;
  chunk_index: number;
  page_number: number;
  title?: string;
  court?: string;
  year?: string;
  similarity_score?: number;
}

interface AdvocateCTA {
  cta_title: string;
  cta_description: string;
  target_route: string;
  non_blocking: boolean;
  context_payload: Record<string, unknown>;
}

interface DocumentInfo {
  doc_id: string;
  title?: string;
  court?: string;
  year?: string;
  page_count?: number;
  chunks_indexed?: number;
  source?: string;
}

interface AskResult {
  query: string;
  mode?: 'document' | 'general';
  doc_id?: string;
  answer: string;
  citations: Citation[];
  is_grounded: boolean;
  status: string;
  source_attribution?: string;
  disclaimer?: string;
  advocate_cta: AdvocateCTA;
}

interface SummaryResult {
  doc_id: string;
  title?: string;
  court?: string;
  year?: string;
  total_pages?: number;
  total_chunks?: number;
  summary: string;
  status: string;
  advocate_cta: AdvocateCTA;
}

export const App: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'ask' | 'summary'>('ask');

  // Mode Selection for Q&A: 'document' (Ask This Document) vs 'general' (General Legal Question)
  const [askMode, setAskMode] = useState<'document' | 'general'>('document');

  // Document Registry State
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [docError, setDocError] = useState<string | null>(null);

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ask / Q&A State
  const [question, setQuestion] = useState<string>('');
  const [asking, setAsking] = useState<boolean>(false);
  const [askResult, setAskResult] = useState<AskResult | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState<boolean>(true);

  // Summary State
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Advocate Match Modal / Details
  const [showAdvocateModal, setShowAdvocateModal] = useState<boolean>(false);
  const [activeAdvocateCTA, setActiveAdvocateCTA] = useState<AdvocateCTA | null>(null);

  // Backend Health
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Fetch document registry
  const fetchDocuments = async (autoSelectId?: string) => {
    setLoadingDocs(true);
    setDocError(null);
    try {
      const res = await fetch('/api/v1/rag/documents');
      if (!res.ok) {
        throw new Error(`Failed to load documents (HTTP ${res.status})`);
      }
      const data = await res.json();
      setDocuments(data.documents || []);
      setBackendOnline(true);

      if (autoSelectId) {
        setSelectedDocId(autoSelectId);
      } else if (!selectedDocId && data.documents && data.documents.length > 0) {
        setSelectedDocId(data.documents[0].doc_id);
      }
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Failed to reach backend');
      setBackendOnline(false);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Automatically retry connection when offline so it goes online as soon as backend starts
  useEffect(() => {
    if (backendOnline === true) return;
    const timer = setInterval(() => {
      fetchDocuments();
    }, 4000);
    return () => clearInterval(timer);
  }, [backendOnline]);

  const selectedDocument = documents.find((d) => d.doc_id === selectedDocId);

  // Handle PDF Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    if (!uploadFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadMessage({ type: 'error', text: 'Only PDF documents (.pdf) are supported.' });
      return;
    }

    if (uploadFile.size > 50 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File exceeds 50 MB limit.' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch('/api/v1/rag/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Upload failed (HTTP ${res.status})`);
      }

      if (data.status === 'ocr_required') {
        setUploadMessage({
          type: 'warning',
          text: `OCR Required: ${data.message || 'This PDF contains scanned images without selectable text.'}`,
        });
      } else {
        setUploadMessage({
          type: 'success',
          text: `Indexed "${data.title || data.doc_id}" (${data.chunks_indexed} chunks, ${data.page_count} pages).`,
        });
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchDocuments(data.doc_id);
      }
    } catch (err: unknown) {
      setUploadMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'PDF upload and indexing failed.',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle Q&A Ask (supports both Mode A document-scoped and Mode B general legal)
  const handleAsk = async (e?: React.FormEvent, customQuestion?: string, overrideMode?: 'document' | 'general') => {
    if (e) e.preventDefault();
    const q = customQuestion || question;
    const targetMode = overrideMode || askMode;
    if (!q.trim()) return;
    if (targetMode === 'document' && !selectedDocId) {
      setAskError('Please select or upload a document to query in "Ask This Document" mode, or switch to "General Legal Question" mode.');
      return;
    }

    setAsking(true);
    setAskError(null);
    setAskResult(null);

    try {
      const res = await fetch('/api/v1/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: targetMode === 'document' ? selectedDocId : (selectedDocId || undefined),
          question: q.trim(),
          mode: targetMode,
          top_k: 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Query failed (HTTP ${res.status})`);
      }

      setAskResult(data);
    } catch (err: unknown) {
      setAskError(err instanceof Error ? err.message : 'Legal retrieval query failed.');
    } finally {
      setAsking(false);
    }
  };

  // Handle Summarize
  const handleSummarize = async () => {
    if (!selectedDocId) return;

    setSummarizing(true);
    setSummaryError(null);
    setSummaryResult(null);

    try {
      const res = await fetch('/api/v1/rag/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: selectedDocId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Summarization failed (HTTP ${res.status})`);
      }

      setSummaryResult(data);
    } catch (err: unknown) {
      setSummaryError(err instanceof Error ? err.message : 'Summarization failed.');
    } finally {
      setSummarizing(false);
    }
  };

  // Sample quick questions depending on Mode and Selected Document
  const getSuggestedQuestions = () => {
    if (askMode === 'general') {
      return [
        'What does Section 302 IPC mean?',
        'What is the "rarest of rare" doctrine in death penalty sentencing?',
        'What is the difference between Section 377 and Section 401 CrPC?',
        'What is deemed lapse of land acquisition under Section 24(2) of the 2013 Act?',
        'What is Article 21 and the Golden Triangle doctrine?',
      ];
    }

    // Document-specific suggestions supported by the ACTUAL uploaded PDF
    const title = selectedDocument?.title?.toLowerCase() || '';
    const docId = selectedDocId.toLowerCase();

    if (title.includes('land acquisition') || title.includes('rajesh kumar') || docId.includes('1615')) {
      return [
        'Does the court grant interest on solatium under the Land Acquisition Act?',
        'What is this case about?',
        'What was the decision of the Supreme Court regarding solatium interest?',
        'Why was the Delhi High Court deemed lapse order set aside?',
      ];
    } else if (title.includes('bachan') || docId.includes('1980') || docId.includes('1979')) {
      // Accurately reflects the 1979 2-Judge bench proceeding on CrPC 377/401
      return [
        'Who is Bachan Singh and what were the convictions against him?',
        'What is this case about?',
        'Can a revision petition for enhancement of sentence be heard with an appeal against conviction?',
        'What did the High Court decide regarding Section 377(3) and Section 401 CrPC?',
      ];
    } else if (title.includes('maneka') || docId.includes('1978')) {
      return [
        'What is the relationship between Article 14, 19, and 21 (Golden Triangle)?',
        'What is this case about?',
        'Was the impounding of the passport under Section 10(3)(c) violative of natural justice?',
        'What does "procedure established by law" mean after this judgment?',
      ];
    }
    return [
      'What is this case about?',
      'Who are the parties in this appeal?',
      'What are the primary legal issues and ratio decidendi in this case?',
      'What relief or final directions did the court order?',
    ];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 rounded-xl text-sky-400 shadow-sm shadow-sky-500/10">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">CourtMind</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-300 font-mono font-semibold">
                  Legal RAG
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Court Case Delay Intelligence & Grounded Judgment Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Storage Mode Badge */}
            <div
              title="Documents are indexed in FastAPI server RAM. PostgreSQL pgvector can be attached in production."
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>In-Memory Vector Store</span>
            </div>

            {/* Backend Health Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-400 animate-pulse'
                    : backendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300">
                {backendOnline === true ? 'API Connected' : backendOnline === false ? 'API Offline' : 'Connecting...'}
              </span>
              <button
                onClick={() => fetchDocuments()}
                className="ml-1 text-slate-400 hover:text-white transition-colors p-0.5"
                title="Refresh Documents & Status"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Banner Alert if API is offline */}
        {backendOnline === false && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                Backend server is not reachable at <code className="font-mono text-xs">/api</code>. Ensure FastAPI is running on port 8000.
              </span>
            </div>
            <button
              onClick={() => fetchDocuments()}
              className="px-3 py-1 rounded bg-rose-900 hover:bg-rose-800 text-xs text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Control Grid: Document Selector + Upload Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Document Selector & Info (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <h2 className="font-semibold text-sm text-slate-200">Active Legal Document</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} indexed
                </span>
              </div>

              {loadingDocs ? (
                <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                  Loading indexed judgments from vector store...
                </div>
              ) : docError ? (
                <div className="py-6 text-center text-xs text-rose-400">
                  {docError}
                </div>
              ) : documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No judgments currently indexed. Upload a legal judgment PDF below.
                </div>
              ) : (
                <div className="space-y-3">
                  <label htmlFor="doc-selector" className="sr-only">Select Document</label>
                  <select
                    id="doc-selector"
                    value={selectedDocId}
                    onChange={(e) => {
                      setSelectedDocId(e.target.value);
                      setAskResult(null);
                      setSummaryResult(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    {documents.map((doc) => (
                      <option key={doc.doc_id} value={doc.doc_id}>
                        {doc.title || doc.doc_id} ({doc.year || 'N/A'}) — {doc.chunks_indexed || 0} chunks
                      </option>
                    ))}
                  </select>

                  {/* Active Document Metadata Badge Strip */}
                  {selectedDocument && (
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">
                          {selectedDocument.title || 'Unknown Title'}
                        </span>
                        {selectedDocument.year && (
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/80 font-mono text-[11px]">
                            {selectedDocument.year}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          ID: {selectedDocument.doc_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-400 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{selectedDocument.court || 'Court N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>{selectedDocument.page_count ?? 'N/A'} pages</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          <span>{selectedDocument.chunks_indexed ?? 0} semantic chunks</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>All queries and summaries are strictly scoped to this selected document.</span>
              </span>
            </div>
          </div>

          {/* Upload PDF Box (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <h2 className="font-semibold text-sm text-slate-200">Index New Judgment PDF</h2>
                </div>
                <span className="text-[11px] text-slate-400">PDF only • Max 50 MB</span>
              </div>

              <form onSubmit={handleUpload} className="space-y-3">
                <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 transition-colors rounded-xl p-4 text-center bg-slate-950/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                        setUploadMessage(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                    <FileText className="w-6 h-6 text-slate-400" />
                    <p className="text-xs text-slate-300 font-medium">
                      {uploadFile ? uploadFile.name : 'Choose judgment PDF or drag here'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Extracts text, pages & dense vectors'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-sm shadow-indigo-600/20"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing, Chunking & Indexing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload & Index Document</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Upload Feedback Status */}
            {uploadMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs flex items-start space-x-2 ${
                  uploadMessage.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                    : uploadMessage.type === 'warning'
                    ? 'bg-amber-950/40 border border-amber-800 text-amber-300'
                    : 'bg-rose-950/40 border border-rose-800 text-rose-300'
                }`}
              >
                {uploadMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                )}
                <span className="leading-relaxed">{uploadMessage.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs: Ask Q&A vs Summarize */}
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ask This Document (Q&A)</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Legal Summary</span>
          </button>
        </div>

        {/* TAB 1: ASK THIS DOCUMENT (Q&A) */}
        {activeTab === 'ask' && (
          <div className="space-y-6">
            {/* Mode Switcher Banner */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 shadow-sm backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAskMode('document');
                    setAskResult(null);
                    setAskError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    askMode === 'document'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Mode A: Ask This Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAskMode('general');
                    setAskResult(null);
                    setAskError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    askMode === 'general'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Mode B: General Legal Question</span>
                </button>
              </div>

              <div className="text-xs text-slate-400">
                {askMode === 'document' ? (
                  <span className="flex items-center space-x-1 text-sky-300">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Scoped strictly to {selectedDocument?.title ? `"${selectedDocument.title}"` : 'selected judgment'}.</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-indigo-300">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>General statutory reference (IPC, CrPC, BNS) • Does not alter or query uploaded PDF.</span>
                  </span>
                )}
              </div>
            </div>

            {/* Question Input Card */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              <form onSubmit={handleAsk} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="rag-query-input" className="text-xs font-medium text-slate-300 flex items-center space-x-2">
                    <FileQuestion className="w-4 h-4 text-sky-400" />
                    <span>
                      {askMode === 'document'
                        ? `Ask a question grounded in ${selectedDocument?.title || 'the selected judgment'}`
                        : 'Ask a general legal or statutory reference question (e.g. IPC, CrPC, landmark doctrines)'}
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {askMode === 'document' ? 'Document-Scoped' : 'General Reference'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="rag-query-input"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={
                      askMode === 'document'
                        ? 'e.g. What is this case about? Or, Does the court grant interest on solatium?'
                        : 'e.g. What does Section 302 IPC mean? Or, What is the rarest of rare doctrine?'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || (askMode === 'document' && !selectedDocId) || asking}
                    className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
                  >
                    {asking ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Ask</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Suggested Questions Quick-Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400">
                    {askMode === 'document'
                      ? 'Suggested questions supported by this judgment:'
                      : 'Suggested general statutory & doctrinal questions:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {getSuggestedQuestions().map((sq, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuestion(sq);
                          handleAsk(undefined, sq);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-sky-300 transition-colors text-left flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{sq}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Error Message */}
            {askError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{askError}</span>
              </div>
            )}

            {/* Q&A Result Presentation */}
            {askResult && (
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-sm backdrop-blur-sm space-y-6">
                {/* Header: Query & Mode/Grounding Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">
                      Query ({askResult.mode === 'general' ? 'General Legal Question' : 'Ask This Document'}):
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">{askResult.query}</h3>
                  </div>

                  {/* Mode-Specific Status Pill */}
                  {askResult.mode === 'general' ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-medium">
                      <Scale className="w-3.5 h-3.5 text-indigo-400" />
                      <span>General Legal Reference</span>
                    </div>
                  ) : askResult.is_grounded ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Grounded in Judgment Passages</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Insufficient Evidence in Document</span>
                    </div>
                  )}
                </div>

                {/* Disclaimer / Attribution Banner for General Reference */}
                {askResult.mode === 'general' && askResult.disclaimer && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/60 text-xs text-indigo-200 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold">{askResult.source_attribution || 'General Legal Reference'}</span>
                      <p className="text-[11px] text-slate-400">{askResult.disclaimer}</p>
                    </div>
                  </div>
                )}

                {/* Answer Body */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Answer</h4>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {askResult.answer}
                  </div>
                </div>

                {/* Refusal Helper with Switch-to-General-Mode Button */}
                {askResult.mode === 'document' && !askResult.is_grounded && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        Looking for general statutory provisions or landmark doctrines outside this specific judgment?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAskMode('general');
                        handleAsk(undefined, askResult.query, 'general');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>Re-ask in General Legal Mode</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Grounded Citations (Page numbers & Passages for Document Mode) */}
                {askResult.mode === 'document' && askResult.citations && askResult.citations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowCitations(!showCitations)}
                        className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1 hover:text-slate-200 cursor-pointer"
                      >
                        <span>Supporting Citations ({askResult.citations.length})</span>
                        {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[11px] text-slate-500">Verified document source pages</span>
                    </div>

                    {showCitations && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {askResult.citations.map((c, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-sky-400 font-semibold">
                              <span>Source #{i + 1}</span>
                              <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800/80 text-[10px] text-sky-300 font-mono">
                                Page {c.page_number}
                              </span>
                            </div>
                            <p className="text-slate-300 font-medium truncate">{c.title || c.doc_id}</p>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                              <span>Chunk: {c.chunk_index}</span>
                              {c.similarity_score !== undefined && (
                                <span>Relevance: {(c.similarity_score * 100).toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Advocate Matching Call to Action */}
                {askResult.advocate_cta && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                          {askResult.advocate_cta.cta_title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        {askResult.advocate_cta.cta_description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveAdvocateCTA(askResult.advocate_cta);
                        setShowAdvocateModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 shrink-0 shadow-sm shadow-sky-500/20 cursor-pointer"
                    >
                      <span>Consult Advocates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STRUCTURED LEGAL SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-sm backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Comprehensive 6-Section Legal Summary
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generates Background, Legal Issues, Arguments, Court's Reasoning, Final Decision, and Legal Principles.
                </p>
              </div>

              <button
                onClick={handleSummarize}
                disabled={summarizing || !selectedDocId}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shrink-0 shadow-sm shadow-indigo-600/20 cursor-pointer"
              >
                {summarizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Document Passages...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Structured Summary</span>
                  </>
                )}
              </button>
            </div>

            {/* Summary Error */}
            {summaryError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{summaryError}</span>
              </div>
            )}

            {/* Summary Result Card */}
            {summaryResult && (
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-sm backdrop-blur-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">Case Summary:</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {summaryResult.title || summaryResult.doc_id}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {summaryResult.court && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                        {summaryResult.court}
                      </span>
                    )}
                    {summaryResult.year && (
                      <span className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-800 text-sky-300 font-mono">
                        {summaryResult.year}
                      </span>
                    )}
                  </div>
                </div>

                {/* 6 Structured Sections Rendered */}
                <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans space-y-4">
                  {summaryResult.summary.split('\n\n').map((paragraph, idx) => {
                    // Check if paragraph is a section header like "1. Case Background & Parties:"
                    const isHeader = /^[1-6]\.\s+/.test(paragraph.trim());
                    if (isHeader) {
                      const [headerPart, ...rest] = paragraph.split('\n');
                      return (
                        <div key={idx} className="space-y-1.5 pt-2 border-t border-slate-900 first:border-0 first:pt-0">
                          <h4 className="font-bold text-sky-300 text-sm flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span>{headerPart}</span>
                          </h4>
                          {rest.length > 0 && <p className="text-slate-300 pl-3.5 leading-relaxed">{rest.join('\n')}</p>}
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {/* Advocate CTA Card */}
                {summaryResult.advocate_cta && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                          {summaryResult.advocate_cta.cta_title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        {summaryResult.advocate_cta.cta_description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveAdvocateCTA(summaryResult.advocate_cta);
                        setShowAdvocateModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 shrink-0 shadow-sm shadow-sky-500/20 cursor-pointer"
                    >
                      <span>Consult Advocates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Advocate Matching Modal / Details View */}
      {showAdvocateModal && activeAdvocateCTA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">{activeAdvocateCTA.cta_title}</h3>
              </div>
              <button
                onClick={() => setShowAdvocateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeAdvocateCTA.cta_description}
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Matched Case Context
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Practice Area:</span>
                  <span className="font-medium">
                    {String(activeAdvocateCTA.context_payload.practice_area || 'Constitutional / Civil')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Forum / Court:</span>
                  <span className="font-medium">
                    {String(activeAdvocateCTA.context_payload.court || 'Supreme Court of India')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Source Reference:</span>
                  <span className="font-medium font-mono text-[11px]">
                    {String(activeAdvocateCTA.context_payload.origin_source || 'Legal RAG QA')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Target Action:</span>
                  <span className="font-medium text-sky-400">
                    {activeAdvocateCTA.target_route}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/60 text-[11px] text-sky-200">
              <ShieldCheck className="w-4 h-4 inline mr-1 text-sky-400" />
              CourtMind Advocate Intelligence matches vetted practitioners with domain-specific court experience. Suggestions require manual verification.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowAdvocateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(
                    `Connecting to Advocate Directory for practice area: ${
                      activeAdvocateCTA.context_payload.practice_area || 'General Legal Practice'
                    }`
                  );
                  setShowAdvocateModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors"
              >
                Find Specialists
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500 space-y-1">
        <div>
          CourtMind Legal RAG • AI-Powered Court Case Delay Intelligence & Grounded Judgment Analysis
        </div>
        <div className="text-[11px] text-slate-600">
          Disclaimer: CourtMind outputs are for legal research and educational reference only. They do not constitute formal legal counsel.
        </div>
      </footer>
    </div>
  );
};

export default App;
