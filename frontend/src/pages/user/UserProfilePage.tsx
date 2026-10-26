import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Shield, Save,
  Edit2, X, CheckCircle2, Bell, Lock, Eye, EyeOff, LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, Button, Alert, Tabs, DemoNotice } from '../../components/common';
import { getInitials } from '../../utils/helpers';

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl bg-white border border-[#DED6C9] text-sm text-[#111111] py-2.5 px-4 ' +
  'placeholder-[#B5ADA3] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] ' +
  'transition-all disabled:bg-[#F5F0E7] disabled:text-[#B5ADA3] disabled:cursor-not-allowed';

const labelCls = 'block text-xs font-bold uppercase tracking-wide text-[#716B63] mb-1.5';

// ── Field ─────────────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string; id: string; type?: string; value: string;
  onChange?: (v: string) => void; disabled?: boolean; placeholder?: string;
  icon?: React.ReactNode; error?: string; rightSlot?: React.ReactNode;
}> = ({ label, id, type = 'text', value, onChange, disabled, placeholder, icon, error, rightSlot }) => (
  <div>
    <label className={labelCls} htmlFor={id}>{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B5ADA3] pointer-events-none">{icon}</div>}
      <input
        id={id} type={type} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled} placeholder={placeholder}
        className={`${inputCls} ${icon ? 'pl-10' : ''} ${rightSlot ? 'pr-10' : ''} ${error ? 'border-[#111111]' : ''}`}
      />
      {rightSlot && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
    </div>
    {error && <p className="mt-1 text-xs text-[#111111] font-semibold">{error}</p>}
  </div>
);

// ── Toggle ────────────────────────────────────────────────────────────────────

const Toggle: React.FC<{
  id: string; label: string; description?: string;
  checked: boolean; onChange: (v: boolean) => void;
}> = ({ id, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-[#F0EAE0] last:border-0">
    <div className="flex-1 min-w-0 pr-4">
      <p className="text-sm font-semibold text-[#111111]">{label}</p>
      {description && <p className="text-xs text-[#716B63] mt-0.5">{description}</p>}
    </div>
    <button
      type="button" id={id} role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
      style={{ background: checked ? '#111111' : '#DED6C9' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  </div>
);

// ── InfoRow ───────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-4 py-2.5 border-b border-[#F0EAE0] last:border-0">
    <p className="text-xs font-bold uppercase tracking-wide text-[#B5ADA3] w-32 shrink-0 pt-0.5">{label}</p>
    <div className="text-sm text-[#111111] font-medium">{value}</div>
  </div>
);

// ── ProfileAvatar ─────────────────────────────────────────────────────────────

const ProfileAvatar: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold shrink-0"
    style={{ background: '#111111', color: '#F5F0E7' }}
  >
    {getInitials(name)}
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const UserProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile edit
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(user?.name ?? '');
  const [phone, setPhone]       = useState('');
  const [city, setCity]         = useState('');
  const [lang, setLang]         = useState('English');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // Security
  const [showOld, setShowOld]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [oldPwd, setOldPwd]         = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError]     = useState('');
  const [pwdSaved, setPwdSaved]     = useState(false);
  const [pwdSaving, setPwdSaving]   = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    hearingReminders: true, caseUpdates: true,
    analysisComplete: false, consultationStatus: true, weeklyReport: false,
  });

  // Sign-out confirm
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: <User  className="w-3.5 h-3.5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell  className="w-3.5 h-3.5" /> },
    { id: 'security',      label: 'Security',      icon: <Lock  className="w-3.5 h-3.5" /> },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false); setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) { setPwdError('Password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return; }
    setPwdError('');
    setPwdSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setPwdSaving(false);
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    setPwdSaved(true);
    setTimeout(() => setPwdSaved(false), 4000);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl animate-fade-in">
      <PageHeader
        breadcrumb="Citizen / Profile"
        section="CITIZEN WORKSPACE"
        title="My Profile"
        subtitle="Manage your personal information and account details."
      />

      {/* ── Profile overview card ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#DED6C9] p-5 mb-6">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={user?.name ?? 'U'} />
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#111111] truncate">{user?.name}</p>
            <p className="text-sm text-[#716B63] truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5F0E7] border border-[#DED6C9] text-[#716B63] capitalize">
              {user?.role ?? 'citizen'}
            </span>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {!editing && (
              <Button
                variant="outline" size="sm"
                onClick={() => setEditing(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                id="edit-profile-btn"
              >
                Edit
              </Button>
            )}
            {/* Sign Out button — prominently in profile overview */}
            {!signOutConfirm ? (
              <button
                onClick={() => setSignOutConfirm(true)}
                id="profile-signout-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                           border border-[#DED6C9] text-[#716B63] bg-white
                           hover:border-[#111111] hover:text-[#111111] transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-[#DED6C9] bg-[#F5F0E7]">
                <p className="text-xs font-bold text-[#111111]">Sign out?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSignOut}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#111111] text-white hover:bg-[#333] transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setSignOutConfirm(false)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#DED6C9] text-[#716B63] hover:text-[#111111] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(t) => { setActiveTab(t); setEditing(false); setSaved(false); }}
      />

      <div className="mt-5">

        {/* ── Profile tab ───────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {saved && (
              <Alert variant="success" icon={<CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}>
                Profile updated. (Local demo — changes are not persisted to any server.)
              </Alert>
            )}
            <DemoNotice message="Profile updates are stored in local state only. Backend authentication integration required for persistence." />

            {/* Personal information */}
            <div className="bg-white rounded-2xl border border-[#DED6C9] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DED6C9] flex items-center justify-between">
                <p className="text-sm font-bold text-[#111111]">Personal Information</p>
                {editing && (
                  <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-[#B5ADA3] hover:text-[#111111] hover:bg-[#F5F0E7] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
                {editing ? (
                  <>
                    <Field label="Full Name"       id="profile-name"  value={name}  onChange={setName}  icon={<User  className="w-4 h-4" />} />
                    <Field label="Email Address"   id="profile-email" value={user?.email ?? ''} disabled icon={<Mail  className="w-4 h-4" />} />
                    <Field label="Phone Number"    id="profile-phone" value={phone} onChange={setPhone} type="tel" placeholder="+91 XXXXX XXXXX" icon={<Phone  className="w-4 h-4" />} />
                    <Field label="City / Location" id="profile-city"  value={city}  onChange={setCity}  placeholder="e.g. Mumbai" icon={<MapPin className="w-4 h-4" />} />
                    <div>
                      <label className={labelCls} htmlFor="profile-lang">Preferred Language</label>
                      <select id="profile-lang" value={lang} onChange={(e) => setLang(e.target.value)}
                        className="w-full rounded-xl bg-white border border-[#DED6C9] text-sm text-[#111111] py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-[#111111] transition-all">
                        {['English','Hindi','Marathi','Tamil','Telugu','Kannada','Bengali','Gujarati'].map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />} id="save-profile-btn">
                        Save Changes
                      </Button>
                      <button type="button" onClick={() => setEditing(false)}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#716B63] border border-[#DED6C9] hover:border-[#111111] hover:text-[#111111] transition-all">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="divide-y divide-[#F0EAE0]">
                    <InfoRow label="Full Name" value={name || user?.name || '—'} />
                    <InfoRow label="Email"     value={<span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#B5ADA3]" />{user?.email}</span>} />
                    <InfoRow label="Phone"     value={phone || <span className="text-[#B5ADA3] italic font-normal text-xs">Not provided</span>} />
                    <InfoRow label="City"      value={city  || <span className="text-[#B5ADA3] italic font-normal text-xs">Not provided</span>} />
                    <InfoRow label="Language"  value={lang} />
                  </div>
                )}
              </form>
            </div>

            {/* Account information */}
            <div className="bg-white rounded-2xl border border-[#DED6C9] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DED6C9] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#716B63]" />
                <p className="text-sm font-bold text-[#111111]">Account Information</p>
              </div>
              <div className="p-5 divide-y divide-[#F0EAE0]">
                <InfoRow label="Account Role"   value={<span className="capitalize">{user?.role ?? 'citizen'}</span>} />
                <InfoRow label="Account Status" value={<span className="font-semibold">Active</span>} />
                <InfoRow label="Member Since"   value={<span className="text-[#716B63] text-xs">Registration date not available in demo</span>} />
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications tab ──────────────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-[#DED6C9] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#DED6C9]">
              <p className="text-sm font-bold text-[#111111]">Notification Preferences</p>
              <p className="text-xs text-[#716B63] mt-0.5">Saved in browser memory for this session only.</p>
            </div>
            <div className="px-5">
              <Toggle id="notif-hearing"  label="Hearing Reminders"     description="Reminders 24h before upcoming hearing dates."              checked={notifs.hearingReminders}   onChange={(v) => setNotifs((p) => ({ ...p, hearingReminders: v }))} />
              <Toggle id="notif-case"     label="Case Status Updates"    description="Notify when case status changes."                          checked={notifs.caseUpdates}        onChange={(v) => setNotifs((p) => ({ ...p, caseUpdates: v }))} />
              <Toggle id="notif-analysis" label="Analysis Complete"      description="Notify when AI document analysis finishes."               checked={notifs.analysisComplete}   onChange={(v) => setNotifs((p) => ({ ...p, analysisComplete: v }))} />
              <Toggle id="notif-consult"  label="Consultation Updates"   description="Notify when a lawyer responds to your request."           checked={notifs.consultationStatus} onChange={(v) => setNotifs((p) => ({ ...p, consultationStatus: v }))} />
              <Toggle id="notif-weekly"   label="Weekly Summary Report"  description="A weekly overview of all your active cases."              checked={notifs.weeklyReport}       onChange={(v) => setNotifs((p) => ({ ...p, weeklyReport: v }))} />
            </div>
            <div className="px-5 py-3 border-t border-[#DED6C9]">
              <p className="text-xs text-[#B5ADA3]">Backend notification service not yet connected. Toggles reflect local state only.</p>
            </div>
          </div>
        )}

        {/* ── Security tab ──────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {pwdSaved && <Alert variant="success">Password changed. (Demo only — no backend call was made.)</Alert>}
            {pwdError && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#DED6C9] bg-[#F5F0E7] text-sm text-[#111111]">
                <span className="font-bold">⚠</span> {pwdError}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#DED6C9] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DED6C9]">
                <p className="text-sm font-bold text-[#111111]">Change Password</p>
                <p className="text-xs text-[#716B63] mt-0.5">Demo validation only — not connected to an authentication service.</p>
              </div>
              <form onSubmit={handleChangePassword} id="security-form" className="p-5 space-y-4">
                <Field label="Current Password"      id="old-password"          type={showOld ? 'text' : 'password'} value={oldPwd}    onChange={setOldPwd}
                  icon={<Lock className="w-4 h-4" />}
                  rightSlot={<button type="button" onClick={() => setShowOld((o) => !o)} className="text-[#B5ADA3] hover:text-[#111111] transition-colors">{showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
                <Field label="New Password (min. 8)" id="new-password"          type={showNew ? 'text' : 'password'} value={newPwd}    onChange={setNewPwd}
                  icon={<Lock className="w-4 h-4" />}
                  rightSlot={<button type="button" onClick={() => setShowNew((o) => !o)} className="text-[#B5ADA3] hover:text-[#111111] transition-colors">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
                <Field label="Confirm New Password"  id="confirm-new-password"  type="password" value={confirmPwd} onChange={setConfirmPwd} icon={<Lock className="w-4 h-4" />} />
                <Button type="submit" variant="primary" isLoading={pwdSaving} id="change-password-btn" leftIcon={<Save className="w-4 h-4" />}>
                  Change Password
                </Button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfilePage;
