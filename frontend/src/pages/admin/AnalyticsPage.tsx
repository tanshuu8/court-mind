import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, DemoNotice } from '../../components/common';
import {
  DEMO_CASE_STATUS_DATA,
  DEMO_RISK_DATA,
  DEMO_MONTHLY_FILINGS,
  DEMO_SHAP_FACTORS,
} from '../../utils/demoData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';


const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Aggregate statistics and platform usage overview.</p>
      </div>

      <DemoNotice message="All charts display demo data. Live analytics require the backend analytics API." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Case Status Distribution */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Case Status Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={DEMO_CASE_STATUS_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={3}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {DEMO_CASE_STATUS_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 16 }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Delay Risk Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Delay Risk Distribution (%)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={DEMO_RISK_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={3}
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {DEMO_RISK_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 16 }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Filings Trend */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Monthly Case Filings</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEMO_MONTHLY_FILINGS} barSize={32}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: '#1e293b' }}
              />
              <Bar dataKey="cases" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top SHAP Features */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-200">Top SHAP Delay Factors (Platform-Wide)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEMO_SHAP_FACTORS} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={160} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {DEMO_SHAP_FACTORS.map((entry, index) => (
                  <Cell key={index} fill={entry.impact === 'negative' ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
