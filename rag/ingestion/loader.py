from pathlib import Path
from typing import Any, Dict, List


class DocumentLoader:
    """Loads raw court files (PDF, DOCX, TXT) from local filesystem or object storage."""

    def __init__(self, supported_extensions: List[str] = None) -> None:
        self.supported_extensions = supported_extensions or [".pdf", ".docx", ".txt"]

    def load(self, file_path: Path) -> Dict[str, Any]:
        """Loads a single document and returns raw binary/text with file metadata.

        TODO:
            1. Verify file format and extension against supported types.
            2. Extract basic filesystem metadata (file_name, size, created_at).
            3. Return standard document wrapper dictionary.
        """
        raise NotImplementedError("DocumentLoader.load() will be implemented in Phase 3.")
