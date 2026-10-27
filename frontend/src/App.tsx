import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import type { UserRole } from './types';

// ─── Lazy imports ─────────────────────────────────────────────────────────────

// Public
const LandingPage        = lazy(() => import('./pages/public/LandingPage'));
const LoginPage          = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const PrivacyPage        = lazy(() => import('./pages/public/PrivacyPage'));
const TermsPage          = lazy(() => import('./pages/public/TermsPage'));

// Citizen
const MyCasesPage        = lazy(() => import('./pages/user/MyCasesPage'));
const UploadDocumentPage = lazy(() => import('./pages/user/UploadDocumentPage'));
const FindLawyerPage     = lazy(() => import('./pages/user/FindLawyerPage'));
const LawyerProfileView  = lazy(() => import('./pages/user/LawyerProfilePage'));
const ConsultationsPage  = lazy(() => import('./pages/user/ConsultationsPage'));
const UserProfilePage    = lazy(() => import('./pages/user/UserProfilePage'));
const CaseDetailPage     = lazy(() => import('./pages/user/CaseDetailPage'));
// Simple placeholder pages for new nav items
const AiAnalysisPage     = lazy(() => import('./pages/user/AiAnalysisPage'));
const AskDocumentsPage   = lazy(() => import('./pages/user/AskDocumentsPage'));
const TimelinePage       = lazy(() => import('./pages/user/TimelinePage'));

// Lawyer
const LawyerDashboard         = lazy(() => import('./pages/lawyer/LawyerDashboard'));
const LawyerProfileEditPage   = lazy(() => import('./pages/lawyer/LawyerProfilePage'));
const VerificationStatusPage  = lazy(() => import('./pages/lawyer/VerificationStatusPage'));
const LawyerConsultationsPage = lazy(() => import('./pages/lawyer/LawyerConsultationsPage'));

// Admin
const AdminDashboard         = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagementPage     = lazy(() => import('./pages/admin/UserManagementPage'));
const LawyerVerificationPage = lazy(() => import('./pages/admin/LawyerVerificationPage'));
const FeedbackPage           = lazy(() => import('./pages/admin/FeedbackPage'));
const AnalyticsPage          = lazy(() => import('./pages/admin/AnalyticsPage'));

const AiAnalysisDetailPage = lazy(() => import('./pages/user/AiAnalysisDetailPage'));

// ─── Loading fallback ─────────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: '#F5F0E7' }}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#111111' }}>
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className="w-5 h-5 border-2 border-[#DED6C9] border-t-[#111111] rounded-full animate-spin" />
    </div>
  </div>
);

// ─── Route Guards ─────────────────────────────────────────────────────────────

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'lawyer' ? '/lawyer' : '/user';
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated && user) {
    const home = user.role === 'admin' ? '/admin' : user.role === 'lawyer' ? '/lawyer' : '/user';
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  const home = user?.role === 'admin' ? '/admin' : user?.role === 'lawyer' ? '/lawyer' : '/user';
  return <Navigate to={home} replace />;
};

// ─── Routes ───────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/landing"         element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      {/* Legal pages — accessible to all users regardless of auth state */}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms"   element={<TermsPage />} />

      {/* Citizen Portal */}
      <Route path="/user" element={<ProtectedRoute allowedRoles={['citizen']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="cases" replace />} />
        <Route path="cases"             element={<MyCasesPage />} />
        <Route path="cases/:id"         element={<CaseDetailPage />} />
        <Route path="upload"            element={<UploadDocumentPage />} />
        <Route path="ai-analysis"       element={<AiAnalysisPage />} />
        <Route path="ai-analysis/:caseId" element={<AiAnalysisDetailPage />} />
        {/* Legacy routes — redirect so old bookmarks don't break */}
        <Route path="delay-risk"        element={<Navigate to="/user/ai-analysis" replace />} />
        <Route path="delay-analysis"    element={<Navigate to="/user/ai-analysis" replace />} />
        <Route path="legal-guidance"    element={<Navigate to="/user/ask-documents" replace />} />
        <Route path="ask-documents"     element={<AskDocumentsPage />} />
        <Route path="lawyers"           element={<FindLawyerPage />} />
        <Route path="lawyers/:id"       element={<LawyerProfileView />} />
        <Route path="consultations"     element={<ConsultationsPage />} />
        <Route path="timeline"          element={<TimelinePage />} />
        <Route path="settings"          element={<Navigate to="/user/profile" replace />} />
        <Route path="profile"           element={<UserProfilePage />} />
      </Route>

      {/* Lawyer Portal */}
      <Route path="/lawyer" element={<ProtectedRoute allowedRoles={['lawyer']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="dashboard"     element={<LawyerDashboard />} />
        <Route path="profile"       element={<LawyerProfileEditPage />} />
        <Route path="verification"  element={<VerificationStatusPage />} />
        <Route path="consultations" element={<LawyerConsultationsPage />} />
        <Route path="cases"         element={<LawyerConsultationsPage />} />
      </Route>

      {/* Admin Portal */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"           element={<AdminDashboard />} />
        <Route path="users"               element={<UserManagementPage />} />
        <Route path="lawyer-verification" element={<LawyerVerificationPage />} />
        <Route path="feedback"            element={<FeedbackPage />} />
        <Route path="analytics"           element={<AnalyticsPage />} />
        <Route path="audit"               element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
