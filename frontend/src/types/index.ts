// ─── Auth & User Types ───────────────────────────────────────────────────────

export type UserRole = 'citizen' | 'lawyer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Case Types ───────────────────────────────────────────────────────────────

export type CaseStatus = 'pending' | 'active' | 'adjourned' | 'decided' | 'transferred';
export type DelayRisk = 'low' | 'medium' | 'high';

export interface CourtCase {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  filingDate: string;
  nextHearing?: string;
  status: CaseStatus;
  delayRisk?: DelayRisk;
  petitioner: string;
  respondent: string;
  judge?: string;
  description?: string;
}

export interface CaseHearing {
  id: string;
  date: string;
  type: string;
  outcome: string;
  nextDate?: string;
  notes?: string;
  adjournmentReason?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
  status: 'processing' | 'analyzed' | 'failed';
}

export interface DelayPrediction {
  riskLevel: DelayRisk;
  confidence: number;
  estimatedDelay: string;
  factors: ShapFactor[];
  disclaimer: string;
}

export interface ShapFactor {
  name: string;
  value: number;
  impact: 'positive' | 'negative';
  description: string;
}

// ─── Lawyer Types ─────────────────────────────────────────────────────────────

export type LawyerVerificationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_required';

export interface Lawyer {
  id: string;
  userId: string;
  name: string;
  email: string;
  barCouncilNumber?: string;
  specializations: string[];
  location: string;
  experience: number;
  rating: number;
  reviewCount: number;
  verificationStatus: LawyerVerificationStatus;
  availability: boolean;
  bio?: string;
  languages?: string[];
}

export interface ConsultationRequest {
  id: string;
  caseId: string;
  caseTitle: string;
  citizenName: string;
  lawyerId: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  message?: string;
  scheduledDate?: string;
}

// ─── Document & RAG Types ─────────────────────────────────────────────────────

export interface Citation {
  doc_id: string;
  chunk_id: string;
  chunk_index: number;
  page_number: number;
  title?: string;
  court?: string;
  year?: string;
  similarity_score?: number;
}

export interface AdvocateCTA {
  cta_title: string;
  cta_description: string;
  target_route: string;
  non_blocking: boolean;
  context_payload: Record<string, unknown>;
}

export interface DocumentInfo {
  doc_id: string;
  title?: string;
  court?: string;
  year?: string;
  page_count?: number;
  chunks_indexed?: number;
  source?: string;
}

export interface DocumentsListResponse {
  total: number;
  documents: DocumentInfo[];
  storage_type: string;
  persistence_note: string;
}

export interface UploadResponse {
  doc_id: string;
  title?: string;
  court?: string;
  year?: string;
  page_count: number;
  chunks_indexed: number;
  is_scanned: boolean;
  status: string;
  message?: string;
}

export interface AskRequest {
  doc_id?: string;
  question: string;
  mode?: 'document' | 'general';
  top_k?: number;
}

export interface AskResponse {
  query: string;
  mode: 'document' | 'general';
  doc_id?: string;
  answer: string;
  citations: Citation[];
  is_grounded: boolean;
  status: string;
  source_attribution?: string;
  disclaimer?: string;
  advocate_cta: AdvocateCTA;
  provider?: string;
  model?: string;
}

export interface SummarizeRequest {
  doc_id: string;
}

export interface SummarizeResponse {
  doc_id: string;
  title?: string;
  court?: string;
  year?: string;
  total_pages?: number;
  total_chunks?: number;
  summary: string;
  status: string;
  advocate_cta: AdvocateCTA;
  provider?: string;
  model?: string;
}

export interface RAGHealthResponse {
  status: string;
  vector_store?: { mode: string; chunks: number };
  document_registry?: { count: number };
  disk_storage?: { ok: boolean; pdf_files: number };
  llm?: { provider: string; model: string; configured: boolean };
}

export interface LegalQuery {
  question: string;
  caseId?: string;
}

export interface LegalAnswer {
  answer: string;
  sources: DocumentSource[];
  confidence: number;
  disclaimer: string;
}

export interface DocumentSource {
  title: string;
  excerpt: string;
  relevance: number;
  page?: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BackendHealth {
  status: string;
  service: string;
  timestamp?: string;
}

// ─── Admin Types ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalCases: number;
  totalLawyers: number;
  pendingVerifications: number;
  casesThisMonth: number;
  activeConsultations: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface FeedbackReport {
  id: string;
  type: 'bug' | 'feedback' | 'complaint';
  userId: string;
  userName: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved';
  submittedAt: string;
}
