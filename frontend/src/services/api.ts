import type {
  BackendHealth,
  CourtCase,
  PaginatedResponse,
  DelayPrediction,
  LegalQuery,
  Lawyer,
  ConsultationRequest,
  RAGHealthResponse,
  DocumentsListResponse,
  UploadResponse,
  AskRequest,
  AskResponse,
  SummarizeRequest,
  SummarizeResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Generic fetch helper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const rawText = await res.text();
      try {
        const errJson = JSON.parse(rawText);
        if (typeof errJson.detail === 'string') {
          errorMsg = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorMsg = errJson.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(', ');
        } else if (errJson.message) {
          errorMsg = errJson.message;
        } else if (rawText) {
          errorMsg = rawText;
        }
      } catch {
        if (rawText) errorMsg = rawText;
      }
    } catch {
      // Fallback to HTTP status
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

// ── Health ─────────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => apiFetch<BackendHealth>('/health'),
};

// ── Cases ──────────────────────────────────────────────────────────────────────

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

// ── Delay Prediction ───────────────────────────────────────────────────────────

export const predictionApi = {
  predict: (caseId: string) =>
    apiFetch<DelayPrediction>(`/v1/prediction/${caseId}`),
};

// ── Legal Q&A (RAG) ───────────────────────────────────────────────────────────

export const ragApi = {
  health: () => apiFetch<RAGHealthResponse>('/rag/health'),
  listDocuments: () => apiFetch<DocumentsListResponse>('/rag/documents'),
  uploadPdf: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    // Explicitly let browser set multipart/form-data boundary (no Content-Type header)
    const res = await fetch(`${API_BASE_URL}/rag/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.detail || errorMsg;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }
    return res.json() as Promise<UploadResponse>;
  },
  ask: (payload: AskRequest) =>
    apiFetch<AskResponse>('/rag/ask', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  summarize: (payload: SummarizeRequest | string) => {
    const body: SummarizeRequest = typeof payload === 'string' ? { doc_id: payload } : payload;
    return apiFetch<SummarizeResponse>('/rag/summarize', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  query: (payload: LegalQuery) =>
    apiFetch<AskResponse>('/rag/ask', {
      method: 'POST',
      body: JSON.stringify({ question: payload.question, doc_id: payload.caseId, mode: payload.caseId ? 'document' : 'general' }),
    }),
};

// ── Lawyers ────────────────────────────────────────────────────────────────────

export const lawyersApi = {
  list: (params?: { specialization?: string; location?: string }) => {
    const query = new URLSearchParams();
    if (params?.specialization) query.set('specialization', params.specialization);
    if (params?.location) query.set('location', params.location);
    return apiFetch<PaginatedResponse<Lawyer>>(`/v1/lawyers?${query}`);
  },
  get: (id: string) => apiFetch<Lawyer>(`/v1/lawyers/${id}`),
};

// ── Consultations ──────────────────────────────────────────────────────────────

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
