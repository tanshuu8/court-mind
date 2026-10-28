import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, TrendingUp, MessageSquare, Users, AlertTriangle, ChevronRight,
  Clock, Scale,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  Card, StatsCard, DemoNotice,
} from '../../components/common';
import {
  DEMO_CASES, DEMO_CASE_STATUS_DATA, DEMO_RISK_DATA, DEMO_MONTHLY_FILINGS,
} from '../../utils/demoData';
import { getCaseStatusColor, getCaseStatusLabel, getDelayRiskColor, formatDate } from '../../utils/helpers';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const recentCases = DEMO_CASES.slice(0, 4);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Welcome back, {user?.name?.split(' ')[0] ?? 'User'} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here's your case activity at a glance.</p>
        </div>
        <Link
          to="/user/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <FolderOpen className="w-4 h-4" />
          Upload New Document
        </Link>
      </div>

      <DemoNotice />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Cases" value="6" icon={<Scale className="w-4 h-4" />} trend={{ value: '+2 this month', up: true }} accentClass="text-sky-400" />
        <StatsCard label="Active Cases" value="3" icon={<FolderOpen className="w-4 h-4" />} accentClass="text-teal-400" />
        <StatsCard label="High Risk" value="2" icon={<AlertTriangle className="w-4 h-4" />} accentClass="text-red-400" />
        <StatsCard label="Next Hearing" value="Nov 12" icon={<Clock className="w-4 h-4" />} accentClass="text-amber-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Case Status Pie */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Case Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={DEMO_CASE_STATUS_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {DEMO_CASE_STATUS_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {DEMO_CASE_STATUS_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.fill }} />
                {item.name}
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Delay Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={DEMO_RISK_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {DEMO_RISK_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {DEMO_RISK_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.fill }} />
                  {item.name}
                </div>
                <span className="font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Filings Bar */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Monthly Case Filings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DEMO_MONTHLY_FILINGS} barSize={24}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: '#94a3b8' }} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="cases" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200">Recent Cases</h3>
          <Link to="/user/cases" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-800">
          {recentCases.map((c) => (
            <Link
              key={c.id}
              to={`/user/cases/${c.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors gap-3 sm:gap-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.caseNumber} · {c.court}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getCaseStatusColor(c.status)}`}>
                  {getCaseStatusLabel(c.status)}
                </span>
                {c.delayRisk && (
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getDelayRiskColor(c.delayRisk)}`}>
                    {c.delayRisk.charAt(0).toUpperCase() + c.delayRisk.slice(1)} Risk
                  </span>
                )}
                {c.nextHearing && (
                  <span className="text-xs text-slate-500 hidden sm:block">
                    {formatDate(c.nextHearing)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/user/delay-analysis', icon: <TrendingUp className="w-5 h-5" />, label: 'Delay Prediction', color: 'text-amber-400' },
          { to: '/user/legal-guidance', icon: <MessageSquare className="w-5 h-5" />, label: 'Legal Guidance', color: 'text-indigo-400' },
          { to: '/user/lawyers', icon: <Users className="w-5 h-5" />, label: 'Find Lawyer', color: 'text-teal-400' },
          { to: '/user/upload', icon: <FolderOpen className="w-5 h-5" />, label: 'Upload Doc', color: 'text-sky-400' },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <Card hoverable className="p-4 text-center">
              <span className={`${item.color} flex justify-center mb-2`}>{item.icon}</span>
              <p className="text-xs font-medium text-slate-300">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;
