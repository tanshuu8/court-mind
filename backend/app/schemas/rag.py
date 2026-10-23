"""Pydantic schemas for the Legal RAG API endpoints."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared sub-models
# ---------------------------------------------------------------------------

class CitationSchema(BaseModel):
    doc_id: str
    chunk_id: str
    chunk_index: int
    page_number: int
    title: Optional[str] = None
    court: Optional[str] = None
    year: Optional[str] = None
    similarity_score: Optional[float] = None


class AdvocateCTASchema(BaseModel):
    cta_title: str
    cta_description: str
    target_route: str
    non_blocking: bool
    context_payload: Dict[str, Any]


class DocumentInfoSchema(BaseModel):
    doc_id: str
    title: Optional[str] = None
    court: Optional[str] = None
    year: Optional[str] = None
    page_count: Optional[int] = None
    chunks_indexed: Optional[int] = None
    source: Optional[str] = None


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

class UploadResponse(BaseModel):
    doc_id: str
    title: Optional[str] = None
    court: Optional[str] = None
    year: Optional[str] = None
    page_count: int = 0
    chunks_indexed: int = 0
    is_scanned: bool = False
    status: str
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Ask
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    doc_id: Optional[str] = Field(default=None, description="Document ID to restrict retrieval to (required in 'document' mode).")
    question: str = Field(..., min_length=3, description="Legal question.")
    mode: str = Field(default="document", description="Question mode: 'document' (Ask This Document) or 'general' (General Legal Question).")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve.")


class AskResponse(BaseModel):
    query: str
    mode: str = "document"
    doc_id: Optional[str] = None
    answer: str
    citations: List[CitationSchema] = []
    is_grounded: bool
    status: str
    source_attribution: str = "Selected Document Passages"
    disclaimer: Optional[str] = None
    advocate_cta: AdvocateCTASchema


# ---------------------------------------------------------------------------
# Summarize
# ---------------------------------------------------------------------------

class SummarizeRequest(BaseModel):
    doc_id: str = Field(..., description="Document ID to summarize.")


class SummarizeResponse(BaseModel):
    doc_id: str
    title: Optional[str] = None
    court: Optional[str] = None
    year: Optional[str] = None
    total_pages: Optional[int] = None
    total_chunks: Optional[int] = None
    summary: str
    status: str
    advocate_cta: AdvocateCTASchema


# ---------------------------------------------------------------------------
# Documents list
# ---------------------------------------------------------------------------

class DocumentsListResponse(BaseModel):
    total: int
    documents: List[DocumentInfoSchema]
    storage_type: str
    persistence_note: str
