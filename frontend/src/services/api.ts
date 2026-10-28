import type {
  BackendHealth,
  CourtCase,
  PaginatedResponse,
  DelayPrediction,
  LegalAnswer,
  LegalQuery,
  Lawyer,
  ConsultationRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => apiFetch<BackendHealth>('/health'),
};

// ─── Cases ────────────────────────────────────────────────────────────────────

export const casesApi = {
  list: (params?: { page?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return apiFetch<PaginatedResponse<CourtCase>>(`/v1/cases?${query}`);
  },
  get: (id: string) => apiFetch<CourtCase>(`/v1/cases/${id}`),
  create: (data: Partial<CourtCase>) =>
    apiFetch<CourtCase>('/v1/cases', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Delay Prediction ─────────────────────────────────────────────────────────

export const predictionApi = {
  predict: (caseId: string) =>
    apiFetch<DelayPrediction>(`/v1/prediction/${caseId}`),
};

// ─── Legal Q&A (RAG) ──────────────────────────────────────────────────────────

export const ragApi = {
  query: (payload: LegalQuery) =>
    apiFetch<LegalAnswer>('/v1/rag/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Lawyers ──────────────────────────────────────────────────────────────────

export const lawyersApi = {
  list: (params?: { specialization?: string; location?: string }) => {
    const query = new URLSearchParams();
    if (params?.specialization) query.set('specialization', params.specialization);
    if (params?.location) query.set('location', params.location);
    return apiFetch<PaginatedResponse<Lawyer>>(`/v1/lawyers?${query}`);
  },
  get: (id: string) => apiFetch<Lawyer>(`/v1/lawyers/${id}`),
};

// ─── Consultations ────────────────────────────────────────────────────────────

export const consultationsApi = {
  list: () => apiFetch<ConsultationRequest[]>('/v1/consultations'),
  request: (data: Partial<ConsultationRequest>) =>
    apiFetch<ConsultationRequest>('/v1/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: string) =>
    apiFetch<ConsultationRequest>(`/v1/consultations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
