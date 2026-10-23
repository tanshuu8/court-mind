import os
import pytest
from pathlib import Path

from app.services.storage_service import (
    LocalFileStorageService,
    InvalidPDFError,
    StoragePathTraversalError,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent


@pytest.mark.asyncio
async def test_storage_service_save_and_retrieve(tmp_path):
    """Verify local file storage persists valid PDF with secure UUID key."""
    service = LocalFileStorageService(storage_dir=tmp_path)
    
    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    stored_info = await service.save_pdf(valid_pdf_bytes, "test_judgment.pdf")

    assert stored_info.storage_key.endswith(".pdf")
    assert stored_info.file_size_bytes == len(valid_pdf_bytes)
    assert stored_info.absolute_path.exists()
    assert stored_info.original_filename == "test_judgment.pdf"
    assert service.file_exists(stored_info.storage_key)

    # Clean up
    deleted = service.delete_file(stored_info.storage_key)
    assert deleted is True
    assert not service.file_exists(stored_info.storage_key)


@pytest.mark.asyncio
async def test_storage_service_rejects_non_pdf(tmp_path):
    """Verify storage service rejects files lacking PDF magic header."""
    service = LocalFileStorageService(storage_dir=tmp_path)
    invalid_bytes = b"Hello, this is just a plain text file pretending to be PDF"

    with pytest.raises(InvalidPDFError):
        await service.save_pdf(invalid_bytes, "fake.pdf")


@pytest.mark.asyncio
async def test_storage_service_rejects_empty_content(tmp_path):
    """Verify storage service rejects 0-byte uploads."""
    service = LocalFileStorageService(storage_dir=tmp_path)

    with pytest.raises(InvalidPDFError):
        await service.save_pdf(b"", "empty.pdf")


def test_storage_service_path_traversal_prevention(tmp_path):
    """Verify storage service blocks path traversal in keys."""
    service = LocalFileStorageService(storage_dir=tmp_path)

    with pytest.raises(StoragePathTraversalError):
        service.get_file_path("../../windows/system32/cmd.exe")
