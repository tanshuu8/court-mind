/**
 * uploadStore.ts — Frontend-only demo persistence layer.
 *
 * Stores uploaded case metadata in localStorage so records survive
 * page navigation and browser refresh.
 *
 * NOTE: This is LOCAL DEMO STORAGE only. No data is sent to a server.
 * PDF file blobs are NOT stored (localStorage is unsuitable for large binaries).
 * Do not store sensitive legal document contents here.
 */

const STORAGE_KEY = 'cm_uploaded_cases_v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface UploadedCase {
  /** Unique id, generated at upload time */
  id: string;
  /** Actual PDF filename as uploaded by the user */
  fileName: string;
  /** File size in bytes */
  fileSizeBytes: number;
  /** ISO timestamp of when the file was selected/submitted */
  uploadedAt: string;
  /** Document type chosen by the user */
  docType: string;
  /** Case number entered by the user, or null if not provided */
  caseNumber: string | null;
  /** Court / jurisdiction entered by the user */
  court: string | null;
  /** Current processing status */
  status: AnalysisStatus;
  /**
   * Delay risk — only populated when status === 'complete' AND a real
   * prediction result is available. Never auto-assigned on upload.
   */
  delayRisk: 'low' | 'medium' | 'high' | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function load(): UploadedCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UploadedCase[];
  } catch {
    return [];
  }
}

function save(cases: UploadedCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {
    // localStorage may be full or unavailable
    console.warn('[uploadStore] Could not save to localStorage');
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const uploadStore = {
  /** Return all uploaded cases, newest first */
  getAll(): UploadedCase[] {
    return load().sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  },

  /** Add a new uploaded case record */
  add(record: Omit<UploadedCase, 'id'>): UploadedCase {
    const cases = load();
    const newCase: UploadedCase = { id: 'uc-' + Date.now(), ...record };
    save([newCase, ...cases]);
    return newCase;
  },

  /** Update an existing case record (e.g. status change) */
  update(id: string, patch: Partial<UploadedCase>): void {
    const cases = load().map((c) => (c.id === id ? { ...c, ...patch } : c));
    save(cases);
  },

  /** Remove a case record by id */
  remove(id: string): void {
    save(load().filter((c) => c.id !== id));
  },

  /** Get a single case by id */
  get(id: string): UploadedCase | undefined {
    return load().find((c) => c.id === id);
  },

  /** Subscribe to changes (simple polling-free pattern via custom events) */
  onChange(listener: () => void): () => void {
    window.addEventListener('cm_store_change', listener);
    return () => window.removeEventListener('cm_store_change', listener);
  },

  /** Emit change event so all subscribers re-read */
  notify(): void {
    window.dispatchEvent(new Event('cm_store_change'));
  },
};

// ── Document type label map ───────────────────────────────────────────────────

export const DOC_TYPE_OPTIONS = [
  { value: 'court_order',  label: 'Court Order / Judgment' },
  { value: 'petition',     label: 'Petition / Complaint' },
  { value: 'affidavit',    label: 'Affidavit' },
  { value: 'evidence',     label: 'Evidence Document' },
  { value: 'contract',     label: 'Contract / Agreement' },
  { value: 'statutory',    label: 'Statutory Filing' },
  { value: 'other',        label: 'Other Legal Document' },
];

export function getDocTypeLabel(value: string): string {
  return DOC_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

// ── PDF validation ────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate a File object against the rules for court document uploads.
 * Returns null on success, or an error string to show the user.
 *
 * NOTE: Browser-side validation is a UX convenience only.
 * Authoritative file validation must be performed server-side.
 */
export async function validatePdfFile(file: File): Promise<string | null> {
  // 1. Extension check
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return 'Invalid file. Please upload a valid PDF court document (court order, judgment, petition, or filing). Maximum size: 10 MB.';
  }

  // 2. MIME type check
  if (file.type && file.type !== 'application/pdf') {
    return 'Invalid file. Please upload a valid PDF court document (court order, judgment, petition, or filing). Maximum size: 10 MB.';
  }

  // 3. Size check
  if (file.size === 0) {
    return 'The selected file is empty. Please choose a valid PDF document.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`;
  }

  // 4. PDF magic-byte check ("%PDF" = 0x25 0x50 0x44 0x46)
  try {
    const slice = file.slice(0, 4);
    const buf   = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    if (!isPdf) {
      return 'Invalid file. The selected file does not appear to be a valid PDF document.';
    }
  } catch {
    // If we can't read the file, let the backend validate
  }

  return null; // valid
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
