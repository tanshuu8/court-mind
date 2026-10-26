import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Scale, TrendingUp, Shield, MessageSquare, BarChart2 } from 'lucide-react';
import { DEMO_ADMIN_STATS, DEMO_MONTHLY_FILINGS, DEMO_AUDIT_LOGS } from '../../utils/demoData';
import { PageHeader, StatsCard } from '../../components/common';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const s = DEMO_ADMIN_STATS;

  return (
    <div className="p-6 lg:p-8 max-w-6xl animate-fade-in">
      <PageHeader
        breadcrumb="Admin / Dashboard"
        section="ADMIN WORKSPACE"
        title="Dashboard"
        subtitle="Platform overview and management tools."
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger-children">
        <StatsCard label="Pending Review"   value={s.pendingVerifications} icon={<Shield className="w-4 h-4" />}    accentClass="text-amber-400" />
        <StatsCard label="Approved Lawyers" value={s.totalLawyers}          icon={<Scale className="w-4 h-4" />}    accentClass="text-emerald-400" />
        <StatsCard label="Total Users"      value={s.totalUsers.toLocaleString()} icon={<Users className="w-4 h-4" />}  accentClass="text-sky-400" />
        <StatsCard label="Total Cases"      value={s.totalCases.toLocaleString()} icon={<BarChart2 className="w-4 h-4" />} accentClass="text-indigo-400" />
        <StatsCard label="This Month"       value={s.casesThisMonth}        icon={<TrendingUp className="w-4 h-4" />} accentClass="text-purple-400" trend={{ value: '+12% vs last month', up: true }} />
        <StatsCard label="Consultations"    value={s.activeConsultations}   icon={<MessageSquare className="w-4 h-4" />} accentClass="text-teal-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Bar chart */}
        <div className="rounded-2xl p-5 animate-slide-in-up"
          style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
          <p className="text-sm font-semibold text-slate-200 mb-4">Monthly Filings</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DEMO_MONTHLY_FILINGS} barSize={24}>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, fontSize: 12 }}
                itemStyle={{ color: '#94a3b8' }} cursor={{ fill: 'rgba(99,102,241,0.08)' }}
              />
              <Bar dataKey="cases" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Audit logs */}
        <div className="rounded-2xl overflow-hidden animate-slide-in-up"
          style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold text-slate-200">Recent Audit Logs</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {DEMO_AUDIT_LOGS.slice(0, 4).map((log) => (
              <div key={log.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <p className="text-sm text-slate-300 font-medium">{log.action}</p>
                  <p className="text-xs text-slate-600 shrink-0">{log.userName}</p>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {[
          { to: '/admin/users',               label: 'User Management',    icon: '👥', color: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.25)'  },
          { to: '/admin/lawyer-verification', label: 'Lawyer Verification',icon: '✅', color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)'  },
          { to: '/admin/feedback',            label: 'Feedback & Issues',  icon: '💬', color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)'  },
          { to: '/admin/analytics',           label: 'Analytics',          icon: '📊', color: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)'  },
        ].map((item) => (
          <Link key={item.to} to={item.to}
            className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-slide-in-up group"
            style={{ background: item.color, border: `1px solid ${item.border}`, backdropFilter: 'blur(12px)' }}>
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
            <p className="text-xs font-semibold text-slate-300">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
