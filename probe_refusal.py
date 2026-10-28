"""Probe script: inspect live retrieval scores for EVAL-06 and EVAL-23."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline
from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.ingestion.pipeline import LegalIngestionPipeline
from rag.chunking.splitter import LegalSemanticChunker


STOPWORDS = {
    "what", "is", "the", "under", "in", "of", "and", "a", "an", "for", "to",
    "was", "were", "by", "how", "did", "this", "that", "these", "those",
    "case", "about", "judgment", "document", "tell", "me", "give", "explain",
    "describe", "who", "which", "are", "summary", "overview", "matter",
    "please", "can", "you", "does", "do", "laid", "down", "prescribed",
}


def content_words(text):
    import re
    return {w.lower() for w in re.findall(r"\w+", text) if w.lower() not in STOPWORDS and len(w) > 2}


async def probe():
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    llm = LLMClient()
    ingestion = LegalIngestionPipeline(
        loader=DocumentLoader(), parser=LegalDocumentParser(),
        chunker=LegalSemanticChunker(chunk_size=500, chunk_overlap=60),
        embedder=embedder, retriever=retriever,
    )
    pdf_dir = Path("data/legal_judgments")
    await ingestion.ingest_directory(pdf_dir)
    rag = LegalRAGPipeline(embedder=embedder, retriever=retriever, llm_client=llm)

    cases = [
        ("EVAL-06", "What is the capital punishment procedure laid down in this land acquisition judgment?", "CIVIL APPEAL NO. 1615 OF 2023"),
        ("EVAL-23", "What is the maritime exclusive economic zone limit prescribed under this judgment?", "1978 AIR  597"),
        # Positive: real on-topic question that MUST still answer
        ("POSITIVE-A", "Under which statutory provision did the High Court declare the land acquisition lapsed?", "CIVIL APPEAL NO. 1615 OF 2023"),
        ("POSITIVE-B", "Which section of the Passports Act 1967 was challenged in Maneka Gandhi?", "1978 AIR  597"),
    ]

    for label, query, doc_id in cases:
        result = await rag.answer_question(query=query, case_id=doc_id, mode="document")
        passages = result.get("retrieved_passages", [])
        q_words = content_words(query)
        print(f"\n=== {label} ===")
        print(f"Query content words: {sorted(q_words)}")
        print(f"status={result['status']} | citations={len(result['citations'])}")
        for i, c in enumerate(passages[:3]):
            chunk_words = content_words(c["text"])
            overlap = q_words & chunk_words
            sim = c["similarity_score"]
            print(f"  Chunk[{i}] sim={sim:.4f} | overlap={sorted(overlap)} | text[:60]={c['text'][:60].replace(chr(10), ' ')!r}")


asyncio.run(probe())
