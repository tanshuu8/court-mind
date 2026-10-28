import type { CourtCase, Lawyer, ConsultationRequest, AdminStats, AuditLog, FeedbackReport } from '../types';

// ─── Demo Users ───────────────────────────────────────────────────────────────

export const DEMO_USERS = [
  { id: 'u-301', name: 'Ramesh Sharma',     email: 'ramesh.sharma@example.com',     role: 'citizen' as const, createdAt: '2024-03-10T08:00:00Z' },
  { id: 'u-302', name: 'Priya Nair',        email: 'priya.nair@example.com',        role: 'citizen' as const, createdAt: '2023-09-15T10:00:00Z' },
  { id: 'u-303', name: 'Amit Patel',        email: 'amit.patel@example.com',        role: 'citizen' as const, createdAt: '2024-06-01T09:30:00Z' },
  { id: 'u-304', name: 'Sneha Kulkarni',    email: 'sneha.kulkarni@example.com',    role: 'citizen' as const, createdAt: '2024-07-22T11:00:00Z' },
  { id: 'u-305', name: 'Vikram Singh',      email: 'vikram.singh@example.com',      role: 'citizen' as const, createdAt: '2024-08-05T14:00:00Z' },
  { id: 'u-101', name: 'Adv. Priya Venkatesh',  email: 'priya.venkatesh@lawfirm.in',   role: 'lawyer'  as const, createdAt: '2024-01-20T07:00:00Z' },
  { id: 'u-102', name: 'Adv. Rajesh Nair',      email: 'rajesh.nair@lawchambers.in',   role: 'lawyer'  as const, createdAt: '2024-02-10T08:00:00Z' },
  { id: 'u-103', name: 'Adv. Sunita Agarwal',   email: 'sunita.agarwal@delhilegal.in', role: 'lawyer'  as const, createdAt: '2024-03-05T09:00:00Z' },
  { id: 'u-104', name: 'Adv. Mohammed Farouk',  email: 'farouk@legalaid.in',           role: 'lawyer'  as const, createdAt: '2024-04-15T10:00:00Z' },
  { id: 'u-001', name: 'Admin Kumar',            email: 'admin@courtmind.in',           role: 'admin'   as const, createdAt: '2024-01-01T00:00:00Z' },
];

// ─── Demo Cases ───────────────────────────────────────────────────────────────

export const DEMO_CASES: CourtCase[] = [
  {
    id: 'c-001',
    caseNumber: 'CIV/2024/00142',
    title: 'Sharma vs. Municipal Corporation of Delhi',
    court: 'Delhi High Court',
    filingDate: '2024-03-15',
    nextHearing: '2024-11-28',
    status: 'active',
    delayRisk: 'high',
    petitioner: 'Ramesh Sharma',
    respondent: 'Municipal Corporation of Delhi',
    judge: 'Hon. Justice A.K. Mehta',
    description: 'Property dispute regarding unauthorized construction on petitioner\'s plot.',
  },
  {
    id: 'c-002',
    caseNumber: 'CRIM/2024/00387',
    title: 'State vs. Verma & Others',
    court: 'Sessions Court, Mumbai',
    filingDate: '2024-01-08',
    nextHearing: '2024-11-12',
    status: 'adjourned',
    delayRisk: 'medium',
    petitioner: 'State of Maharashtra',
    respondent: 'Ajay Verma & Others',
    judge: 'Hon. Justice P.R. Desai',
    description: 'Criminal case involving financial fraud of ₹2.3 crore.',
  },
  {
    id: 'c-003',
    caseNumber: 'FAM/2023/01156',
    title: 'Priya Nair vs. Suresh Nair',
    court: 'Family Court, Bangalore',
    filingDate: '2023-09-20',
    nextHearing: '2024-12-05',
    status: 'pending',
    delayRisk: 'low',
    petitioner: 'Priya Nair',
    respondent: 'Suresh Nair',
    judge: 'Hon. Justice S. Krishnaswamy',
    description: 'Divorce petition with custody dispute for minor children.',
  },
  {
    id: 'c-004',
    caseNumber: 'LAB/2024/00219',
    title: 'TechCorp Ltd. vs. Former Employees Union',
    court: 'Labour Court, Chennai',
    filingDate: '2024-02-28',
    nextHearing: '2024-11-19',
    status: 'active',
    delayRisk: 'medium',
    petitioner: 'TechCorp Ltd.',
    respondent: 'Former Employees Union',
    judge: 'Hon. Justice R. Subramanian',
    description: 'Dispute over wrongful termination of 42 employees.',
  },
  {
    id: 'c-005',
    caseNumber: 'PIW/2023/00891',
    title: 'NGO GreenFuture vs. State Pollution Board',
    court: 'National Green Tribunal',
    filingDate: '2023-11-14',
    status: 'decided',
    delayRisk: 'low',
    petitioner: 'NGO GreenFuture',
    respondent: 'State Pollution Control Board',
    judge: 'Hon. Justice M. Singh',
    description: 'Environmental case regarding industrial effluent discharge.',
  },
  {
    id: 'c-006',
    caseNumber: 'CIV/2024/00573',
    title: 'Mehta Properties vs. DLF Developers',
    court: 'Bombay High Court',
    filingDate: '2024-06-03',
    nextHearing: '2025-01-15',
    status: 'active',
    delayRisk: 'high',
    petitioner: 'Mehta Properties Pvt. Ltd.',
    respondent: 'DLF Developers Ltd.',
    judge: 'Hon. Justice K.R. Patil',
    description: 'Commercial real estate dispute involving ₹15 crore contract.',
  },
];

// ─── Demo Lawyers ─────────────────────────────────────────────────────────────

export const DEMO_LAWYERS: Lawyer[] = [
  {
    id: 'l-001',
    userId: 'u-101',
    name: 'Adv. Priya Venkatesh',
    email: 'priya.venkatesh@lawfirm.in',
    barCouncilNumber: 'BCI/KA/2015/3421',
    specializations: ['Civil Law', 'Property Law', 'Family Law'],
    location: 'Bangalore',
    experience: 9,
    rating: 4.8,
    reviewCount: 127,
    verificationStatus: 'approved',
    availability: true,
    bio: 'Senior civil attorney with extensive experience in property and family disputes.',
    languages: ['English', 'Kannada', 'Hindi'],
  },
  {
    id: 'l-002',
    userId: 'u-102',
    name: 'Adv. Rajesh Kumar Nair',
    email: 'rajesh.nair@lawchambers.in',
    barCouncilNumber: 'BCI/KL/2012/1877',
    specializations: ['Criminal Law', 'Cyber Crime'],
    location: 'Kochi',
    experience: 12,
    rating: 4.6,
    reviewCount: 89,
    verificationStatus: 'approved',
    availability: false,
    bio: 'Criminal defense specialist with a track record in complex fraud and cyber crime cases.',
    languages: ['English', 'Malayalam'],
  },
  {
    id: 'l-003',
    userId: 'u-103',
    name: 'Adv. Sunita Agarwal',
    email: 'sunita.agarwal@delhilegal.in',
    barCouncilNumber: 'BCI/DL/2018/7632',
    specializations: ['Labour Law', 'Corporate Law', 'Contract Law'],
    location: 'Delhi',
    experience: 6,
    rating: 4.5,
    reviewCount: 63,
    verificationStatus: 'approved',
    availability: true,
    bio: 'Corporate and labour law specialist advising businesses and employees on legal compliance.',
    languages: ['English', 'Hindi', 'Punjabi'],
  },
  {
    id: 'l-004',
    userId: 'u-104',
    name: 'Adv. Mohammed Farouk',
    email: 'farouk@legalaid.in',
    barCouncilNumber: 'BCI/TN/2010/2241',
    specializations: ['Consumer Law', 'Environmental Law'],
    location: 'Chennai',
    experience: 14,
    rating: 4.9,
    reviewCount: 202,
    verificationStatus: 'approved',
    availability: true,
    bio: 'Public interest lawyer focusing on consumer rights and environmental protection.',
    languages: ['English', 'Tamil', 'Urdu'],
  },
];

// ─── Demo Consultations ───────────────────────────────────────────────────────

export const DEMO_CONSULTATIONS: ConsultationRequest[] = [
  {
    id: 'con-001',
    caseId: 'c-001',
    caseTitle: 'Sharma vs. Municipal Corporation of Delhi',
    citizenName: 'Ramesh Sharma',
    lawyerId: 'l-003',
    requestedAt: '2024-10-18T10:30:00Z',
    status: 'pending',
    message: 'Need advice on property dispute strategy and next hearing preparation.',
  },
  {
    id: 'con-002',
    caseId: 'c-003',
    caseTitle: 'Priya Nair vs. Suresh Nair',
    citizenName: 'Priya Nair',
    lawyerId: 'l-001',
    requestedAt: '2024-10-15T14:00:00Z',
    status: 'accepted',
    scheduledDate: '2024-10-25T11:00:00Z',
    message: 'Need help with custody arrangement documentation.',
  },
];

// ─── Demo Admin Stats ─────────────────────────────────────────────────────────

export const DEMO_ADMIN_STATS: AdminStats = {
  totalUsers: 1248,
  totalCases: 3572,
  totalLawyers: 86,
  pendingVerifications: 12,
  casesThisMonth: 147,
  activeConsultations: 34,
};

// ─── Demo Audit Logs ──────────────────────────────────────────────────────────

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  { id: 'al-001', action: 'Lawyer Verified', userId: 'u-001', userName: 'Admin Kumar', timestamp: '2024-10-22T09:14:22Z', details: 'Approved Adv. Priya Venkatesh (BCI/KA/2015/3421)' },
  { id: 'al-002', action: 'Case Created', userId: 'u-301', userName: 'Ramesh Sharma', timestamp: '2024-10-21T16:45:00Z', details: 'Created case CIV/2024/00573' },
  { id: 'al-003', action: 'Document Uploaded', userId: 'u-302', userName: 'Priya Nair', timestamp: '2024-10-21T11:20:00Z', details: 'Uploaded custody_agreement_draft.pdf for FAM/2023/01156' },
  { id: 'al-004', action: 'Login', userId: 'u-103', userName: 'Adv. Sunita Agarwal', timestamp: '2024-10-20T08:55:11Z', details: 'Successful login from 182.X.X.X', ipAddress: '182.X.X.X' },
  { id: 'al-005', action: 'Consultation Accepted', userId: 'u-101', userName: 'Adv. Priya Venkatesh', timestamp: '2024-10-19T15:30:00Z', details: 'Accepted consultation request con-002' },
];

// ─── Demo Feedback ────────────────────────────────────────────────────────────

export const DEMO_FEEDBACK: FeedbackReport[] = [
  { id: 'fb-001', type: 'bug', userId: 'u-301', userName: 'Ramesh Sharma', message: 'Upload button not responding on mobile device.', status: 'in_review', submittedAt: '2024-10-20T12:00:00Z' },
  { id: 'fb-002', type: 'feedback', userId: 'u-302', userName: 'Priya Nair', message: 'Delay prediction is very insightful! Would love more explanation of each factor.', status: 'resolved', submittedAt: '2024-10-18T09:30:00Z' },
  { id: 'fb-003', type: 'complaint', userId: 'u-303', userName: 'Amit Patel', message: 'Lawyer did not show up for scheduled consultation.', status: 'open', submittedAt: '2024-10-22T17:45:00Z' },
];

// ─── Chart Demo Data ──────────────────────────────────────────────────────────

export const DEMO_CASE_STATUS_DATA = [
  { name: 'Active', value: 1420, fill: '#0ea5e9' },
  { name: 'Pending', value: 980, fill: '#f59e0b' },
  { name: 'Adjourned', value: 640, fill: '#f97316' },
  { name: 'Decided', value: 432, fill: '#10b981' },
  { name: 'Transferred', value: 100, fill: '#8b5cf6' },
];

export const DEMO_RISK_DATA = [
  { name: 'Low Risk', value: 42, fill: '#10b981' },
  { name: 'Medium Risk', value: 35, fill: '#f59e0b' },
  { name: 'High Risk', value: 23, fill: '#ef4444' },
];

export const DEMO_MONTHLY_FILINGS = [
  { month: 'May', cases: 98 },
  { month: 'Jun', cases: 112 },
  { month: 'Jul', cases: 134 },
  { month: 'Aug', cases: 119 },
  { month: 'Sep', cases: 128 },
  { month: 'Oct', cases: 147 },
];

export const DEMO_SHAP_FACTORS = [
  { name: 'Adjournment Frequency', value: 0.38, impact: 'negative' as const, description: 'Case has been adjourned 7 times — significantly above average.' },
  { name: 'Court Workload Index', value: 0.29, impact: 'negative' as const, description: 'Assigned bench is handling 340+ active cases this quarter.' },
  { name: 'Filing Age (months)', value: 0.21, impact: 'negative' as const, description: 'Case is 18 months old, entering high-risk zone for pendency.' },
  { name: 'Hearing Regularity', value: -0.15, impact: 'positive' as const, description: 'Hearings scheduled consistently — indicates procedural health.' },
  { name: 'Party Representation', value: -0.11, impact: 'positive' as const, description: 'Both parties have legal counsel, reducing procedural delays.' },
  { name: 'Document Completeness', value: -0.08, impact: 'positive' as const, description: 'All required filings are present and verified.' },
];
