import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, User, RotateCcw, Upload, ChevronDown, AlertCircle, RefreshCw,
  FileText, CheckCircle2, X, Sparkles, ShieldCheck, Info,
} from 'lucide-react';
import { uploadStore, type UploadedCase } from '../../services/uploadStore';
import { ragApi } from '../../services/api';
import type { Citation, DocumentInfo, UploadResponse } from '../../types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  citations?: Citation[];
  isGrounded?: boolean;
  disclaimer?: string;
  sourceAttribution?: string;
  provider?: string;
  model?: string;
}

// ── Suggested questions ────────────────────────────────────────────────────────

const SUGGESTED_DOCUMENT = [
  'Summarise the main legal issue in this judgment.',
  'What did the court hold regarding statutory compensation or deemed lapse?',
  'What are the key precedents cited in this case?',
  'What is the ratio decidendi and final relief granted?',
];

const SUGGESTED_GENERAL = [
  "What is the 'rarest of rare' doctrine in Indian criminal jurisprudence?",
  "Explain Section 24(2) of the Right to Fair Compensation Act 2013.",
  "Does the right to travel abroad fall within personal liberty under Article 21?",
  "What are the essential requirements for natural justice under Article 14 and 21?",
];

// ── Message bubble ─────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  const time = msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-in-up`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={isUser
          ? { background: '#111111', border: '1px solid #111111' }
          : msg.isError
          ? { background: '#FEE2E2', border: '1px solid #FCA5A5' }
          : { background: '#F5F0E7', border: '1px solid #DED6C9' }
        }
      >
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : msg.isError
          ? <AlertCircle className="w-4 h-4 text-red-600" />
          : <Bot className="w-4 h-4 text-[#111111]" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
          style={isUser ? {
            background: '#111111',
            color: '#F5F0E7',
            borderRadius: '18px 4px 18px 18px',
          } : msg.isError ? {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
            borderRadius: '4px 18px 18px 18px',
          } : {
            background: '#FFFCF7',
            color: '#111111',
            border: '1px solid #DED6C9',
            borderRadius: '4px 18px 18px 18px',
          }}
        >
          {/* Grounding & Attribution header pill */}
          {!isUser && !msg.isError && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {msg.isGrounded ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  Grounded in Judgment Passages
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Info className="w-3 h-3 text-amber-700" />
                  {msg.sourceAttribution || 'General Legal Reference'}
                </span>
              )}
              {msg.provider && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F5F0E7] text-[#716B63] border border-[#DED6C9]">
                  Provider: <span className="font-semibold text-[#111111] capitalize">{msg.provider}</span>
                  {msg.model && <span className="font-mono text-[#716B63]">({msg.model})</span>}
                </span>
              )}
            </div>
          )}

          {msg.content}

          {/* Citations list with page numbers */}
          {!isUser && msg.citations && msg.citations.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#DED6C9]/80 space-y-1.5">
              <p className="text-[11px] font-bold text-[#716B63] uppercase tracking-wider flex items-center gap-1">
                <span>Verified Source Citations</span>
                <span className="text-[10px] font-normal lowercase text-[#B5ADA3]">
                  ({msg.citations.length} passage{msg.citations.length !== 1 ? 's' : ''})
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {msg.citations.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F0E7] border border-[#DED6C9] text-xs text-[#111111] hover:bg-[#EDE8DF] transition-colors"
                    title={`Document ID: ${c.doc_id}\nChunk: #${c.chunk_index}\nSimilarity: ${typeof c.similarity_score === 'number' ? (c.similarity_score * 100).toFixed(1) + '%' : 'N/A'}`}
                  >
                    <span className="font-semibold truncate max-w-[200px]">{c.title || c.doc_id}</span>
                    <span className="text-slate-700 font-bold px-1.5 py-0.5 bg-white/70 rounded">
                      Page {c.page_number}
                    </span>
                    {typeof c.similarity_score === 'number' && (
                      <span className="text-[10px] text-[#716B63]">
                        ({Math.round(c.similarity_score * 100)}%)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer if present */}
          {!isUser && msg.disclaimer && (
            <div className="mt-2.5 pt-2 border-t border-[#DED6C9]/60 text-[11px] italic text-[#716B63]">
              {msg.disclaimer}
            </div>
          )}
        </div>
        <span className="text-[10px] text-[#B5ADA3] px-1">{time}</span>
      </div>
    </div>
  );
};

// ── Typing indicator ───────────────────────────────────────────────────────────

const TypingIndicator: React.FC<{ statusText?: string }> = ({ statusText }) => (
  <div className="flex gap-3 animate-fade-in">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9]">
      <Bot className="w-4 h-4 text-[#111111]" />
    </div>
    <div
      className="px-4 py-3 rounded-2xl bg-[#FFFCF7] border border-[#DED6C9] flex flex-col gap-1.5"
      style={{ borderRadius: '4px 18px 18px 18px' }}
    >
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#B5ADA3] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {statusText && (
        <span className="text-xs text-[#716B63] font-medium">{statusText}</span>
      )}
    </div>
  </div>
);

// ── Page Component ────────────────────────────────────────────────────────────

const AskDocumentsPage: React.FC = () => {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Querying CourtMind RAG...');
  const [uploadedCases, setUploadedCases] = useState<UploadedCase[]>([]);
  const [indexedDocs, setIndexedDocs]     = useState<DocumentInfo[]>([]);
  const [docsLoading, setDocsLoading]     = useState(true);
  const [docsError, setDocsError]         = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [llmProvider, setLlmProvider]     = useState<string>('');
  const [llmModel, setLlmModel]           = useState<string>('');
  const [contextCaseId, setContextCaseId] = useState<string>('all');
  const [showCaseSelect, setShowCaseSelect] = useState(false);

  // Dedicated RAG upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile]       = useState<File | null>(null);
  const [uploading, setUploading]             = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadError, setUploadError]         = useState<string | null>(null);

  // Summarize state
  const [summarizing, setSummarizing] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load uploaded cases from local demo store
  const refreshCases = useCallback(() => { setUploadedCases(uploadStore.getAll()); }, []);
  useEffect(() => { refreshCases(); return uploadStore.onChange(refreshCases); }, [refreshCases]);

  // Fetch real indexed documents and RAG health from FastAPI backend
  const loadIndexedDocuments = useCallback(async () => {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const [healthRes, docsRes] = await Promise.allSettled([
        ragApi.health(),
        ragApi.listDocuments(),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.status === 'ok') {
        setBackendStatus('connected');
        if (healthRes.value.llm) {
          setLlmProvider(healthRes.value.llm.provider || '');
          setLlmModel(healthRes.value.llm.model || '');
        }
      } else {
        setBackendStatus('offline');
      }

      if (docsRes.status === 'fulfilled') {
        setIndexedDocs(docsRes.value.documents || []);
      } else {
        setBackendStatus('offline');
        setDocsError('Could not reach CourtMind backend at /api/rag/documents');
      }
    } catch (err: unknown) {
      setBackendStatus('offline');
      setDocsError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIndexedDocuments();
  }, [loadIndexedDocuments]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

  // Resolve active document display name
  const activeIndexedDoc = indexedDocs.find((d) => d.doc_id === contextCaseId);
  const activeUploadedDoc = uploadedCases.find((c) => c.id === contextCaseId || c.backendDocId === contextCaseId);
  const contextLabel = contextCaseId === 'all'
    ? 'All Indexed Judgments (General Mode)'
    : (activeIndexedDoc?.title || activeUploadedDoc?.fileName || contextCaseId);

  const canSend = input.trim().length > 0 && !loading;

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), ...msg }]);
  };

  // ── Send question to backend RAG ───────────────────────────────────────────
  const handleSend = async () => {
    if (!canSend) return;
    const questionText = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    addMessage({ role: 'user', content: questionText, timestamp: new Date() });
    setLoading(true);
    setLoadingStatus('Retrieving relevant legal passages & generating AI response...');

    try {
      const isGeneral = contextCaseId === 'all';
      const targetDocId = isGeneral ? undefined : contextCaseId;

      const res = await ragApi.ask({
        question: questionText,
        doc_id: targetDocId,
        mode: isGeneral ? 'general' : 'document',
        top_k: 5,
      });

      addMessage({
        role: 'assistant',
        content: res.answer,
        timestamp: new Date(),
        citations: res.citations || [],
        isGrounded: res.is_grounded,
        sourceAttribution: res.source_attribution,
        disclaimer: res.disclaimer,
        provider: res.provider,
        model: res.model,
      });
      setBackendStatus('connected');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to query CourtMind RAG backend.';
      const isQuotaError = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota');

      const formattedError = isQuotaError
        ? `⚠️ AI Rate Limit / Quota Exceeded (HTTP 429)\n\nThe AI provider rate limit has been reached. Under CourtMind's generation architecture, offline mock answers are strictly prohibited in connected mode.\n\nPlease wait a moment and retry.`
        : `⚠️ RAG Query Error: ${errMsg}\n\nPlease verify that the FastAPI backend is running on http://127.0.0.1:8000.`;

      addMessage({
        role: 'assistant',
        content: formattedError,
        timestamp: new Date(),
        isError: true,
      });
      if (!isQuotaError) {
        setBackendStatus('offline');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Document summarization ─────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (contextCaseId === 'all') return;
    setSummarizing(true);
    setLoading(true);
    setLoadingStatus('Generating structured legal summary with AI...');

    addMessage({
      role: 'user',
      content: `Please provide a structured 6-part legal summary of "${contextLabel}".`,
      timestamp: new Date(),
    });

    try {
      const res = await ragApi.summarize(contextCaseId);
      addMessage({
        role: 'assistant',
        content: `### Legal Judgment Summary: ${res.title || contextLabel}\n\n${res.summary}`,
        timestamp: new Date(),
        isGrounded: true,
        sourceAttribution: 'CourtMind Document Intelligence',
        provider: res.provider,
        model: res.model,
      });
      setBackendStatus('connected');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to summarize document.';
      addMessage({
        role: 'assistant',
        content: `⚠️ Summarization Error: ${errMsg}`,
        timestamp: new Date(),
        isError: true,
      });
    } finally {
      setSummarizing(false);
      setLoading(false);
    }
  };

  // ── Dedicated PDF upload handler ───────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files (.pdf) are supported.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadStatusMsg('Sending PDF to FastAPI backend (/api/rag/upload)...');

    try {
      setUploadStatusMsg('Extracting text, chunking, and indexing into vector store...');
      const res: UploadResponse = await ragApi.uploadPdf(selectedFile);

      setUploadStatusMsg('Indexing completed successfully!');

      // Refresh document list so the new document appears immediately
      await loadIndexedDocuments();

      // Automatically switch context to the newly indexed document
      setContextCaseId(res.doc_id);

      addMessage({
        role: 'assistant',
        content: `📄 **Document Indexed Successfully!**\n\n**Title:** ${res.title || selectedFile.name}\n**Document ID:** \`${res.doc_id}\`\n**Chunks Indexed:** ${res.chunks_indexed}\n**Page Count:** ${res.page_count}\n\nYou can now ask specific questions or generate a structured summary for this judgment.`,
        timestamp: new Date(),
        isGrounded: true,
        sourceAttribution: 'Newly Indexed RAG Document',
      });

      // Reset modal
      setTimeout(() => {
        setSelectedFile(null);
        setShowUploadModal(false);
        setUploading(false);
        setUploadStatusMsg('');
      }, 800);
    } catch (err: unknown) {
      setUploading(false);
      const errMsg = err instanceof Error ? err.message : 'Upload and indexing failed.';
      setUploadError(errMsg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleSuggested = (s: string) => {
    setInput(s);
    textareaRef.current?.focus();
  };

  const suggestedQuestions = contextCaseId === 'all' ? SUGGESTED_GENERAL : SUGGESTED_DOCUMENT;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] lg:h-screen animate-fade-in" style={{ background: '#F5F0E7' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-4 flex items-center justify-between"
        style={{ background: '#FFFCF7', borderBottom: '1px solid #DED6C9' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#111111]">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#111111]">CourtMind AI Legal Assistant</h1>
            <p className="text-xs text-[#716B63]">Grounded legal question answering with page-level citations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Real Backend Status Badge */}
          {backendStatus === 'connected' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RAG Connected
            </span>
          ) : backendStatus === 'offline' ? (
            <button
              onClick={loadIndexedDocuments}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 transition-colors"
              title="Click to retry connection to FastAPI backend"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Backend Offline (Retry)
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Checking API...
            </span>
          )}

          {/* Active LLM Provider Badge */}
          {backendStatus === 'connected' && llmProvider && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F0E7] border border-[#DED6C9] text-[#111111]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              <span>Provider: <strong className="capitalize">{llmProvider}</strong></span>
              {llmModel && (
                <span className="text-[#716B63] font-mono text-[11px]">
                  ({llmModel})
                </span>
              )}
            </span>
          )}

          {/* New chat */}
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F0E7] border border-[#DED6C9] text-[#716B63] hover:text-[#111111] transition-colors"
              id="new-chat-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* ── Document context & dedicated upload bar ─────────────────────────── */}
      <div
        className="shrink-0 px-5 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: '1px solid #DED6C9', background: '#FFFCF7' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#716B63] uppercase tracking-wide whitespace-nowrap">Context:</span>

          {docsLoading ? (
            <div className="flex items-center gap-2 text-xs text-[#716B63]">
              <span className="w-3 h-3 border-2 border-[#DED6C9] border-t-[#111111] rounded-full animate-spin" />
              Loading indexed judgments...
            </div>
          ) : docsError && indexedDocs.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Backend offline.</span>
              <button onClick={loadIndexedDocuments} className="underline font-semibold flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowCaseSelect((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F0E7] border border-[#DED6C9] text-sm text-[#111111] font-semibold hover:border-[#111111] transition-colors"
                id="context-selector-btn"
              >
                <span className="max-w-[280px] truncate">
                  {contextLabel}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#716B63] shrink-0" />
              </button>

              {showCaseSelect && (
                <div
                  className="absolute top-full left-0 mt-1 w-84 rounded-xl border border-[#DED6C9] bg-white shadow-lg z-20 overflow-hidden max-h-72 overflow-y-auto"
                >
                  {/* General / All documents option */}
                  <button
                    onClick={() => { setContextCaseId('all'); setShowCaseSelect(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${contextCaseId === 'all' ? 'bg-[#F5F0E7] font-bold text-[#111111]' : 'text-[#716B63] hover:bg-[#F5F0E7]'}`}
                  >
                    <div className="font-semibold text-[#111111]">All Indexed Judgments</div>
                    <div className="text-[11px] text-[#716B63]">General Legal Question Mode</div>
                  </button>

                  {/* Indexed backend documents */}
                  {indexedDocs.length > 0 && (
                    <div className="px-3 py-1 bg-[#FAF8F5] border-y border-[#DED6C9] text-[10px] font-bold text-[#716B63] uppercase tracking-wider">
                      Indexed Judgments ({indexedDocs.length})
                    </div>
                  )}
                  {indexedDocs.map((doc) => (
                    <button
                      key={doc.doc_id}
                      onClick={() => { setContextCaseId(doc.doc_id); setShowCaseSelect(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${contextCaseId === doc.doc_id ? 'bg-[#F5F0E7] font-bold text-[#111111]' : 'text-[#716B63] hover:bg-[#F5F0E7]'}`}
                    >
                      <div className="truncate font-medium text-[#111111]">{doc.title || doc.doc_id}</div>
                      <div className="text-[11px] text-[#716B63]">
                        {doc.court || 'Court'} · {doc.year || 'N/A'} · {doc.chunks_indexed || 0} chunks
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summarize button for specific document */}
          {contextCaseId !== 'all' && (
            <button
              onClick={handleSummarize}
              disabled={summarizing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFFCF7] border border-[#DED6C9] text-[#111111] hover:bg-[#EDE8DF] transition-colors disabled:opacity-50"
              title="Generate structured 6-part summary for this judgment"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Summarize Judgment</span>
            </button>
          )}
        </div>

        {/* Dedicated RAG PDF Upload Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#111111] text-white hover:bg-[#333333] transition-colors shadow-sm"
            id="rag-upload-btn"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Upload RAG PDF</span>
          </button>
        </div>
      </div>

      {/* ── Conversation area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#FFFCF7] border border-[#DED6C9] mb-4 shadow-sm">
              <Bot className="w-7 h-7 text-[#716B63]" />
            </div>
            <p className="text-base font-bold text-[#111111] mb-1">
              Ask questions grounded in indexed court judgments.
            </p>
            <p className="text-sm text-[#716B63] max-w-md mb-2">
              Select an indexed judgment above for grounded answers with page-level citations, or switch to General Mode for broader statutory reference.
            </p>
            {backendStatus === 'offline' && (
              <p className="text-xs text-rose-700 max-w-sm mb-4 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200">
                ⚠️ FastAPI backend is offline. Start the backend on port 8000 to enable live Groq-powered legal Q&A.
              </p>
            )}

            <div className="flex flex-wrap gap-2 justify-center max-w-lg mt-4">
              {suggestedQuestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggested(s)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#716B63] bg-[#FFFCF7] border border-[#DED6C9] hover:border-[#111111] hover:text-[#111111] transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator statusText={loadingStatus} />}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-2 flex items-center justify-center"
        style={{ borderTop: '1px solid #DED6C9', background: '#FFFCF7' }}
      >
        <p className="text-[10px] text-[#716B63] text-center max-w-lg">
          CourtMind AI Assistant provides informational legal research support grounded in court records. It does not constitute formal legal representation.
        </p>
      </div>

      {/* ── Message composer ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 sm:px-6 py-4"
        style={{ background: '#FFFCF7', borderTop: '1px solid #DED6C9' }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl p-3"
          style={{ background: '#F5F0E7', border: '1px solid #DED6C9' }}
        >
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              contextCaseId === 'all'
                ? "Ask a general legal question... (Enter to send)"
                : `Ask a question about ${contextLabel}... (Enter to send)`
            }
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-[#111111] placeholder-[#B5ADA3] resize-none
                       focus:outline-none leading-relaxed py-0.5 max-h-36 overflow-y-auto"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            id="chat-send-btn"
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                       transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canSend ? '#111111' : '#DED6C9',
            }}
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[#B5ADA3] mt-1.5 text-right pr-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      {/* ── Dedicated CourtMind AI RAG PDF Upload Modal ────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#DED6C9] shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-[#DED6C9] flex items-center justify-between bg-[#FFFCF7]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#111111] text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111111]">Upload PDF for RAG</h3>
                  <p className="text-[11px] text-[#716B63]">Directly indexes document into vector store</p>
                </div>
              </div>
              <button
                onClick={() => { if (!uploading) setShowUploadModal(false); }}
                disabled={uploading}
                className="p-1.5 rounded-lg text-[#716B63] hover:text-[#111111] hover:bg-[#F5F0E7] transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />

              {/* Dropzone */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-[#DED6C9] hover:border-[#111111] bg-[#FFFCF7]'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-[#111111] truncate max-w-[260px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-[#716B63]">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to index
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-[#B5ADA3]" />
                    <div>
                      <p className="text-sm font-semibold text-[#111111]">
                        Click to select a court judgment PDF
                      </p>
                      <p className="text-xs text-[#716B63]">Maximum file size: 50 MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status or error */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploading && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{uploadStatusMsg || 'Processing document...'}</span>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-[#DED6C9] bg-[#FFFCF7] flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                disabled={uploading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#716B63] hover:text-[#111111] hover:bg-[#F5F0E7] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#111111] text-white hover:bg-[#333333] transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {uploading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Index PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AskDocumentsPage;
