from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.chunking.splitter import LegalSemanticChunker
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever


class LegalIngestionPipeline:
    """Decoupled Document Ingestion Pipeline for CourtMind Legal RAG.

    Coordinates document loading, legal metadata extraction, page-aware chunking,
    dense vector embedding generation, and indexing into PgVectorRetriever.
    Handles scanned PDFs explicitly by reporting OCR requirement without indexing empty content.
    """

    def __init__(
        self,
        loader: Optional[DocumentLoader] = None,
        parser: Optional[LegalDocumentParser] = None,
        chunker: Optional[LegalSemanticChunker] = None,
        embedder: Optional[TextEmbedder] = None,
        retriever: Optional[PgVectorRetriever] = None,
    ) -> None:
        self.loader = loader or DocumentLoader()
        self.parser = parser or LegalDocumentParser()
        self.chunker = chunker or LegalSemanticChunker()
        self.embedder = embedder or TextEmbedder()
        self.retriever = retriever or PgVectorRetriever()

    async def ingest_file(self, file_path: Union[str, Path]) -> Dict[str, Any]:
        """Loads, parses, chunks, embeds, and indexes a single document file."""
        raw_doc = self.loader.load(file_path)
        return await self.ingest_raw_document(raw_doc)

    async def ingest_directory(
        self, dir_path: Union[str, Path], recursive: bool = False
    ) -> Dict[str, Any]:
        """Ingests all valid legal documents from a directory.

        Reports counts of successfully indexed documents vs documents requiring OCR.
        """
        raw_docs = self.loader.load_directory(dir_path, recursive=recursive)
        total_chunks = 0
        ingested_docs = []
        ocr_required_docs = []

        for raw_doc in raw_docs:
            result = await self.ingest_raw_document(raw_doc)
            if result.get("status") == "ocr_required":
                ocr_required_docs.append(result)
            else:
                total_chunks += result.get("chunks_indexed", 0)
                ingested_docs.append(result)

        return {
            "documents_ingested": len(ingested_docs),
            "documents_requiring_ocr": len(ocr_required_docs),
            "total_chunks_indexed": total_chunks,
            "details": ingested_docs,
            "ocr_required_details": ocr_required_docs,
            "status": "success",
        }

    async def ingest_raw_document(self, raw_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Processes and indexes an in-memory document wrapper dictionary."""
        parsed = self.parser.parse(raw_doc)

        # Handle scanned image-only PDF explicitly
        if parsed.get("is_scanned", False):
            return {
                "doc_id": parsed.get("doc_id"),
                "title": parsed.get("title"),
                "court": parsed.get("court"),
                "year": parsed.get("year"),
                "chunks_indexed": 0,
                "is_scanned": True,
                "ocr_required": True,
                "status": "ocr_required",
                "message": "Scanned document detected without selectable text. OCR is required before indexing.",
            }

        # Semantic chunking with page and metadata preservation
        chunks = self.chunker.split_document(parsed)
        if not chunks:
            return {
                "doc_id": parsed.get("doc_id"),
                "title": parsed.get("title"),
                "chunks_indexed": 0,
                "status": "empty_document",
            }

        # Generate embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = self.embedder.embed_texts(chunk_texts)

        # Upsert into vector store
        indexed_count = await self.retriever.upsert_chunks(chunks, embeddings)

        return {
            "doc_id": parsed.get("doc_id"),
            "title": parsed.get("title"),
            "court": parsed.get("court"),
            "year": parsed.get("year"),
            "decision_date": parsed.get("decision_date"),
            "page_count": len(parsed.get("pages", [])),
            "chunks_indexed": indexed_count,
            "status": "success",
        }
