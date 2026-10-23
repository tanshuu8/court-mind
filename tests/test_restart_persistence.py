"""Independent verification of PDF persistence across server restarts.

Steps verified:
1. Ingest/upload a new legal PDF through storage service.
2. Confirm persistent file exists on disk in data/stored_documents/ with %PDF- header.
3. Simulate complete server shutdown & memory wipe.
4. Execute server startup sequence (preload_sample_judgments).
5. Verify document and its chunks are restored into registry and vector store.
6. Execute a grounded Q&A query on the restored document.
"""

import asyncio
import os
import shutil
from pathlib import Path

# Set up project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.storage_service import LocalFileStorageService
from app.services.rag_service import (
    preload_sample_judgments,
    get_document_registry,
    get_retriever,
    get_rag_pipeline,
    _get_components,
)


import pytest

@pytest.mark.asyncio
async def test_persistence_restart():
    print("=" * 60)
    print(" VERIFYING PERSISTENCE ACROSS RESTART")
    print("=" * 60)

    # 1. Prepare sample PDF
    src_pdf = PROJECT_ROOT / "data" / "legal_judgments" / "civil case judgemnt.pdf"
    assert src_pdf.exists(), "Source PDF must exist"
    pdf_bytes = src_pdf.read_bytes()

    storage = LocalFileStorageService()
    print(f"[1] Uploading and persisting PDF via LocalFileStorageService...")
    info = await storage.save_pdf(pdf_bytes, "test_upload_civil.pdf")
    print(f"    Saved key: {info.storage_key}")
    print(f"    Disk path: {info.absolute_path}")
    print(f"    File size: {info.file_size_bytes} bytes")
    assert info.absolute_path.exists(), "File must exist on disk"
    assert info.absolute_path.read_bytes().startswith(b"%PDF-"), "Header must be %PDF-"

    # 2. Simulate server shutdown: completely clear memory registry and vector store
    print("\n[2] Simulating server shutdown & memory wipe...")
    _, retriever, _, _, _, _ = _get_components()
    retriever.clear()
    registry = get_document_registry()
    registry.clear()
    print(f"    Registry count after shutdown: {len(registry)}")
    print(f"    Vector store chunks after shutdown: {len(retriever._memory_chunks)}")
    assert len(registry) == 0
    assert len(retriever._memory_chunks) == 0

    # 3. Simulate server restart: trigger startup lifespan preload
    print("\n[3] Simulating server startup (preload_sample_judgments)...")
    summary = await preload_sample_judgments()
    print(f"    Preload summary: bundled={summary.get('bundled', {}).get('status', 'ok')}, uploaded={summary.get('user_uploaded', {}).get('status', 'ok')}")

    # 4. Confirm document was restored from disk
    print("\n[4] Verifying restoration from disk storage...")
    print(f"    Registry documents now: {len(registry)}")
    print(f"    Vector store chunks now: {len(retriever._memory_chunks)}")
    assert len(registry) > 0, "Documents must be restored in registry"
    assert len(retriever._memory_chunks) > 0, "Chunks must be restored in vector store"

    # Find the restored test document ID
    test_doc_ids = [d_id for d_id, meta in registry.items() if "1615" in d_id or "Rajesh" in meta.get("title", "")]
    print(f"    Found restored document IDs: {test_doc_ids}")
    assert len(test_doc_ids) > 0, "Target document must be queryable"

    # 5. Query the restored document
    print("\n[5] Executing Q&A query on restored document...")
    rag = get_rag_pipeline()
    target_doc = test_doc_ids[0]
    result = await rag.answer_question(
        query="Under which statutory provision did the High Court declare the acquisition to have lapsed?",
        case_id=target_doc,
        top_k=3,
        mode="document",
    )
    print(f"    Status: {result.get('status')}")
    print(f"    Citations count: {len(result.get('citations', []))}")
    print(f"    Top citation: Page {result.get('citations', [{}])[0].get('page_number')}")
    print(f"    Answer snippet: {result.get('answer', '')[:200]}...")
    assert len(result.get("citations", [])) > 0, "Must return citations"

    # 6. Cleanup the test file from data/stored_documents/
    print("\n[6] Cleaning up test file...")
    storage.delete_file(info.storage_key)
    print("    Cleanup complete. Persistence verification PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_persistence_restart())
