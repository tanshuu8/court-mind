import hashlib
import os
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

from app.core.config import settings


class StorageError(Exception):
    """Base exception for document storage failures."""
    pass


class InvalidPDFError(StorageError):
    """Raised when file does not conform to valid PDF format."""
    pass


class StoragePathTraversalError(StorageError):
    """Raised when an attempted path traversal is detected."""
    pass


@dataclass
class StoredFileInfo:
    storage_key: str
    absolute_path: Path
    file_size_bytes: int
    content_hash: str
    original_filename: str


class BaseStorageService(ABC):
    """Abstract interface for document file storage (local disk or cloud object storage)."""

    @abstractmethod
    async def save_pdf(self, content: bytes, original_filename: str) -> StoredFileInfo:
        """Saves PDF bytes securely and returns metadata."""
        pass

    @abstractmethod
    def get_file_path(self, storage_key: str) -> Path:
        """Resolves storage key to accessible path."""
        pass

    @abstractmethod
    def file_exists(self, storage_key: str) -> bool:
        """Checks if a file exists for the storage key."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> bool:
        """Deletes stored file by storage key."""
        pass


class LocalFileStorageService(BaseStorageService):
    """Secure local persistent storage implementation."""

    def __init__(self, storage_dir: Optional[Union[str, Path]] = None) -> None:
        raw_dir = storage_dir or settings.PDF_STORAGE_DIR
        self.storage_dir = Path(raw_dir).resolve()
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    async def save_pdf(self, content: bytes, original_filename: str) -> StoredFileInfo:
        """Validates and persists PDF bytes with generated unique key."""
        if not content:
            raise InvalidPDFError("PDF content is empty (0 bytes).")

        if len(content) > self.max_bytes:
            raise StorageError(
                f"File size ({len(content)} bytes) exceeds maximum allowed size ({self.max_bytes} bytes)."
            )

        # Validate PDF magic header (%PDF-)
        if not content.startswith(b"%PDF-"):
            raise InvalidPDFError("File lacks valid PDF magic header '%PDF-'.")

        # Compute SHA-256 hash of content
        content_hash = hashlib.sha256(content).hexdigest()

        # Generate secure storage key: UUID4 + .pdf (never use client-supplied filenames)
        storage_key = f"{uuid.uuid4().hex}.pdf"
        target_path = self._resolve_secure_path(storage_key)

        try:
            target_path.write_bytes(content)
        except Exception as exc:
            raise StorageError(f"Failed to write PDF to storage: {exc}")

        return StoredFileInfo(
            storage_key=storage_key,
            absolute_path=target_path,
            file_size_bytes=len(content),
            content_hash=content_hash,
            original_filename=Path(original_filename).name,
        )

    def get_file_path(self, storage_key: str) -> Path:
        """Resolves storage key with path traversal prevention."""
        return self._resolve_secure_path(storage_key)

    def file_exists(self, storage_key: str) -> bool:
        """Checks whether file exists on disk."""
        try:
            path = self._resolve_secure_path(storage_key)
            return path.is_file()
        except StoragePathTraversalError:
            return False

    def delete_file(self, storage_key: str) -> bool:
        """Deletes file safely."""
        try:
            path = self._resolve_secure_path(storage_key)
            if path.is_file():
                path.unlink()
                return True
            return False
        except Exception:
            return False

    def _resolve_secure_path(self, storage_key: str) -> Path:
        """Verifies that the target path does not escape storage_dir."""
        # Detect explicit directory traversal or separator injection
        if ".." in storage_key or "/" in storage_key or "\\" in storage_key:
            raise StoragePathTraversalError(f"Access denied: path traversal attempt for key '{storage_key}'")

        target = (self.storage_dir / storage_key).resolve()

        # Strict containment check
        try:
            target.relative_to(self.storage_dir)
        except ValueError:
            raise StoragePathTraversalError(f"Access denied: path traversal attempt for key '{storage_key}'")

        return target


_storage_service: Optional[LocalFileStorageService] = None


def get_storage_service() -> LocalFileStorageService:
    global _storage_service
    if _storage_service is None:
        _storage_service = LocalFileStorageService()
    return _storage_service
