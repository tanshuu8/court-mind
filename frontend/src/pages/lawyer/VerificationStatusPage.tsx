import React from "react";
import { CheckCircle2, Clock, ShieldCheck, Search } from "lucide-react";
import { PageHeader } from "../../components/common";

const STEPS = [
  { label: "Profile submitted",            detail: "Basic details and Bar Council number received.",  done: true,  active: false, icon: CheckCircle2 },
  { label: "Documents under review",       detail: "Admin is verifying your credentials.",            done: false, active: true,  icon: Clock        },
  { label: "Bar Council validated",        detail: "Cross-checking with State Bar Council database.", done: false, active: false, icon: ShieldCheck  },
  { label: "Profile verified & published", detail: "You appear in citizen search results.",           done: false, active: false, icon: Search       },
];

const VerificationStatusPage: React.FC = () => {
  const completedCount = STEPS.filter((s) => s.done).length;
  const progressPct    = (completedCount / STEPS.length) * 100;

  return (
    <div className="p-6 lg:p-8 max-w-2xl animate-fade-in">
      <PageHeader
        breadcrumb="Lawyer / Verification status"
        section="LAWYER WORKSPACE"
        title="Verification Status"
        subtitle="You appear in search results only after verification."
      />

      {/* Status Banner */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4"
        style={{ background: '#FEF9EE', border: '1px solid #FDE68A' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative"
          style={{ background: '#FEF9EE', border: '1px solid #FDE68A' }}
        >
          <span
            className="absolute inset-0 rounded-xl animate-ping opacity-20"
            style={{ border: '2px solid #F59E0B' }}
          />
          <div className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold mb-0.5" style={{ color: '#92400e' }}>Pending Review</p>
          <p className="text-xs leading-relaxed" style={{ color: '#92400e', opacity: 0.8 }}>
            An administrator will verify your Bar Council registration within 2–5 working days.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B5ADA3' }}>Overall Progress</p>
          <p className="text-xs font-bold" style={{ color: '#111111' }}>{completedCount} / {STEPS.length} steps</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#DED6C9' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%`, background: '#111111' }}
          />
        </div>
      </div>

      {/* Steps card */}
      <div
        className="rounded-2xl p-6 animate-slide-in-up"
        style={{ background: '#FFFCF7', border: '1px solid #DED6C9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      >
        <p className="text-sm font-bold mb-6" style={{ color: '#111111' }}>Verification Steps</p>
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const Icon   = step.icon;
            const isDone = step.done;
            const isActive = step.active && !step.done;

            const iconBg     = isDone   ? '#F0FDF4'   : isActive ? '#FEF9EE' : '#F5F0E7';
            const iconBorder = isDone   ? '#BBF7D0'   : isActive ? '#FDE68A' : '#DED6C9';
            const iconColor  = isDone   ? '#166534'   : isActive ? '#92400e' : '#B5ADA3';
            const labelColor = isDone   ? '#111111'   : isActive ? '#92400e' : '#B5ADA3';

            return (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute left-5 top-[52px] w-0.5 h-8 z-0"
                    style={{ background: isDone ? '#DED6C9' : '#F5F0E7' }}
                  />
                )}
                <div
                  className="flex items-center gap-4 py-3 relative z-10 animate-slide-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: labelColor }}>{step.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#B5ADA3' }}>{step.detail}</p>
                  </div>
                  {isDone && (
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-xl animate-badge-pop"
                      style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}
                    >
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-xl animate-pulse"
                      style={{ background: '#FEF9EE', color: '#92400e', border: '1px solid #FDE68A' }}
                    >
                      In Progress
                    </span>
                  )}
                  {!isDone && !isActive && (
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-xl"
                      style={{ background: '#F5F0E7', color: '#B5ADA3', border: '1px solid #DED6C9' }}
                    >
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusPage;
