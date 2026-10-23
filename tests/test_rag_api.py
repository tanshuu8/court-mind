"""Integration and regression tests for CourtMind Legal RAG FastAPI endpoints.

Tests:
1. Document listing (GET /api/v1/rag/documents)
2. File upload validations (empty file -> 400, non-pdf -> 415)
3. PDF upload and indexing (POST /api/v1/rag/upload)
4. Grounded question answering (POST /api/v1/rag/ask)
5. Out-of-domain question handling (POST /api/v1/rag/ask)
6. Document summarization (POST /api/v1/rag/summarize)
7. Error handling for non-existent documents (404)
"""
import sys
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

# Ensure both project root and backend are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.services.rag_service import register_document, get_document_registry


REAL_PDF_DIR = PROJECT_ROOT / "data" / "legal_judgments"
CIVIL_PDF = REAL_PDF_DIR / "civil case judgemnt.pdf"


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_get_documents_empty_or_preloaded():
    """Verify documents endpoint returns 200 and well-structured response."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/rag/documents")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "documents" in data
        assert data["storage_type"] == "in-memory"
        assert "persistence_note" in data
        assert isinstance(data["documents"], list)


@pytest.mark.asyncio
async def test_upload_non_pdf_rejected():
    """Verify non-PDF file upload returns 415 Unsupported Media Type."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("notes.txt", b"Some plain text notes", "text/plain")}
        resp = await client.post("/api/v1/rag/upload", files=files)
        assert resp.status_code == 415
        assert "Only PDF files are accepted" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_empty_file_rejected():
    """Verify uploading an empty file returns 400 Bad Request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("empty.pdf", b"", "application/pdf")}
        resp = await client.post("/api/v1/rag/upload", files=files)
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_real_pdf_and_ask():
    """Upload real civil judgment PDF, verify 201 Created and successful indexing,
    then ask a grounded question about interest on solatium."""
    assert CIVIL_PDF.exists(), f"Civil judgment PDF must exist at {CIVIL_PDF}"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Upload PDF
        with open(CIVIL_PDF, "rb") as f:
            pdf_bytes = f.read()

        files = {"file": ("civil_appeal_1615.pdf", pdf_bytes, "application/pdf")}
        upload_resp = await client.post("/api/v1/rag/upload", files=files)
        assert upload_resp.status_code == 201
        upload_data = upload_resp.json()

        doc_id = upload_data["doc_id"]
        assert doc_id is not None
        assert upload_data["status"] == "success"
        assert upload_data["chunks_indexed"] > 0
        assert upload_data["page_count"] > 0

        # 2. Verify document is now in registry
        docs_resp = await client.get("/api/v1/rag/documents")
        assert docs_resp.status_code == 200
        doc_ids = [d["doc_id"] for d in docs_resp.json()["documents"]]
        assert doc_id in doc_ids

        # 3. Ask question about interest on solatium
        ask_payload = {
            "doc_id": doc_id,
            "question": "Does the court grant interest on solatium under the Land Acquisition Act?",
            "top_k": 5,
        }
        ask_resp = await client.post("/api/v1/rag/ask", json=ask_payload)
        assert ask_resp.status_code == 200
        ask_data = ask_resp.json()

        assert "answer" in ask_data
        assert "citations" in ask_data
        assert "advocate_cta" in ask_data
        assert ask_data["query"] == ask_payload["question"]
        # Grounded citations should include page numbers
        if ask_data["is_grounded"]:
            assert len(ask_data["citations"]) > 0
            for cit in ask_data["citations"]:
                assert "page_number" in cit
                assert cit["page_number"] >= 1
                assert cit["doc_id"] == doc_id


@pytest.mark.asyncio
async def test_ask_non_existent_document():
    """Verify asking about an un-indexed document returns 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "doc_id": "NON-EXISTENT-DOC-9999",
            "question": "What is the ratio decidendi in this case?",
            "top_k": 3,
        }
        resp = await client.post("/api/v1/rag/ask", json=payload)
        assert resp.status_code == 404
        assert "not indexed" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_summarize_real_pdf():
    """Verify document summarization returns structured sections and advocate CTA."""
    assert CIVIL_PDF.exists()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # First ensure it's registered
        registry = get_document_registry()
        # Find any available doc_id or upload
        if not registry:
            with open(CIVIL_PDF, "rb") as f:
                files = {"file": ("civil_test.pdf", f.read(), "application/pdf")}
                up_resp = await client.post("/api/v1/rag/upload", files=files)
                doc_id = up_resp.json()["doc_id"]
        else:
            doc_id = list(registry.keys())[0]

        sum_resp = await client.post("/api/v1/rag/summarize", json={"doc_id": doc_id})
        assert sum_resp.status_code == 200
        sum_data = sum_resp.json()

        assert sum_data["doc_id"] == doc_id
        assert "summary" in sum_data
        assert len(sum_data["summary"]) > 50
        assert "advocate_cta" in sum_data
        assert sum_data["status"] == "success"


@pytest.mark.asyncio
async def test_summarize_non_existent_doc():
    """Verify summarizing an unknown document returns 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/rag/summarize", json={"doc_id": "DOES-NOT-EXIST"})
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_ask_document_mode_requires_doc_id():
    """Verify Mode A (document mode) without doc_id returns 400 Bad Request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "mode": "document",
            "question": "What is the ratio decidendi in this case?",
        }
        resp = await client.post("/api/v1/rag/ask", json=payload)
        assert resp.status_code == 400
        assert "doc_id is required" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_ask_mode_b_general_legal_question():
    """Verify Mode B (General Legal Questions) provides authoritative statutory explanation
    without querying or inventing citations from any uploaded document."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "mode": "general",
            "question": "What does Section 302 IPC mean?",
        }
        resp = await client.post("/api/v1/rag/ask", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["mode"] == "general"
        assert data["status"] == "success"
        assert data["is_grounded"] is False
        assert data["citations"] == []
        assert "General Legal Reference" in data["source_attribution"]
        assert data["disclaimer"] is not None
        assert "murder" in data["answer"].lower()
        assert "300" in data["answer"] or "punished with death" in data["answer"].lower()


@pytest.mark.asyncio
async def test_ask_mode_b_rarest_of_rare_doctrine():
    """Verify Mode B answers landmark doctrinal queries (Bachan Singh 1980 Constitution Bench)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "mode": "general",
            "question": "What is the rarest of rare doctrine?",
        }
        resp = await client.post("/api/v1/rag/ask", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        assert data["mode"] == "general"
        assert "rarest of rare" in data["answer"].lower()
        assert "1980" in data["answer"]
        assert "constitution bench" in data["answer"].lower()
        assert "mitigating" in data["answer"].lower()
        assert "aggravating" in data["answer"].lower()
        assert data["citations"] == []


@pytest.mark.asyncio
async def test_bachan_singh_1979_document_questions():
    """Upload Bachan Singh 1979 PDF (criminal case judgemnt.pdf) and verify:
    1. Case overview question ('What is this case about?') is answered with grounded facts.
    2. Specific party question ('Who is Bachan Singh?') is grounded.
    3. Unsupported doctrine ('rarest of rare') is REFUSED with an informative explanation
       noting that this 1979 judgment is a 2-judge procedural proceeding, not the 1980 Constitution bench."""
    criminal_pdf = REAL_PDF_DIR / "criminal case judgemnt.pdf"
    assert criminal_pdf.exists(), f"Criminal judgment PDF must exist at {criminal_pdf}"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Upload Bachan Singh 1979 PDF
        with open(criminal_pdf, "rb") as f:
            files = {"file": ("bachan_singh_1979.pdf", f.read(), "application/pdf")}
            up_resp = await client.post("/api/v1/rag/upload", files=files)
            assert up_resp.status_code == 201
            doc_id = up_resp.json()["doc_id"]

        # 2. Ask "What is this case about?" in document mode
        overview_resp = await client.post(
            "/api/v1/rag/ask",
            json={"doc_id": doc_id, "mode": "document", "question": "What is this case about?"},
        )
        assert overview_resp.status_code == 200
        overview_data = overview_resp.json()
        assert overview_data["is_grounded"] is True
        assert overview_data["status"] == "success"
        assert len(overview_data["citations"]) > 0
        assert "appeal" in overview_data["answer"].lower() or "conviction" in overview_data["answer"].lower()

        # 3. Ask "Who is Bachan Singh?" in document mode
        who_resp = await client.post(
            "/api/v1/rag/ask",
            json={"doc_id": doc_id, "mode": "document", "question": "Who is Bachan Singh?"},
        )
        assert who_resp.status_code == 200
        who_data = who_resp.json()
        assert who_data["is_grounded"] is True
        assert who_data["status"] == "success"
        assert "bachan singh" in who_data["answer"].lower()

        # 4. Ask unsupported question "What is the rarest of rare doctrine?"
        doctrine_resp = await client.post(
            "/api/v1/rag/ask",
            json={"doc_id": doc_id, "mode": "document", "question": "What is the rarest of rare doctrine?"},
        )
        assert doctrine_resp.status_code == 200
        doctrine_data = doctrine_resp.json()
        assert doctrine_data["is_grounded"] is False
        assert doctrine_data["status"] == "insufficient_evidence"
        assert doctrine_data["citations"] == []
        # Answer must explicitly mention 1979 vs 1980 distinction
        assert "1979" in doctrine_data["answer"]
        assert "1980" in doctrine_data["answer"]
        assert "general legal question" in doctrine_data["answer"].lower()

