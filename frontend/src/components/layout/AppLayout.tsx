import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Scale, LogOut, X, Menu,
  FolderOpen, Upload, Bot, MessageSquare,
  Users, Clock, User,
  LayoutDashboard, BarChart2, UserCheck, MessageCircle, ScrollText,
  ShieldCheck, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { classNames } from '../../utils/helpers';
import type { UserRole } from '../../types';

interface NavItem { to: string; label: string; icon: React.ReactNode; }

function getCitizenNav(): NavItem[] {
  return [
    { to: '/user/cases',         label: 'My Cases',            icon: <FolderOpen   className="w-4 h-4" /> },
    { to: '/user/upload',        label: 'Upload Doc',          icon: <Upload        className="w-4 h-4" /> },
    { to: '/user/ai-analysis',   label: 'AI Analysis',         icon: <Bot           className="w-4 h-4" /> },
    { to: '/user/ask-documents', label: 'CourtMind AI',        icon: <MessageSquare className="w-4 h-4" /> },
    { to: '/user/lawyers',       label: 'Find Lawyer',         icon: <Users         className="w-4 h-4" /> },
    { to: '/user/timeline',      label: 'Timeline',            icon: <Clock         className="w-4 h-4" /> },
  ];
}

function getLawyerNav(): NavItem[] {
  return [
    { to: '/lawyer/verification',  label: 'Verification',   icon: <ShieldCheck   className="w-4 h-4" /> },
    { to: '/lawyer/profile',       label: 'My Profile',     icon: <User          className="w-4 h-4" /> },
    { to: '/lawyer/consultations', label: 'Consultations',  icon: <Briefcase     className="w-4 h-4" /> },
    { to: '/lawyer/cases',         label: 'Shared Cases',   icon: <FolderOpen    className="w-4 h-4" /> },
  ];
}

function getAdminNav(): NavItem[] {
  return [
    { to: '/admin/dashboard',           label: 'Dashboard',       icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/admin/analytics',           label: 'Analytics',        icon: <BarChart2       className="w-4 h-4" /> },
    { to: '/admin/users',               label: 'Users',            icon: <Users           className="w-4 h-4" /> },
    { to: '/admin/lawyer-verification', label: 'Verify Lawyers',   icon: <UserCheck       className="w-4 h-4" /> },
    { to: '/admin/feedback',            label: 'Feedback',         icon: <MessageCircle   className="w-4 h-4" /> },
    { to: '/admin/audit',               label: 'Audit Logs',       icon: <ScrollText      className="w-4 h-4" /> },
  ];
}

function getNavItems(role: UserRole): NavItem[] {
  if (role === 'lawyer') return getLawyerNav();
  if (role === 'admin')  return getAdminNav();
  return getCitizenNav();
}

function getRoleLabel(role: UserRole): string {
  if (role === 'lawyer') return 'LAWYER';
  if (role === 'admin')  return 'ADMIN';
  return 'CITIZEN';
}

function getRoleDot(role: UserRole): string {
  if (role === 'lawyer') return '#10b981';
  if (role === 'admin')  return '#f43f5e';
  return '#C5A87A';
}

interface SidebarProps {
  navItems: NavItem[];
  location: ReturnType<typeof useLocation>;
  onLogout: () => void;
  userName: string;
  role: UserRole;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ navItems, location, onLogout, role, onClose }) => {
  const profileTo = role === 'lawyer' ? '/lawyer/profile' : '/user/profile';
  const isProfileActive = location.pathname === profileTo || location.pathname.startsWith(profileTo + '/');

  return (
    <div className="flex flex-col h-full" style={{ background: '#111111' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#F5F1EA' }}>
              <Scale className="w-4 h-4 text-black" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: getRoleDot(role), borderColor: '#111111' }} />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">CourtMind</span>
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mt-2 ml-0.5"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {getRoleLabel(role)}
        </p>
        <div className="mt-4 h-px w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto space-y-0.5 no-scrollbar" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'text-black'
                  : 'text-gray-400 hover:text-white'
              )}
              style={isActive ? {
                background: '#F5F1EA',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              } : {
                background: 'transparent',
              }}
            >
              <span className={classNames(
                'shrink-0 transition-transform duration-150 group-hover:scale-110',
                isActive ? 'text-black' : 'text-gray-500'
              )}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Sign out + Profile */}
      <div className="px-3 pb-4 pt-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Sign out */}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150 group"
          id="sidebar-logout-btn"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          Sign out
        </button>

        {/* Profile — always last */}
        <Link
          to={profileTo}
          onClick={onClose}
          className={classNames(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
            isProfileActive ? 'text-black' : 'text-gray-400 hover:text-white'
          )}
          style={isProfileActive ? {
            background: '#F5F1EA',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          } : { background: 'transparent' }}
        >
          <span className={classNames(
            'shrink-0 transition-transform duration-150 group-hover:scale-110',
            isProfileActive ? 'text-black' : 'text-gray-500'
          )}>
            <User className="w-4 h-4" />
          </span>
          <span className="flex-1">Profile</span>
          {isProfileActive && <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />}
        </Link>
      </div>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role     = user?.role ?? 'citizen';
  const navItems = getNavItems(role);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F1EA' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-52 shrink-0 relative z-10"
        style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
        <SidebarContent
          navItems={navItems} location={location}
          onLogout={handleLogout} userName={user?.name ?? ''} role={role}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-52 h-full shadow-2xl z-10" style={{ background: '#111111' }}>
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-20"
              aria-label="Close">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent
              navItems={navItems} location={location}
              onLogout={handleLogout} userName={user?.name ?? ''} role={role}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4"
        style={{ background: '#F5F1EA', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <button onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-gray-600 hover:bg-black/5 transition-colors"
          aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-black" />
          <span className="text-sm font-bold text-black">CourtMind</span>
        </div>
      </div>

      {/* Page content — full width */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
