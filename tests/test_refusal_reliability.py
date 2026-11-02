"""Regression and positive tests for the topic-coherence refusal gate.

Covers:
- EVAL-06 regression: capital punishment asked against a land-acquisition judgment.
- EVAL-23 regression: maritime EEZ asked against the Maneka Gandhi judgment.
- Positive: genuine on-topic questions that MUST still produce answers with citations.
- Edge: the topic-coherence gate itself (_has_topic_coherence) directly.

Tests do NOT hardcode question IDs or rely on the evaluation dataset strings.  They
test the underlying mechanism using semantically similar but independently phrased
inputs, confirming the fix is generalised.
"""
import pytest
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline, _content_words


# ---------------------------------------------------------------------------
# Unit tests for _content_words and _has_topic_coherence
# ---------------------------------------------------------------------------

def test_content_words_removes_stopwords():
    result = _content_words("What is the procedure laid down in this judgment?")
    # "What", "is", "the", "laid", "down", "in", "this" are all stopwords
    assert "procedure" in result
    assert "judgment" not in result   # "judgment" is in stopwords
    assert "is" not in result
    assert "what" not in result


def test_content_words_minimum_length():
    result = _content_words("IPC CrPC law")
    # "law" has 3 chars — included; single/double char tokens excluded by regex
    assert "law" in result


def test_has_topic_coherence_matching_topic():
    """Pipeline gate returns True when query words appear in chunks."""
    rag = LegalRAGPipeline()
    chunks = [{"text": "The passport was impounded under Section 10(3)(c) of the Passports Act 1967."}]
    assert rag._has_topic_coherence("Which section of the Passports Act was challenged?", chunks) is True


def test_has_topic_coherence_zero_overlap():
    """Pipeline gate returns False when query words are entirely absent from all chunks."""
    rag = LegalRAGPipeline()
    # Chunks are entirely about land acquisition; query is about maritime zones
    chunks = [
        {"text": "Possession of the agricultural land was taken on 22.09.1997 under Section 16."},
        {"text": "The acquisition proceedings were initiated under the Land Acquisition Act 1894."},
        {"text": "Compensation was not deposited in the civil court treasury."},
    ]
    assert rag._has_topic_coherence(
        "What is the exclusive economic zone limit under maritime law?", chunks
    ) is False


def test_has_topic_coherence_empty_query_allows_through():
    """Degenerate empty query must not crash — gate returns True (allow through)."""
    rag = LegalRAGPipeline()
    chunks = [{"text": "Some legal text about courts and procedure."}]
    assert rag._has_topic_coherence("", chunks) is True


def test_has_topic_coherence_no_chunks():
    """Empty chunk list with a real query — no chunks means False."""
    rag = LegalRAGPipeline()
    assert rag._has_topic_coherence("What is the passport impoundment procedure?", []) is False


# ---------------------------------------------------------------------------
# Integration tests (require real PDF ingestion — slower, marked accordingly)
# These use the real ingestion + retrieval pipeline against bundled PDFs.
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def ingested_pipeline():
    """Shared fixture: ingest all bundled judgments once per module."""
    import asyncio
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")
    from backend.app.core.config import settings
    from rag.ingestion.loader import DocumentLoader
    from rag.ingestion.parser import LegalDocumentParser
    from rag.ingestion.pipeline import LegalIngestionPipeline
    from rag.chunking.splitter import LegalSemanticChunker

    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    llm = LLMClient(
        provider=settings.LLM_PROVIDER,
        model_name=settings.LLM_MODEL_NAME,
        api_key=settings.GEMINI_API_KEY,
        temperature=settings.LLM_TEMPERATURE,
        timeout=settings.LLM_TIMEOUT,
        max_retries=settings.LLM_MAX_RETRIES,
        max_output_tokens=settings.LLM_MAX_OUTPUT_TOKENS,
    )

    ingestion = LegalIngestionPipeline(
        loader=DocumentLoader(),
        parser=LegalDocumentParser(),
        chunker=LegalSemanticChunker(chunk_size=1200, chunk_overlap=150),
        embedder=embedder,
        retriever=retriever,
    )

    pdf_dir = Path(__file__).resolve().parent.parent / "data" / "legal_judgments"
    asyncio.run(ingestion.ingest_directory(pdf_dir))

    rag = LegalRAGPipeline(embedder=embedder, retriever=retriever, llm_client=llm)
    return rag


@pytest.mark.asyncio
async def test_regression_capital_punishment_refused_against_land_acquisition(ingested_pipeline):
    """EVAL-06 regression: capital punishment query must be refused against the
    land-acquisition judgment.  The topic-coherence gate and the llm_client guard
    must both prevent a fabricated answer."""
    rag = ingested_pipeline
    result = await rag.answer_question(
        query="What is the capital punishment procedure described in this land acquisition judgment?",
        case_id="CIVIL APPEAL NO. 1615 OF 2023",
        mode="document",
    )
    assert result["status"] == "insufficient_evidence", (
        f"Expected refusal for off-topic capital punishment query against land-acquisition doc, "
        f"got status={result['status']!r}, answer={result['answer'][:120]!r}"
    )
    assert result["citations"] == [], "Refused response must have no citations"
    assert result["is_grounded"] is False


@pytest.mark.asyncio
async def test_regression_maritime_eez_refused_against_maneka_gandhi(ingested_pipeline):
    """EVAL-23 regression: maritime/EEZ query must be refused against the
    Maneka Gandhi judgment.  None of the chunks in that passport-rights judgment
    contain maritime or EEZ terminology."""
    rag = ingested_pipeline
    result = await rag.answer_question(
        query="What is the maritime exclusive economic zone limit prescribed in this judgment?",
        case_id="1978 AIR  597",
        mode="document",
    )
    assert result["status"] == "insufficient_evidence", (
        f"Expected refusal for maritime EEZ query against Maneka Gandhi doc, "
        f"got status={result['status']!r}, answer={result['answer'][:120]!r}"
    )
    assert result["citations"] == []
    assert result["is_grounded"] is False


@pytest.mark.asyncio
async def test_regression_patent_law_refused_against_bachan_singh(ingested_pipeline):
    """Generalisation check: patent law asked against the Bachan Singh criminal
    judgment must also be refused via the topic-coherence gate."""
    rag = ingested_pipeline
    result = await rag.answer_question(
        query="What are the rules for calculating patent infringement damages described here?",
        case_id="1980 AIR  267",
        mode="document",
    )
    assert result["status"] == "insufficient_evidence", (
        f"Expected refusal for patent query against Bachan Singh doc, "
        f"got status={result['status']!r}"
    )
    assert result["citations"] == []


@pytest.mark.asyncio
async def test_positive_passport_section_answered(ingested_pipeline):
    """Positive: a genuine on-topic question about the Passports Act section
    challenged in Maneka Gandhi must still produce a grounded answer with citations."""
    rag = ingested_pipeline
    result = await rag.answer_question(
        query="Which section of the Passports Act 1967 was challenged in this case?",
        case_id="1978 AIR  597",
        mode="document",
    )
    assert result["status"] == "success", (
        f"Expected success for on-topic passport query, got {result['status']!r}"
    )
    assert len(result["citations"]) > 0, "On-topic answer must have citations"
    assert result["is_grounded"] is True


@pytest.mark.asyncio
async def test_positive_land_acquisition_lapse_answered(ingested_pipeline):
    """Positive: a genuine question about the Section 24(2) lapse in the civil
    appeal must still be answered with citations — not refused."""
    rag = ingested_pipeline
    result = await rag.answer_question(
        query="Under which statutory provision did the High Court declare the acquisition lapsed?",
        case_id="CIVIL APPEAL NO. 1615 OF 2023",
        mode="document",
    )
    assert result["status"] == "success", (
        f"Expected success for land-acquisition lapse query, got {result['status']!r}"
    )
    assert len(result["citations"]) > 0


@pytest.mark.asyncio
async def test_positive_bachan_singh_crpc_sections_answered(ingested_pipeline):
    """Positive: a genuine procedural question about CrPC sections in the Bachan
    Singh criminal appeal must produce a grounded answer."""
    rag = ingested_pipeline
    result = await rag.answer_question(
        query="Which procedural sections of the Code of Criminal Procedure were discussed in this case?",
        case_id="1980 AIR  267",
        mode="document",
    )
    assert result["status"] == "success", (
        f"Expected success for CrPC sections query against Bachan Singh, got {result['status']!r}"
    )
    assert len(result["citations"]) > 0
