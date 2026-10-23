"""Document ingestion and parsing subsystem."""

from .loader import DocumentLoader
from .parser import LegalDocumentParser
from .pipeline import LegalIngestionPipeline

__all__ = ["DocumentLoader", "LegalDocumentParser", "LegalIngestionPipeline"]
