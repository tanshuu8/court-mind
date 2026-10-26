import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, Alert, DemoNotice, Select } from '../../components/common';
import { DEMO_CASES, DEMO_SHAP_FACTORS } from '../../utils/demoData';
import { classNames } from '../../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

type RiskLevel = 'low' | 'medium' | 'high';

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; bar: string }> = {
  low: { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-700/50', bar: '#10b981' },
  medium: { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-700/50', bar: '#f59e0b' },
  high: { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-700/50', bar: '#ef4444' },
};

const DelayAnalysisPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState(DEMO_CASES[0].id);
  const [showAllFactors, setShowAllFactors] = useState(false);

  const caseOptions = DEMO_CASES.map((c) => ({ value: c.id, label: `${c.caseNumber} – ${c.title.slice(0, 40)}…` }));
  const currentCase = DEMO_CASES.find((c) => c.id === selectedCase) ?? DEMO_CASES[0];
  const risk: RiskLevel = currentCase.delayRisk ?? 'medium';
  const riskConfig = RISK_CONFIG[risk];

  const confidence = risk === 'high' ? 87 : risk === 'medium' ? 72 : 91;

  const chartData = DEMO_SHAP_FACTORS.map((f) => ({
    name: f.name,
    value: Math.abs(f.value),
    raw: f.value,
    impact: f.impact,
  }));

  const visibleFactors = showAllFactors ? DEMO_SHAP_FACTORS : DEMO_SHAP_FACTORS.slice(0, 4);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Delay Risk Prediction</h1>
        <p className="text-sm text-slate-400 mt-1">XGBoost + SHAP-based delay risk stratification for court cases.</p>
      </div>

      <DemoNotice message="Prediction model (Phase 2) is planned. Results shown are illustrative demo data only." />

      {/* Case Selector */}
      <Card className="p-5">
        <Select
          label="Select a Case to Analyse"
          id="delay-case-selector"
          options={caseOptions}
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
        />
      </Card>

      {/* Risk Result */}
      <Card className={classNames('p-6 border', riskConfig.bg, riskConfig.border)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 shrink-0 mx-auto sm:mx-0"
            style={{ borderColor: riskConfig.bar }}
          >
            <TrendingUp className="w-6 h-6 mb-1" style={{ color: riskConfig.bar }} />
            <p className={classNames('text-xl font-extrabold', riskConfig.color)}>{risk.toUpperCase()}</p>
            <p className="text-xs text-slate-400">RISK</p>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
              <AlertTriangle className={classNames('w-4 h-4', riskConfig.color)} />
              <span className={classNames('text-lg font-bold', riskConfig.color)}>{riskConfig.label}</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              {risk === 'high'
                ? 'This case shows multiple high-risk indicators. Significant delay is likely without intervention.'
                : risk === 'medium'
                ? 'Moderate delay risk detected. Some factors indicate procedural strain that may extend timelines.'
                : 'Low delay probability detected. Case is progressing within expected timelines.'}
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Model Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${confidence}%`, background: riskConfig.bar }} />
                  </div>
                  <span className="text-xs font-mono text-slate-300">{confidence}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Case</p>
                <p className="text-xs font-mono text-slate-300">{currentCase.caseNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SHAP Chart */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-1">SHAP Feature Attribution</h2>
        <p className="text-xs text-slate-500 mb-4">
          Each bar represents a feature's contribution to the delay risk prediction. Red bars increase risk; green bars reduce it.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" barSize={14}>
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: '#94a3b8' }}
              formatter={(value, _name, props) => [
                `${(props as { payload?: { impact: string } }).payload?.impact === 'negative' ? '+' : '-'}${(value as number).toFixed(2)} SHAP`,
                'Attribution',
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.impact === 'negative' ? '#ef4444' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Factor Cards */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Risk Factor Analysis</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {visibleFactors.map((f) => (
            <div key={f.name} className="flex items-start gap-4 px-5 py-4">
              <div className={classNames(
                'w-2 h-8 rounded-full shrink-0 mt-0.5',
                f.impact === 'negative' ? 'bg-red-500' : 'bg-emerald-500'
              )} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-200">{f.name}</p>
                  <span className={classNames(
                    'text-xs font-mono font-semibold',
                    f.impact === 'negative' ? 'text-red-400' : 'text-emerald-400'
                  )}>
                    {f.impact === 'negative' ? '+' : '-'}{Math.abs(f.value).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
        {DEMO_SHAP_FACTORS.length > 4 && (
          <div className="px-5 py-3 border-t border-slate-800">
            <button
              onClick={() => setShowAllFactors((v) => !v)}
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
              id="toggle-factors-btn"
            >
              {showAllFactors ? <><ChevronUp className="w-3 h-3" /> Show fewer</> : <><ChevronDown className="w-3 h-3" /> Show all {DEMO_SHAP_FACTORS.length} factors</>}
            </button>
          </div>
        )}
      </Card>

      <Alert variant="warning" icon={<Info className="w-4 h-4" />} title="Important Disclaimer">
        Delay predictions are generated by a machine learning model and are for informational purposes only.
        They do not constitute legal advice. Confidence scores reflect model calibration, not certainty.
        <strong className="block mt-1">CourtMind does not replace professional legal counsel.</strong>
      </Alert>
    </div>
  );
};

export default DelayAnalysisPage;
