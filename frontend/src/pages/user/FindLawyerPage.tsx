import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, CheckCircle2, Send, X,
  Briefcase, Clock, Languages, SlidersHorizontal,
  User, ChevronRight,
} from 'lucide-react';
import { DEMO_LAWYERS } from '../../utils/demoData';
import { PageHeader, Button, DemoNotice } from '../../components/common';
import type { Lawyer } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  { value: 'any', label: 'All Specializations' },
  { value: 'Civil Law',         label: 'Civil Law' },
  { value: 'Criminal Law',      label: 'Criminal Law' },
  { value: 'Family Law',        label: 'Family Law' },
  { value: 'Labour Law',        label: 'Labour Law' },
  { value: 'Corporate Law',     label: 'Corporate Law' },
  { value: 'Consumer Law',      label: 'Consumer Law' },
  { value: 'Environmental Law', label: 'Environmental Law' },
  { value: 'Property Law',      label: 'Property Law' },
];

const inputCls =
  'w-full rounded-xl bg-white border border-[#DED6C9] text-sm text-[#111111] py-2.5 px-4 ' +
  'placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all';

const labelCls = 'block text-xs font-bold uppercase tracking-wide text-[#716B63] mb-1.5';

// ── Initials avatar ───────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const dims = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
  return (
    <div
      className={`${dims[size]} rounded-2xl flex items-center justify-center font-extrabold shrink-0`}
      style={{ background: '#111111', color: '#F5F0E7' }}
    >
      {initials}
    </div>
  );
};

// ── Consultation drawer ───────────────────────────────────────────────────────

const ConsultDrawer: React.FC<{ lawyer: Lawyer; onClose: () => void }> = ({ lawyer, onClose }) => {
  const [msg, setMsg]         = useState('');
  const [share, setShare]     = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 animate-slide-in-up"
        style={{ background: '#FFFCF7', border: '1px solid #DED6C9' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-[#111111]">Request Consultation</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#B5ADA3] hover:text-[#111111] hover:bg-[#F5F0E7] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#F5F0E7] border border-[#DED6C9]">
          <Avatar name={lawyer.name} size="sm" />
          <div>
            <p className="text-sm font-bold text-[#111111]">{lawyer.name}</p>
            <p className="text-xs text-[#716B63]">{lawyer.specializations[0]} · {lawyer.location}</p>
          </div>
        </div>

        {sent ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <div>
              <p className="font-bold">Request sent</p>
              <p className="text-xs mt-0.5 text-green-700">Demo mode — no actual request was submitted to any server.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="consult-msg">Describe your situation</label>
              <textarea
                id="consult-msg"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Briefly describe your legal issue..."
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={share}
                onChange={(e) => setShare(e.target.checked)}
                className="w-4 h-4 rounded border-[#DED6C9] accent-black"
              />
              <span className="text-sm text-[#716B63]">Share my uploaded case summary with this lawyer</span>
            </label>
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={sending}
                disabled={!msg.trim()}
                id="send-consult-request"
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Send Request
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#716B63] border border-[#DED6C9] hover:border-[#111111] hover:text-[#111111] transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Lawyer card ───────────────────────────────────────────────────────────────

const LawyerCard: React.FC<{ lawyer: Lawyer; onConsult: () => void }> = ({ lawyer, onConsult }) => (
  <div
    className="bg-white rounded-2xl border border-[#DED6C9] p-5 flex flex-col gap-4
               transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
  >
    {/* Header */}
    <div className="flex items-start gap-3">
      <Avatar name={lawyer.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-[#111111] truncate">{lawyer.name}</p>
          {lawyer.verificationStatus === 'approved' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 border border-green-200 text-green-700 shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
            </span>
          )}
        </div>
        <p className="text-xs text-[#716B63] mt-0.5 truncate">{lawyer.specializations[0]}</p>
      </div>
    </div>

    {/* Bio */}
    {lawyer.bio && (
      <p className="text-xs text-[#716B63] leading-relaxed line-clamp-2">{lawyer.bio}</p>
    )}

    {/* Meta */}
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      <span className="flex items-center gap-1.5 text-xs text-[#B5ADA3]">
        <MapPin className="w-3 h-3" />
        {lawyer.location}
      </span>
      {lawyer.experience != null && (
        <span className="flex items-center gap-1.5 text-xs text-[#B5ADA3]">
          <Clock className="w-3 h-3" />
          {lawyer.experience} yrs exp.
        </span>
      )}
      {(lawyer as Lawyer & { languages?: string[] }).languages?.length ? (
        <span className="flex items-center gap-1.5 text-xs text-[#B5ADA3]">
          <Languages className="w-3 h-3" />
          {(lawyer as Lawyer & { languages?: string[] }).languages!.join(', ')}
        </span>
      ) : null}
      <span className="flex items-center gap-1.5 text-xs text-[#B5ADA3]">
        <Briefcase className="w-3 h-3" />
        {lawyer.availability ? 'Available' : 'Unavailable'}
      </span>
    </div>

    {/* Specialization pills */}
    <div className="flex flex-wrap gap-1.5">
      {lawyer.specializations.map((s) => (
        <span key={s} className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#F5F0E7] text-[#716B63] border border-[#DED6C9]">
          {s}
        </span>
      ))}
    </div>

    {/* Actions */}
    <div className="flex gap-2 mt-auto">
      <Link to={`/user/lawyers/${lawyer.id}`} className="flex-1">
        <button
          id={`view-profile-${lawyer.id}`}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                     bg-[#F5F0E7] border border-[#DED6C9] text-[#111111] hover:border-[#111111] transition-all"
        >
          <User className="w-3.5 h-3.5" />
          View Profile
          <ChevronRight className="w-3.5 h-3.5 text-[#B5ADA3]" />
        </button>
      </Link>
      <Button
        variant="primary"
        size="sm"
        id={`consult-${lawyer.id}`}
        onClick={onConsult}
        leftIcon={<Send className="w-3 h-3" />}
        className="flex-1"
      >
        Consult
      </Button>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const FindLawyerPage: React.FC = () => {
  const [search, setSearch]           = useState('');
  const [spec, setSpec]               = useState('any');
  const [locationInput, setLocation]  = useState('');
  const [avail, setAvail]             = useState('any');
  const [showFilters, setShowFilters] = useState(false);
  const [consultTarget, setConsultTarget] = useState<Lawyer | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DEMO_LAWYERS.filter((l) => {
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.specializations.some((s) => s.toLowerCase().includes(q)) || l.location.toLowerCase().includes(q);
      const matchSpec   = spec === 'any' || l.specializations.includes(spec);
      const matchLoc    = !locationInput || l.location.toLowerCase().includes(locationInput.toLowerCase());
      const matchAvail  = avail === 'any' || (avail === 'available' ? l.availability : !l.availability);
      return matchSearch && matchSpec && matchLoc && matchAvail;
    });
  }, [search, spec, locationInput, avail]);

  const hasFilter = search || spec !== 'any' || locationInput || avail !== 'any';
  const clearAll  = () => { setSearch(''); setSpec('any'); setLocation(''); setAvail('any'); };

  return (
    <div className="p-6 lg:p-8 max-w-6xl animate-fade-in">
      <PageHeader
        breadcrumb="Citizen / Find lawyer"
        section="CITIZEN WORKSPACE"
        title="Find a Lawyer"
        subtitle="Discover legal professionals based on your case requirements."
      />

      <DemoNotice message="Sample lawyer profiles shown for demonstration. No real credentials, availability, or ratings are verified." />

      {/* Search row */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B5ADA3] pointer-events-none" />
          <input
            id="lawyer-search"
            type="text"
            placeholder="Search by name, specialization, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-10`}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5ADA3] hover:text-[#111111]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((o) => !o)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all
                      ${showFilters ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#111111] border-[#DED6C9] hover:border-[#111111]'}`}
          id="lawyer-filter-toggle"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilter && <span className="w-2 h-2 rounded-full bg-white/80 shrink-0" />}
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-[#DED6C9] p-4 mb-5 animate-slide-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls} htmlFor="lawyer-spec-filter">Specialization</label>
              <select id="lawyer-spec-filter" value={spec} onChange={(e) => setSpec(e.target.value)} className={inputCls}>
                {SPECIALIZATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="lawyer-location-filter">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B5ADA3] pointer-events-none" />
                <input
                  id="lawyer-location-filter"
                  type="text"
                  placeholder="City or district…"
                  value={locationInput}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="lawyer-avail-filter">Availability</label>
              <select id="lawyer-avail-filter" value={avail} onChange={(e) => setAvail(e.target.value)} className={inputCls}>
                <option value="any">Any</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
          {hasFilter && (
            <button onClick={clearAll} className="mt-3 text-xs font-semibold text-[#111111] underline underline-offset-2">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-[#716B63] mb-4 font-semibold">
        {filtered.length} lawyer{filtered.length !== 1 ? 's' : ''} found
        {hasFilter && ' · filtered'}
      </p>

      {/* Grid / empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DED6C9] py-20 flex flex-col items-center text-center px-6">
          <Search className="w-8 h-8 text-[#DED6C9] mb-3" />
          <p className="text-sm font-bold text-[#111111] mb-1">No lawyers match your filters</p>
          <p className="text-xs text-[#716B63] mb-4">Try adjusting your search or clearing the filters.</p>
          <button onClick={clearAll} className="text-sm font-semibold text-[#111111] underline underline-offset-2">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lawyer) => (
            <LawyerCard
              key={lawyer.id}
              lawyer={lawyer}
              onConsult={() => setConsultTarget(lawyer)}
            />
          ))}
        </div>
      )}

      {/* Consultation drawer */}
      {consultTarget && (
        <ConsultDrawer lawyer={consultTarget} onClose={() => setConsultTarget(null)} />
      )}
    </div>
  );
};

export default FindLawyerPage;
