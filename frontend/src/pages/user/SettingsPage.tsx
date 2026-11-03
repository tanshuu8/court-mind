import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Bell, Lock, Accessibility,
  Save, RotateCcw, CheckCircle2, LogOut, Shield,
} from 'lucide-react';
import { PageHeader, Button, Alert, DemoNotice } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AppSettings {
  language:        string;
  timezone:        string;
  dateFormat:      string;
  // Notifications
  notifHearing:    boolean;
  notifCase:       boolean;
  notifAnalysis:   boolean;
  notifConsult:    boolean;
  notifEmail:      boolean;
  // Accessibility
  reducedMotion:   boolean;
  largerText:      boolean;
}

const DEFAULTS: AppSettings = {
  language:      'English',
  timezone:      'Asia/Kolkata',
  dateFormat:    'DD MMM YYYY',
  notifHearing:  true,
  notifCase:     true,
  notifAnalysis: false,
  notifConsult:  true,
  notifEmail:    false,
  reducedMotion: false,
  largerText:    false,
};

const STORAGE_KEY = 'cm_app_settings';

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Shared input style ─────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl bg-white border border-[#DED6C9] text-sm text-[#111111] py-2.5 px-4 ' +
  'focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all';

const labelCls = 'block text-xs font-bold uppercase tracking-wide text-[#716B63] mb-1.5';

// ── Section wrapper ────────────────────────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="bg-white rounded-2xl border border-[#DED6C9] overflow-hidden">
    <div className="px-5 py-4 border-b border-[#DED6C9] flex items-start gap-3">
      <div className="text-[#716B63] mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-bold text-[#111111]">{title}</p>
        {description && <p className="text-xs text-[#716B63] mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ── Toggle ─────────────────────────────────────────────────────────────────────

const Toggle: React.FC<{
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ id, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#F0EAE0] last:border-0">
    <div className="flex-1 min-w-0 pr-4">
      <p className="text-sm font-semibold text-[#111111]">{label}</p>
      {description && <p className="text-xs text-[#716B63] mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      style={{ background: checked ? '#111111' : '#DED6C9' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [saved, setSaved]       = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Apply reduced-motion to root
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--motion-reduce', settings.reducedMotion ? 'none' : ''
    );
  }, [settings.reducedMotion]);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    setSettings({ ...DEFAULTS });
    saveSettings({ ...DEFAULTS });
    setSaved(false);
    setResetConfirm(false);
  };

  const handleSignOut = () => { logout(); navigate('/login'); };

  return (
    <div className="p-6 lg:p-8 max-w-3xl animate-fade-in">
      <PageHeader
        breadcrumb="Citizen / Settings"
        section="CITIZEN WORKSPACE"
        title="Settings"
        subtitle="Manage your preferences and account experience."
      />

      <DemoNotice message="Settings are persisted to your browser's localStorage. Backend preferences sync is not yet connected." />

      {saved && (
        <Alert variant="success" icon={<CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />} className="mb-5">
          Settings saved to localStorage successfully.
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── A. General Preferences ──────────────────────────────────── */}
        <Section
          icon={<Globe className="w-4 h-4" />}
          title="General Preferences"
          description="Language, time zone, and display format."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="settings-lang">Language</label>
              <select id="settings-lang" value={settings.language} onChange={(e) => set('language', e.target.value)} className={inputCls}>
                {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="settings-tz">Time Zone</label>
              <select id="settings-tz" value={settings.timezone} onChange={(e) => set('timezone', e.target.value)} className={inputCls}>
                {['Asia/Kolkata', 'Asia/Colombo', 'Asia/Dhaka', 'UTC'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="settings-date">Date Display Format</label>
              <div className="flex flex-wrap gap-2">
                {['DD MMM YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => set('dateFormat', fmt)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all
                                ${settings.dateFormat === fmt
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F5F0E7] text-[#716B63] border-[#DED6C9] hover:border-[#111111] hover:text-[#111111]'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── B. Notifications ────────────────────────────────────────── */}
        <Section
          icon={<Bell className="w-4 h-4" />}
          title="Notifications"
          description="Control which events trigger notifications."
        >
          <Toggle id="s-notif-hearing"  label="Hearing Reminders"        description="Get reminded 24h before a hearing." checked={settings.notifHearing}  onChange={(v) => set('notifHearing', v)} />
          <Toggle id="s-notif-case"     label="Case Status Updates"       description="Notify when a case status changes." checked={settings.notifCase}     onChange={(v) => set('notifCase', v)} />
          <Toggle id="s-notif-analysis" label="Analysis Complete"         description="Notify when AI analysis finishes for a document." checked={settings.notifAnalysis} onChange={(v) => set('notifAnalysis', v)} />
          <Toggle id="s-notif-consult"  label="Consultation Updates"      description="Notify when a lawyer responds." checked={settings.notifConsult}  onChange={(v) => set('notifConsult', v)} />
          <Toggle id="s-notif-email"    label="Email Notifications"       description="Send notifications to your registered email." checked={settings.notifEmail}    onChange={(v) => set('notifEmail', v)} />
        </Section>

        {/* ── C. Privacy & Security ───────────────────────────────────── */}
        <Section
          icon={<Shield className="w-4 h-4" />}
          title="Privacy & Security"
          description="Manage account security and session information."
        >
          <div className="divide-y divide-[#F0EAE0]">
            <div className="pb-3">
              <p className="text-sm font-semibold text-[#111111]">Change Password</p>
              <p className="text-xs text-[#716B63] mt-0.5 mb-3">Update your password from the Profile &gt; Security tab.</p>
              <button
                type="button"
                onClick={() => navigate('/user/profile')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F5F0E7] border border-[#DED6C9] text-[#111111] hover:border-[#111111] transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                Go to Security Settings
              </button>
            </div>
            <div className="py-3">
              <p className="text-sm font-semibold text-[#111111]">Active Session</p>
              <p className="text-xs text-[#716B63] mt-0.5">Session management requires backend integration.</p>
            </div>
            <div className="pt-3">
              <p className="text-sm font-semibold text-[#111111] mb-2">Sign Out</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all"
                id="settings-signout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </Section>

        {/* ── D. Accessibility ────────────────────────────────────────── */}
        <Section
          icon={<Accessibility className="w-4 h-4" />}
          title="Accessibility"
          description="Preferences to improve readability and motion."
        >
          <Toggle id="s-reduced-motion" label="Reduce Motion"  description="Disable animations and transitions throughout the app." checked={settings.reducedMotion} onChange={(v) => set('reducedMotion', v)} />
          <Toggle id="s-larger-text"    label="Larger Base Text" description="Increase base font size for improved readability (refresh may be required)." checked={settings.largerText}    onChange={(v) => set('largerText', v)} />
        </Section>

        {/* ── Save / Reset ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${resetConfirm
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-white text-[#716B63] border-[#DED6C9] hover:border-[#111111] hover:text-[#111111]'}`}
            id="settings-reset-btn"
          >
            <RotateCcw className="w-4 h-4" />
            {resetConfirm ? 'Confirm Reset to Defaults' : 'Reset to Defaults'}
          </button>
          {resetConfirm && (
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="text-sm font-semibold text-[#716B63] underline underline-offset-2"
            >
              Cancel
            </button>
          )}
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />} id="settings-save-btn">
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
