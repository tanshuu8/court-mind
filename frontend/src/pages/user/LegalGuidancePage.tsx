import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, ExternalLink } from 'lucide-react';
import { PageHeader, Button } from '../../components/common';

interface GuidanceOption {
  title: string;
  explanation: string;
  act: string;
  icon: string;
}

const DEMO_OPTIONS: GuidanceOption[] = [
  {
    title: 'File for Expedited Hearing',
    explanation: 'You may apply for an expedited hearing on grounds of urgency or irreparable harm to the petitioner.',
    act: 'CPC Order XVII',
    icon: '⚡',
  },
  {
    title: 'Seek Condonation of Delay',
    explanation: 'If the appeal or application period has lapsed, apply for condonation of delay by demonstrating sufficient cause.',
    act: 'Limitation Act, S.5',
    icon: '⏳',
  },
  {
    title: 'File Interlocutory Application',
    explanation: 'An IA can be filed at any stage of the proceedings to seek interim relief or address a procedural matter urgently.',
    act: 'CPC Order XXXIX',
    icon: '📋',
  },
];

const LegalGuidancePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<GuidanceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleGetGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setOptions(DEMO_OPTIONS);
    setHasSearched(true);
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl animate-fade-in">
      <PageHeader
        breadcrumb="Citizen / Legal guidance"
        section="CITIZEN WORKSPACE"
        title="Legal Guidance"
        subtitle="AI-powered options from verified legal sources. Not a substitute for a lawyer."
      />

      {/* Search */}
      <form onSubmit={handleGetGuidance} className="flex gap-3 mb-7">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="guidance-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your legal situation..."
            className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
            style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
          />
        </div>
        <Button type="submit" variant="primary" isLoading={loading} id="get-guidance-btn"
          leftIcon={<Sparkles className="w-4 h-4" />}>
          Get Guidance
        </Button>
      </form>

      {/* Results */}
      {hasSearched && options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 stagger-children">
          {options.map((opt, i) => (
            <div key={i}
              className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/20 animate-slide-in-up group"
              style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 transition-transform group-hover:scale-110 duration-200"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                {opt.icon}
              </div>

              <p className="text-sm font-bold text-white mb-2">{opt.title}</p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{opt.explanation}</p>

              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                  ✓ Verified source
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                  <ExternalLink className="w-2.5 h-2.5" />
                  {opt.act}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state prompt */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            🔍
          </div>
          <p className="text-sm font-medium text-slate-400">Describe your situation above to get AI-powered legal options.</p>
          <p className="text-xs text-slate-600 mt-1">Based on verified Indian legal sources.</p>
        </div>
      )}

      {/* Professional opinion CTA */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' }}>
        <div>
          <p className="text-sm font-bold text-white">Want a professional opinion?</p>
          <p className="text-xs text-slate-400 mt-0.5">Connect with Bar Council verified lawyers near you.</p>
        </div>
        <Link to="/user/lawyers">
          <Button variant="outline" id="legal-guidance-find-lawyer">Find Lawyer</Button>
        </Link>
      </div>
    </div>
  );
};

export default LegalGuidancePage;
