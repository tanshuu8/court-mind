import React, { useState } from 'react';
import { User, MapPin, FileText, Save, CheckCircle } from 'lucide-react';
import { DEMO_LAWYERS } from '../../utils/demoData';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, Button, Alert } from '../../components/common';

const SPECIALIZATION_OPTIONS = [
  '[Select]', 'Civil Law', 'Criminal Law', 'Family Law', 'Labour Law',
  'Corporate Law', 'Consumer Law', 'Environmental Law', 'Property Law',
];

const AVAILABILITY_TAGS = [
  { label: 'Online',    icon: '🌐', active: true  },
  { label: 'In person', icon: '🏢', active: true  },
  { label: 'Weekdays',  icon: '📅', active: false },
];

const LawyerProfileEditPage: React.FC = () => {
  const { user } = useAuth();
  const profile = DEMO_LAWYERS.find((l) => l.userId === user?.id) ?? DEMO_LAWYERS[0];

  const [name, setName]               = useState(profile.name);
  const [spec, setSpec]               = useState(profile.specializations[0] ?? '');
  const [location, setLocation]       = useState(profile.location);
  const [bio, setBio]                 = useState(profile.bio ?? '');
  const [preferredMode, setMode]      = useState('[Online]');
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle: React.CSSProperties = { background: '#F5F0E7', border: '1px solid #DED6C9', color: '#111111' };
  const inputClass = 'w-full rounded-xl text-sm px-4 py-3 placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all';
  const labelCls = 'block text-xs font-bold uppercase tracking-wide mb-1.5';

  return (
    <div className="p-6 lg:p-8 max-w-5xl animate-fade-in">
      <PageHeader
        breadcrumb="Lawyer / Profile & availability"
        section="LAWYER WORKSPACE"
        title="Profile & Availability"
        subtitle="What clients see before requesting a consultation."
      />

      {saved && (
        <Alert variant="success" className="mb-5">
          <span className="font-semibold">Changes saved!</span> Profile updated. (Demo — not persisted to backend.)
        </Alert>
      )}

      <form onSubmit={handleSave} id="lawyer-profile-form">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Profile card ───────────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-6 animate-slide-in-up"
            style={{ background: '#FFFCF7', border: '1px solid #DED6C9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            {/* Avatar preview */}
            <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid #F5F0E7' }}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: '#111111', color: '#F5F0E7' }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#111111' }}>{name || 'Your Name'}</p>
                <p className="text-xs mt-0.5" style={{ color: '#B5ADA3' }}>
                  {spec || 'Specialization'} · {location || 'Location'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <User className="w-3.5 h-3.5" style={{ color: '#B5ADA3' }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B5ADA3' }}>Profile Details</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="lp-name" className={labelCls} style={{ color: '#716B63' }}>Full Name</label>
                <input id="lp-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>

              <div>
                <label htmlFor="lp-spec" className={labelCls} style={{ color: '#716B63' }}>Specialization</label>
                <select
                  id="lp-spec"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {SPECIALIZATION_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="lp-location" className={labelCls} style={{ color: '#716B63' }}>Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#B5ADA3' }} />
                  <input
                    id="lp-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`${inputClass} pl-9`}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lp-bio" className={labelCls} style={{ color: '#716B63' }}>Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-3.5 h-3.5 pointer-events-none" style={{ color: '#B5ADA3' }} />
                  <textarea
                    id="lp-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell clients about your expertise..."
                    className={`${inputClass} pl-9 resize-y`}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Availability card ───────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-6 animate-slide-in-up h-fit"
            style={{ background: '#FFFCF7', border: '1px solid #DED6C9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#B5ADA3' }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B5ADA3' }}>Availability</p>
            </div>

            {/* Tag toggles */}
            <div className="flex flex-wrap gap-2 mb-5">
              {AVAILABILITY_TAGS.map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={tag.active
                    ? { background: '#111111', color: '#F5F0E7', border: '1px solid #111111' }
                    : { background: '#F5F0E7', color: '#B5ADA3', border: '1px solid #DED6C9' }}
                >
                  <span>{tag.icon}</span>
                  {tag.label}
                </span>
              ))}
            </div>

            <div className="mb-5">
              <label htmlFor="lp-mode" className={labelCls} style={{ color: '#716B63' }}>Preferred Mode</label>
              <select
                id="lp-mode"
                value={preferredMode}
                onChange={(e) => setMode(e.target.value)}
                className={inputClass}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option>[Online]</option>
                <option>[In person]</option>
                <option>[Both]</option>
              </select>
            </div>

            {/* Stats preview */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Enrolment No.', value: profile.barCouncilNumber ?? '—' },
                { label: 'Experience',    value: `${profile.experience} yrs` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-3"
                  style={{ background: '#F5F0E7', border: '1px solid #DED6C9' }}
                >
                  <p className="text-xs mb-0.5" style={{ color: '#B5ADA3' }}>{item.label}</p>
                  <p className="text-sm font-bold" style={{ color: '#111111' }}>{item.value}</p>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              id="save-lawyer-profile-btn"
              className="w-full"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LawyerProfileEditPage;
