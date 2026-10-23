import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


class ScannedDocumentError(ValueError):
    """Raised when a PDF contains no extractable text layer and requires OCR."""
    pass


class DocumentLoader:
    """Loads raw court files (PDF, DOCX, TXT) from local filesystem.
    
    Preserves page boundaries, page counts, and filesystem metadata.
    Explicitly detects scanned image-only PDFs and flags that OCR is required.
    """

    def __init__(self, supported_extensions: Optional[List[str]] = None) -> None:
        self.supported_extensions = [
            ext.lower() if ext.startswith(".") else f".{ext.lower()}"
            for ext in (supported_extensions or [".pdf", ".docx", ".txt"])
        ]

    def load(self, file_path: Union[str, Path], fail_on_scanned: bool = False) -> Dict[str, Any]:
        """Loads a single document and returns text content with page-level metadata.

        Args:
            file_path: Path to the target document.
            fail_on_scanned: If True, raises ScannedDocumentError when a scanned PDF is detected.

        Returns:
            Dict containing `content`, `pages`, and `metadata`.
        """
        path = Path(file_path).resolve()
        if not path.exists():
            raise FileNotFoundError(f"Document file does not exist: {path}")
        if not path.is_file():
            raise ValueError(f"Path is not a regular file: {path}")

        ext = path.suffix.lower()
        if ext not in self.supported_extensions:
            raise ValueError(
                f"Unsupported file extension '{ext}'. Supported: {self.supported_extensions}"
            )

        stat = path.stat()
        file_meta: Dict[str, Any] = {
            "source": str(path),
            "file_name": path.name,
            "file_stem": path.stem,
            "file_size": stat.st_size,
            "extension": ext,
            "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        }

        content, pages, is_scanned = self._extract_content_and_pages(path, ext)

        file_meta["page_count"] = len(pages)
        file_meta["is_scanned"] = is_scanned
        file_meta["ocr_required"] = is_scanned

        if is_scanned and fail_on_scanned:
            raise ScannedDocumentError(
                f"Document '{path.name}' appears to be a scanned image-only PDF without "
                "selectable text. Optical Character Recognition (OCR) is required before indexing."
            )

        return {
            "content": content,
            "pages": pages,
            "is_scanned": is_scanned,
            "ocr_required": is_scanned,
            "metadata": file_meta,
        }

    def load_directory(
        self, dir_path: Union[str, Path], recursive: bool = False
    ) -> List[Dict[str, Any]]:
        """Loads all supported documents from a directory.

        Args:
            dir_path: Path to directory.
            recursive: If True, recursively traverse subdirectories.

        Returns:
            List of loaded document dictionaries.
        """
        directory = Path(dir_path).resolve()
        if not directory.exists() or not directory.is_dir():
            raise NotADirectoryError(f"Directory not found: {directory}")

        pattern = "**/*" if recursive else "*"
        documents: List[Dict[str, Any]] = []

        for p in sorted(directory.glob(pattern)):
            if p.is_file() and p.suffix.lower() in self.supported_extensions:
                try:
                    doc = self.load(p, fail_on_scanned=False)
                    documents.append(doc)
                except Exception:
                    continue

        return documents

    def _extract_content_and_pages(
        self, path: Path, ext: str
    ) -> tuple[str, List[Dict[str, Any]], bool]:
        """Internal helper to extract text and page structures by format."""
        if ext == ".txt":
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = path.read_text(encoding="utf-8", errors="replace")

            pages = [{"page_number": 1, "text": text, "char_count": len(text)}]
            return text, pages, False

        elif ext == ".pdf":
            pages: List[Dict[str, Any]] = []
            
            # Attempt fitz (PyMuPDF)
            try:
                import fitz
                doc = fitz.open(str(path))
                for page_idx, page in enumerate(doc):
                    page_text = page.get_text() or ""
                    pages.append({
                        "page_number": page_idx + 1,
                        "text": page_text,
                        "char_count": len(page_text.strip()),
                    })
                doc.close()
            except ImportError:
                # Fallback to pypdf
                try:
                    import pypdf
                    reader = pypdf.PdfReader(str(path))
                    for page_idx, page in enumerate(reader.pages):
                        page_text = page.extract_text() or ""
                        pages.append({
                            "page_number": page_idx + 1,
                            "text": page_text,
                            "char_count": len(page_text.strip()),
                        })
                except ImportError:
                    raise ImportError(
                        "Reading PDF files requires 'pymupdf' or 'pypdf'. "
                        "Install with: pip install pymupdf"
                    )

            # Analyze text yield across all pages to detect scanned PDFs
            total_chars = sum(p["char_count"] for p in pages)
            pages_with_content = sum(1 for p in pages if p["char_count"] >= 25)

            is_scanned = (len(pages) > 0 and (total_chars == 0 or pages_with_content == 0))
            full_content = "\n\n".join(p["text"] for p in pages if p["text"].strip())

            return full_content, pages, is_scanned

        elif ext == ".docx":
            try:
                import docx
                doc = docx.Document(str(path))
                text = "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
                pages = [{"page_number": 1, "text": text, "char_count": len(text)}]
                return text, pages, False
            except ImportError:
                raise ImportError(
                    "Reading DOCX files requires 'python-docx'. "
                    "Install with: pip install python-docx"
                )

        raise ValueError(f"No extractor registered for {ext}")
