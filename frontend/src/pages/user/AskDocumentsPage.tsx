import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, User, RotateCcw, Upload, ChevronDown } from 'lucide-react';
import { uploadStore, type UploadedCase } from '../../services/uploadStore';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

// ── Suggested questions ────────────────────────────────────────────────────────

const SUGGESTED = [
  'Summarise the main issue in my uploaded document.',
  'When is the next hearing date?',
  'Who are the parties in this case?',
  'What relief has been sought?',
];

// ── Demo mode response ─────────────────────────────────────────────────────────
// Returns a clearly-labelled demo reply. Never invents legal details.

function getDemoReply(question: string, contextDoc: UploadedCase | null): string {
  const docName = contextDoc ? `"${contextDoc.fileName}"` : 'your uploaded document';
  return (
    `[Demo Mode — RAG service not connected]\n\n` +
    `You asked: "${question}"\n\n` +
    `Context document: ${docName}\n\n` +
    `To get a genuine answer, the CourtMind backend RAG pipeline must be connected and the document must be processed. ` +
    `Once the backend is available, this assistant will query it and return the actual extracted answer with source references.\n\n` +
    `⚠️ This is a demo placeholder. No legal analysis has been performed on your document.`
  );
}

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
          : { background: '#F5F0E7', border: '1px solid #DED6C9' }
        }
      >
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-[#111111]" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
          style={isUser ? {
            background: '#111111',
            color: '#F5F0E7',
            borderRadius: '18px 4px 18px 18px',
          } : {
            background: '#FFFCF7',
            color: '#111111',
            border: '1px solid #DED6C9',
            borderRadius: '4px 18px 18px 18px',
          }}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-[#B5ADA3] px-1">{time}</span>
      </div>
    </div>
  );
};

// ── Typing indicator ───────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div className="flex gap-3 animate-fade-in">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#F5F0E7] border border-[#DED6C9]">
      <Bot className="w-4 h-4 text-[#111111]" />
    </div>
    <div
      className="px-4 py-3 rounded-2xl bg-[#FFFCF7] border border-[#DED6C9]"
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
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const AskDocumentsPage: React.FC = () => {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [uploadedCases, setUploadedCases] = useState<UploadedCase[]>([]);
  const [contextCaseId, setContextCaseId] = useState<string>('all');
  const [showCaseSelect, setShowCaseSelect] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load uploaded cases
  const refreshCases = useCallback(() => { setUploadedCases(uploadStore.getAll()); }, []);
  useEffect(() => { refreshCases(); return uploadStore.onChange(refreshCases); }, [refreshCases]);

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

  const contextDoc = uploadedCases.find((c) => c.id === contextCaseId) ?? null;

  const canSend = input.trim().length > 0 && !loading;

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), ...msg }]);
  };

  const handleSend = async () => {
    if (!canSend) return;
    const question = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    addMessage({ role: 'user', content: question, timestamp: new Date() });
    setLoading(true);

    // Simulate network delay (demo mode)
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

    const reply = getDemoReply(question, contextDoc);
    addMessage({ role: 'assistant', content: reply, timestamp: new Date() });
    setLoading(false);
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
            <h1 className="text-sm font-bold text-[#111111]">CourtMind AI Assistant</h1>
            <p className="text-xs text-[#716B63]">Ask questions about your uploaded court documents</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Demo mode badge */}
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Demo mode — RAG not connected
          </span>

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

      {/* ── Document context selector ──────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid #DED6C9', background: '#FFFCF7' }}
      >
        <span className="text-xs font-bold text-[#716B63] uppercase tracking-wide whitespace-nowrap">Context:</span>

        {uploadedCases.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-[#B5ADA3]">
            No uploaded documents.
            <Link to="/user/upload" className="font-semibold text-[#111111] underline underline-offset-2">
              Upload a document
            </Link>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowCaseSelect((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F0E7] border border-[#DED6C9] text-sm text-[#111111] font-semibold hover:border-[#111111] transition-colors"
              id="context-selector-btn"
            >
              <span className="max-w-[200px] truncate">
                {contextCaseId === 'all' ? 'All uploaded documents' : (contextDoc?.fileName ?? 'Select document')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#716B63] shrink-0" />
            </button>

            {showCaseSelect && (
              <div
                className="absolute top-full left-0 mt-1 w-72 rounded-xl border border-[#DED6C9] bg-white shadow-lg z-20 overflow-hidden"
              >
                <button
                  onClick={() => { setContextCaseId('all'); setShowCaseSelect(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${contextCaseId === 'all' ? 'bg-[#F5F0E7] font-bold text-[#111111]' : 'text-[#716B63] hover:bg-[#F5F0E7]'}`}
                >
                  All uploaded documents
                </button>
                {uploadedCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setContextCaseId(c.id); setShowCaseSelect(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm truncate transition-colors ${contextCaseId === c.id ? 'bg-[#F5F0E7] font-bold text-[#111111]' : 'text-[#716B63] hover:bg-[#F5F0E7]'}`}
                  >
                    {c.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Conversation area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#FFFCF7] border border-[#DED6C9] mb-4">
              <Bot className="w-7 h-7 text-[#B5ADA3]" />
            </div>
            <p className="text-base font-bold text-[#111111] mb-1">
              Ask me about your uploaded court documents.
            </p>
            <p className="text-sm text-[#716B63] max-w-sm mb-2">
              {uploadedCases.length === 0
                ? 'Upload a court document first, then ask questions about it here.'
                : 'Select a document above and start asking questions.'
              }
            </p>
            <p className="text-xs text-[#B5ADA3] max-w-sm mb-8 px-4 py-2 rounded-xl bg-[#FFFCF7] border border-[#DED6C9]">
              ⚠️ Demo mode — answers are placeholders until the RAG backend is connected.
              This assistant does not replace advice from a qualified lawyer.
            </p>

            {uploadedCases.length === 0 ? (
              <Link to="/user/upload">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-semibold hover:bg-[#333] transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload a Document
                </button>
              </Link>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggested(s)}
                    className="px-3.5 py-2 rounded-xl text-sm text-[#716B63] bg-[#FFFCF7] border border-[#DED6C9] hover:border-[#111111] hover:text-[#111111] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-2 flex items-center justify-center"
        style={{ borderTop: '1px solid #DED6C9', background: '#FFFCF7' }}
      >
        <p className="text-[10px] text-[#B5ADA3] text-center max-w-lg">
          CourtMind AI Assistant provides informational support only and does not constitute legal advice.
          Consult a qualified lawyer for decisions about your case.
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
            placeholder="Ask a question about your court documents… (Enter to send, Shift+Enter for new line)"
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
    </div>
  );
};

export default AskDocumentsPage;
