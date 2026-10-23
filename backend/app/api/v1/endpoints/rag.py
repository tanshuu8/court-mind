"""FastAPI RAG endpoints for CourtMind Legal Document Q&A.

Endpoints:
    GET  /api/v1/rag/health           — system health check
    GET  /api/v1/rag/documents        — list indexed documents
    POST /api/v1/rag/upload           — upload & index a PDF (persisted to disk)
    POST /api/v1/rag/ask              — grounded Q&A scoped to one document
    POST /api/v1/rag/summarize        — structured summary of one document
"""
import logging
import tempfile
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.rag import (
    AskRequest,
    AskResponse,
    CitationSchema,
    DocumentsListResponse,
    DocumentInfoSchema,
    SummarizeRequest,
    SummarizeResponse,
    UploadResponse,
)
from app.services.rag_service import (
    get_ingestion_pipeline,
    get_rag_pipeline,
    get_document_registry,
    get_retriever,
    register_document,
)
from app.services.storage_service import LocalFileStorageService

logger = logging.getLogger("courtmind.rag_endpoint")
router = APIRouter()
_storage = LocalFileStorageService()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_UPLOAD_BYTES = 50 * 1024 * 1024   # 50 MB hard limit
ALLOWED_CONTENT_TYPES = {"application/pdf"}


# ---------------------------------------------------------------------------
# GET /documents
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@router.get("/health", summary="System Health Check")
async def health_check() -> Dict[str, Any]:
    """Returns health status of all RAG subsystems."""
    retriever = get_retriever()
    registry = get_document_registry()

    # Check vector store
    chunk_count = 0
    vs_mode = "unknown"
    try:
        chunk_count = len(retriever._memory_chunks)
        vs_mode = "postgres" if retriever._is_postgres_active else "in-memory"
    except Exception:
        vs_mode = "in-memory"

    # Check storage dir
    try:
        storage_ok = _storage.storage_dir.exists()
        pdf_count = len(list(_storage.storage_dir.glob("*.pdf"))) if storage_ok else 0
    except Exception:
        storage_ok = False
        pdf_count = 0

    return {
        "status": "ok",
        "vector_store": {"mode": vs_mode, "chunks": chunk_count},
        "document_registry": {"count": len(registry)},
        "disk_storage": {"ok": storage_ok, "pdf_files": pdf_count},
    }


# ---------------------------------------------------------------------------
# GET /documents
# ---------------------------------------------------------------------------

@router.get(
    "/documents",
    response_model=DocumentsListResponse,
    summary="List Indexed Documents",
    description="Returns all documents currently indexed in the vector store.",
)
async def list_documents() -> DocumentsListResponse:
    registry = get_document_registry()
    docs = [DocumentInfoSchema(**v) for v in registry.values()]
    return DocumentsListResponse(
        total=len(docs),
        documents=docs,
        storage_type="in-memory",
        persistence_note=(
            "Uploaded PDFs are securely saved to data/stored_documents/ and re-ingested on startup. "
            "Vectors are kept in RAM during the server session."
        ),
    )


# ---------------------------------------------------------------------------
# POST /upload
# ---------------------------------------------------------------------------

@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload & Index a Legal PDF",
    description=(
        "Accepts a PDF file (max 50 MB), extracts page-aware text, chunks it semantically, "
        "generates dense embeddings, and indexes the chunks into the vector store. "
        "Returns the generated document ID for use in subsequent /ask and /summarize calls."
    ),
)
async def upload_document(
    file: UploadFile = File(..., description="PDF file to upload and index."),
) -> UploadResponse:
    is_pdf_type = file.content_type in ALLOWED_CONTENT_TYPES or file.content_type in {"application/x-pdf", "binary/octet-stream", "application/octet-stream"}
    is_pdf_name = bool(file.filename and file.filename.lower().endswith(".pdf"))
    if not (is_pdf_type or is_pdf_name) or (file.filename and not file.filename.lower().endswith(".pdf")):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Only PDF files are accepted. Received content-type: {file.content_type}",
        )

    # 2. Read and size-check
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
        )

    # 3. Persist to disk first (gives restart persistence), then ingest
    #    storage_service validates magic bytes and generates a safe UUID filename.
    try:
        file_info = await _storage.save_pdf(data, file.filename or "upload.pdf")
        persistent_path = file_info.absolute_path
        storage_key = file_info.storage_key
        logger.info(f"PDF saved to disk: {persistent_path}")
    except Exception as exc:
        logger.warning(f"Disk persistence failed ({exc}); falling back to temp file")
        persistent_path = None
        storage_key = None

    if persistent_path and persistent_path.exists():
        ingest_path = persistent_path
        cleanup_after = False
    else:
        # Fallback: temp file (not persistent across restarts)
        import tempfile as _tempfile
        tmp = _tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.write(data)
        tmp.close()
        ingest_path = Path(tmp.name)
        cleanup_after = True

    try:
        ingestion = get_ingestion_pipeline()
        result: Dict[str, Any] = await ingestion.ingest_file(ingest_path)
    except Exception as exc:
        if cleanup_after:
            ingest_path.unlink(missing_ok=True)
        if storage_key:
            try:
                _storage.delete_file(storage_key)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process PDF: {exc}",
        )
    finally:
        if cleanup_after:
            ingest_path.unlink(missing_ok=True)

    ingestion_status = result.get("status", "unknown")

    if ingestion_status == "ocr_required":
        return UploadResponse(
            doc_id=result.get("doc_id", "UNKNOWN"),
            title=result.get("title"),
            status="ocr_required",
            is_scanned=True,
            message=(
                "This PDF appears to be a scanned image without selectable text. "
                "Optical Character Recognition (OCR) is required before it can be indexed."
            ),
        )

    if ingestion_status == "empty_document":
        return UploadResponse(
            doc_id=result.get("doc_id", "UNKNOWN"),
            title=result.get("title"),
            status="empty_document",
            message="The PDF contained no extractable text content.",
        )

    doc_id = result["doc_id"]

    # Register in the shared registry so /documents and /summarize can find it
    register_document(doc_id, {
        "doc_id": doc_id,
        "title": result.get("title", "Unknown"),
        "court": result.get("court", "Unknown"),
        "year": result.get("year", "Unknown"),
        "page_count": result.get("page_count", 0),
        "chunks_indexed": result.get("chunks_indexed", 0),
        "source": "user_upload",
    })

    return UploadResponse(
        doc_id=doc_id,
        title=result.get("title"),
        court=result.get("court"),
        year=result.get("year"),
        page_count=result.get("page_count", 0),
        chunks_indexed=result.get("chunks_indexed", 0),
        is_scanned=False,
        status="success",
    )


# ---------------------------------------------------------------------------
# POST /ask
# ---------------------------------------------------------------------------

@router.post(
    "/ask",
    response_model=AskResponse,
    summary="Ask a Legal Question (Document-Scoped or General Reference)",
    description=(
        "Supports two modes:\n"
        "- 'document' (Mode A): Strictly retrieves from the specified document with page-level citations.\n"
        "- 'general' (Mode B): Answers general statutory, doctrinal, or precedential questions with clear attribution."
    ),
)
async def ask_document(body: AskRequest) -> AskResponse:
    registry = get_document_registry()

    if body.mode == "document":
        if not body.doc_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="doc_id is required in 'document' mode. Please select a document or switch to 'general' mode.",
            )
        if body.doc_id not in registry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document '{body.doc_id}' is not indexed. Upload it first via POST /api/v1/rag/upload.",
            )

    rag = get_rag_pipeline()
    try:
        result = await rag.answer_question(
            query=body.question,
            case_id=body.doc_id,
            top_k=body.top_k,
            mode=body.mode,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG pipeline error: {exc}",
        )

    citations = [
        CitationSchema(
            doc_id=c.get("doc_id", ""),
            chunk_id=c.get("chunk_id", ""),
            chunk_index=c.get("chunk_index", 0),
            page_number=c.get("page_number", 1),
            title=c.get("title"),
            court=c.get("court"),
            year=c.get("year"),
            similarity_score=c.get("similarity_score"),
        )
        for c in result.get("citations", [])
    ]

    return AskResponse(
        query=result["query"],
        mode=result.get("mode", body.mode),
        doc_id=result.get("doc_id", body.doc_id),
        answer=result["answer"],
        citations=citations,
        is_grounded=result.get("is_grounded", False),
        status=result.get("status", "unknown"),
        source_attribution=result.get("source_attribution", "Selected Document Passages"),
        disclaimer=result.get("disclaimer"),
        advocate_cta=result["advocate_cta"],
    )


# ---------------------------------------------------------------------------
# POST /summarize
# ---------------------------------------------------------------------------

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    summary="Summarize a Legal Document",
    description=(
        "Generates a structured 6-part legal summary (Background, Issues, Arguments, "
        "Reasoning, Decision, Legal Principles) grounded in the indexed document."
    ),
)
async def summarize_document(body: SummarizeRequest) -> SummarizeResponse:
    registry = get_document_registry()
    if body.doc_id not in registry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{body.doc_id}' is not indexed. Upload it first via POST /api/v1/rag/upload.",
        )

    rag = get_rag_pipeline()
    try:
        result = await rag.summarize_document(body.doc_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization error: {exc}",
        )

    if result.get("status") == "not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No chunks found for document '{body.doc_id}' in the vector store.",
        )

    return SummarizeResponse(
        doc_id=result["doc_id"],
        title=result.get("title"),
        court=result.get("court"),
        year=result.get("year"),
        total_pages=result.get("total_pages"),
        total_chunks=result.get("total_chunks"),
        summary=result["summary"],
        status=result["status"],
        advocate_cta=result["advocate_cta"],
    )
