"""Shared RAG singleton service for the FastAPI backend.

Persistence strategy:
  1. Bundled judgments (data/legal_judgments/) are always re-ingested on startup.
  2. User-uploaded PDFs are saved to data/stored_documents/ by storage_service.py
     and re-ingested on startup from that directory.
  3. The in-memory PgVectorRetriever keeps vectors in RAM for the lifetime of the
     server process.  If VECTOR_DATABASE_URL is configured and a live PostgreSQL
     connection is available the retriever also writes to pgvector — but the
     system works correctly without a database connection.
"""
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("courtmind.rag_service")

# Ensure project root is on sys.path so `rag` package can be imported
_project_root = str(Path(__file__).resolve().parents[3])
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.ingestion.pipeline import LegalIngestionPipeline
from rag.chunking.splitter import LegalSemanticChunker
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline
from rag.advocate_matching.matcher import AdvocateMatcher

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------
_embedder: Optional[TextEmbedder] = None
_retriever: Optional[PgVectorRetriever] = None
_llm_client: Optional[LLMClient] = None
_rag_pipeline: Optional[LegalRAGPipeline] = None
_ingestion_pipeline: Optional[LegalIngestionPipeline] = None
_advocate_matcher: Optional[AdvocateMatcher] = None

# Registry: doc_id -> metadata dict
_document_registry: Dict[str, Dict[str, Any]] = {}
_initialized: bool = False


def _get_components() -> tuple:
    """Lazy-initialises and returns all shared RAG components."""
    global _embedder, _retriever, _llm_client, _rag_pipeline
    global _ingestion_pipeline, _advocate_matcher, _initialized

    if _initialized:
        return _embedder, _retriever, _llm_client, _rag_pipeline, _ingestion_pipeline, _advocate_matcher

    from app.core.config import settings

    _embedder = TextEmbedder()
    _retriever = PgVectorRetriever()
    active_key = (
        settings.GROQ_API_KEY if settings.LLM_PROVIDER == "groq"
        else (settings.GEMINI_API_KEY or settings.LLM_API_KEY)
    )
    _llm_client = LLMClient(
        provider=settings.LLM_PROVIDER,
        model_name=settings.LLM_MODEL_NAME,
        api_key=active_key,
        temperature=settings.LLM_TEMPERATURE,
        timeout=settings.LLM_TIMEOUT,
        max_retries=settings.LLM_MAX_RETRIES,
        max_output_tokens=settings.LLM_MAX_OUTPUT_TOKENS,
    )
    _advocate_matcher = AdvocateMatcher()

    _ingestion_pipeline = LegalIngestionPipeline(
        loader=DocumentLoader(),
        parser=LegalDocumentParser(),
        chunker=LegalSemanticChunker(chunk_size=1200, chunk_overlap=150),
        embedder=_embedder,
        retriever=_retriever,
    )

    _rag_pipeline = LegalRAGPipeline(
        embedder=_embedder,
        retriever=_retriever,
        llm_client=_llm_client,
        advocate_matcher=_advocate_matcher,
    )

    _initialized = True
    return _embedder, _retriever, _llm_client, _rag_pipeline, _ingestion_pipeline, _advocate_matcher


def get_rag_pipeline() -> LegalRAGPipeline:
    _, _, _, pipeline, _, _ = _get_components()
    return pipeline


def get_ingestion_pipeline() -> LegalIngestionPipeline:
    _, _, _, _, ingestion, _ = _get_components()
    return ingestion


def get_retriever() -> PgVectorRetriever:
    _, retriever, _, _, _, _ = _get_components()
    return retriever


def get_document_registry() -> Dict[str, Dict[str, Any]]:
    return _document_registry


def register_document(doc_id: str, metadata: Dict[str, Any]) -> None:
    """Adds or updates a document entry in the registry."""
    _document_registry[doc_id] = metadata


def is_document_indexed(doc_id: str) -> bool:
    """Returns True if doc_id is already in the in-memory registry."""
    return doc_id in _document_registry


async def _ingest_directory_to_registry(pdf_dir: Path, source_label: str) -> Dict[str, Any]:
    """Ingests all PDFs from a directory and registers results."""
    _, retriever, _, _, ingestion, _ = _get_components()

    if not pdf_dir.exists() or not pdf_dir.is_dir():
        return {"status": "skipped", "reason": f"Directory not found: {pdf_dir}"}

    # Avoid redundant re-indexing if bundled judgments are already indexed
    if source_label == "bundled" and len(retriever._memory_chunks) > 0 and len(_document_registry) >= 3:
        logger.info("[bundled] Judgments already indexed in memory, skipping redundant re-embedding.")
        return {"status": "cached", "reason": "already_indexed", "documents_ingested": len(_document_registry)}

    summary = await ingestion.ingest_directory(pdf_dir)

    ingested = 0
    for doc in summary.get("details", []):
        doc_id = doc.get("doc_id")
        if doc_id:
            register_document(doc_id, {
                "doc_id": doc_id,
                "title": doc.get("title", "Unknown"),
                "court": doc.get("court", "Unknown"),
                "year": doc.get("year", "Unknown"),
                "page_count": doc.get("page_count", 0),
                "chunks_indexed": doc.get("chunks_indexed", 0),
                "source": source_label,
            })
            ingested += 1

    logger.info(
        f"[{source_label}] Ingested {ingested} documents "
        f"({summary.get('total_chunks_indexed', 0)} chunks) from {pdf_dir}"
    )
    return summary


async def preload_sample_judgments() -> Dict[str, Any]:
    """Pre-indexes all PDFs at startup so they are immediately queryable.

    Loads from two locations:
    1. data/legal_judgments/  — bundled real Indian judgments (always loaded)
    2. data/stored_documents/ — user-uploaded PDFs saved to disk (gives restart persistence)
    """
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    results: Dict[str, Any] = {}

    # 1. Bundled judgments
    bundled_dir = project_root / "data" / "legal_judgments"
    bundled = await _ingest_directory_to_registry(bundled_dir, "bundled")
    results["bundled"] = bundled

    # 2. User-uploaded PDFs (persistent across restarts)
    try:
        from app.core.config import settings
        upload_dir = Path(settings.PDF_STORAGE_DIR).resolve()
    except Exception:
        upload_dir = project_root / "data" / "stored_documents"

    if upload_dir.exists() and any(upload_dir.glob("*.pdf")):
        uploaded = await _ingest_directory_to_registry(upload_dir, "user_uploaded")
        results["user_uploaded"] = uploaded
    else:
        results["user_uploaded"] = {"status": "skipped", "reason": "No user-uploaded PDFs found"}

    return results
