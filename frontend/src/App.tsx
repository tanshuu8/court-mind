import React, { useEffect, useState } from 'react';
import { Scale, Activity, BrainCircuit, FileSearch, ShieldCheck, Database } from 'lucide-react';

interface BackendHealth {
  status: string;
  service: string;
  timestamp?: string;
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to backend');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">CourtMind</span>
              <span className="ml-2 text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950 border border-sky-800/60 text-sky-300 font-mono">
                v0.1.0-alpha
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Core Foundation</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>B.Tech Major Project • Research & Development</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            Court<span className="text-sky-400">Mind</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            AI-Based Court Case Delay Intelligence & Legal Document Analysis
          </p>

          <div className="pt-2">
            <div className="inline-block p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm">
              <span className="text-slate-400">Status: </span>
              <span className="font-semibold text-emerald-400">Project foundation initialized.</span>
            </div>
          </div>
        </div>

        {/* System Pillars Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center space-x-3 mb-2">
              <BrainCircuit className="w-5 h-5 text-sky-400" />
              <h3 className="font-semibold text-slate-200">Delay Intelligence</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              XGBoost risk classification & SHAP explainability for hearing timeline factors (Planned).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center space-x-3 mb-2">
              <FileSearch className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-200">Legal Document RAG</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chunking, vector embeddings, grounded legal summarization and Q&A (Planned).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center space-x-3 mb-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-slate-200">Core Architecture</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              FastAPI backend, PostgreSQL + pgvector, and modular Python pipelines.
            </p>
          </div>
        </div>

        {/* Backend API Connectivity Indicator */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-sm">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300">FastAPI Backend Status:</span>
            {loading ? (
              <span className="text-xs text-slate-400 animate-pulse">Checking /api/health...</span>
            ) : health ? (
              <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                {health.status} ({health.service})
              </span>
            ) : (
              <span className="text-xs font-mono bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded">
                Offline ({error || 'Backend not running'})
              </span>
            )}
          </div>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Recheck API
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        CourtMind • AI-Based Court Case Delay Intelligence & Legal Document Analysis System
      </footer>
    </div>
  );
};

export default App;
