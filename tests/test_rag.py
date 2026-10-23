import math
import pytest
from pathlib import Path

from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.ingestion.pipeline import LegalIngestionPipeline
from rag.chunking.splitter import LegalSemanticChunker
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline
from rag.evaluation.evaluator import RAGEvaluator

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SAMPLE_DATA_DIR = PROJECT_ROOT / "data" / "sample_judgments"


def test_document_loader_single_file():
    """Verify DocumentLoader loads text and preserves file metadata."""
    loader = DocumentLoader()
    sample_file = SAMPLE_DATA_DIR / "kesavananda_bharati_1973.txt"
    assert sample_file.exists(), "Sample judgment file must exist"

    doc = loader.load(sample_file)
    assert "content" in doc
    assert "metadata" in doc
    assert len(doc["content"]) > 100
    assert doc["metadata"]["file_name"] == "kesavananda_bharati_1973.txt"
    assert doc["metadata"]["extension"] == ".txt"
    assert doc["metadata"]["file_size"] > 0
    assert "source" in doc["metadata"]


def test_document_loader_directory():
    """Verify DocumentLoader loads all files from directory."""
    loader = DocumentLoader()
    docs = loader.load_directory(SAMPLE_DATA_DIR)
    assert len(docs) >= 3
    file_names = {d["metadata"]["file_name"] for d in docs}
    assert "kesavananda_bharati_1973.txt" in file_names
    assert "puttaswamy_privacy_2017.txt" in file_names
    assert "maneka_gandhi_passport_1978.txt" in file_names


def test_legal_document_parser_metadata_preservation():
    """Verify LegalDocumentParser extracts and preserves court, year, date, doc_id, and title."""
    loader = DocumentLoader()
    parser = LegalDocumentParser()

    raw_doc = loader.load(SAMPLE_DATA_DIR / "kesavananda_bharati_1973.txt")
    parsed = parser.parse(raw_doc)

    assert parsed["doc_id"] == "SCI-1973-WP-135"
    assert "Kesavananda Bharati" in parsed["title"]
    assert parsed["court"] == "Supreme Court of India"
    assert parsed["year"] == "1973"
    assert "24 April 1973" in parsed["decision_date"]
    assert "AIR 1973 SC 1461" in parsed["source"]
    assert "text" in parsed and len(parsed["text"]) > 0

    # Ensure metadata bundle retains all keys
    meta = parsed["metadata"]
    assert meta["doc_id"] == parsed["doc_id"]
    assert meta["title"] == parsed["title"]
    assert meta["court"] == parsed["court"]
    assert meta["year"] == parsed["year"]


def test_legal_semantic_chunker_metadata_and_stable_ids():
    """Verify chunker creates stable chunk IDs, respects paragraphs, and retains metadata."""
    loader = DocumentLoader()
    parser = LegalDocumentParser()
    chunker = LegalSemanticChunker(chunk_size=400, chunk_overlap=50)

    raw_doc = loader.load(SAMPLE_DATA_DIR / "puttaswamy_privacy_2017.txt")
    parsed = parser.parse(raw_doc)
    chunks = chunker.split_document(parsed)

    assert len(chunks) > 1

    for idx, chunk in enumerate(chunks):
        # Stable ID format test (supports page-attributed format e.g. #p001_c0000 or #chunk_0000)
        expected_ids = [f"{parsed['doc_id']}#chunk_{idx:04d}", f"{parsed['doc_id']}#p001_c{idx:04d}"]
        assert chunk["chunk_id"] in expected_ids
        assert chunk["doc_id"] == parsed["doc_id"]
        assert chunk["chunk_index"] == idx
        assert len(chunk["text"]) > 0

        # Metadata preservation check
        meta = chunk["metadata"]
        assert meta["doc_id"] == parsed["doc_id"]
        assert meta["title"] == parsed["title"]
        assert meta["court"] == parsed["court"]
        assert meta["year"] == parsed["year"]
        assert meta["chunk_id"] == chunk["chunk_id"]
        assert meta["chunk_index"] == idx
        assert meta["char_length"] == len(chunk["text"])


def test_text_embedder_unit_normalization_and_dimension():
    """Verify TextEmbedder outputs unit-normalized vectors of expected dimension."""
    embedder = TextEmbedder(dimension=384)
    texts = [
        "The Constitution of India guarantees equality under Article 14.",
        "Privacy is a fundamental right under Article 21.",
    ]
    vectors = embedder.embed_texts(texts)

    assert len(vectors) == 2
    for vec in vectors:
        assert len(vec) == 384
        # Verify L2 unit norm
        norm = math.sqrt(sum(x * x for x in vec))
        assert abs(norm - 1.0) < 1e-4

    # Verify query embedding
    q_vec = embedder.embed_query("equality before law")
    assert len(q_vec) == 384
    q_norm = math.sqrt(sum(x * x for x in q_vec))
    assert abs(q_norm - 1.0) < 1e-4


@pytest.mark.asyncio
async def test_pgvector_retriever_upsert_and_search():
    """Verify PgVectorRetriever indexes chunks and performs similarity search with filtering."""
    retriever = PgVectorRetriever()
    retriever.clear()
    embedder = TextEmbedder()

    chunks = [
        {
            "chunk_id": "TEST#chunk_0000",
            "doc_id": "TEST",
            "chunk_index": 0,
            "text": "The basic structure doctrine prevents Parliament from destroying constitutional essentials.",
            "metadata": {"doc_id": "TEST", "court": "Supreme Court", "year": "1973"},
        },
        {
            "chunk_id": "TEST#chunk_0001",
            "doc_id": "TEST",
            "chunk_index": 1,
            "text": "Article 21 guarantees life and personal liberty to all persons.",
            "metadata": {"doc_id": "TEST", "court": "Supreme Court", "year": "1978"},
        },
        {
            "chunk_id": "OTHER#chunk_0000",
            "doc_id": "OTHER",
            "chunk_index": 0,
            "text": "Taxation laws under the Income Tax Act 1961 require annual assessment filings.",
            "metadata": {"doc_id": "OTHER", "court": "High Court", "year": "2020"},
        },
    ]

    embeddings = embedder.embed_texts([c["text"] for c in chunks])
    upserted = await retriever.upsert_chunks(chunks, embeddings)
    assert upserted == 3

    # Query 1: search for basic structure
    q_vec = embedder.embed_query("basic structure doctrine of constitution")
    results = await retriever.search_similar(q_vec, top_k=2)

    assert len(results) == 2
    assert results[0]["chunk_id"] == "TEST#chunk_0000"
    assert results[0]["similarity_score"] > results[1]["similarity_score"]

    # Filtered search: only High Court
    hc_results = await retriever.search_similar(q_vec, top_k=5, filters={"court": "High Court"})
    assert len(hc_results) == 1
    assert hc_results[0]["chunk_id"] == "OTHER#chunk_0000"


@pytest.mark.asyncio
async def test_legal_rag_pipeline_grounded_answer_with_citations():
    """Verify pipeline answers grounded queries with verifiable citations."""
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    retriever.clear()

    ingestion = LegalIngestionPipeline(embedder=embedder, retriever=retriever)
    await ingestion.ingest_directory(SAMPLE_DATA_DIR)

    rag = LegalRAGPipeline(embedder=embedder, retriever=retriever)

    # Grounded Query
    query = "What did the Court hold regarding the Basic Structure Doctrine in Kesavananda Bharati?"
    response = await rag.answer_question(query, top_k=3)

    assert response["is_grounded"] is True
    assert response["status"] == "success"
    assert len(response["citations"]) > 0
    assert "basic structure" in response["answer"].lower()
    assert any("Kesavananda Bharati" in cit["title"] for cit in response["citations"])


@pytest.mark.asyncio
async def test_legal_rag_pipeline_unanswerable_question():
    """Verify pipeline explicitly refuses when documents do not establish the answer."""
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    retriever.clear()

    ingestion = LegalIngestionPipeline(embedder=embedder, retriever=retriever)
    await ingestion.ingest_directory(SAMPLE_DATA_DIR)

    rag = LegalRAGPipeline(embedder=embedder, retriever=retriever)

    # Unanswerable query completely unrelated to the sample judgments
    query = "What damages were awarded in the 2024 maritime oil spill arbitration in Singapore?"
    response = await rag.answer_question(query, top_k=3)

    assert response["is_grounded"] is False
    assert "The available documents do not establish the answer" in response["answer"]
    assert response["citations"] == []


def test_rag_evaluator_retrieval_and_generation():
    """Verify RAGEvaluator computes Hit@K, MRR, and Faithfulness metrics."""
    evaluator = RAGEvaluator()

    # Retrieval evaluation
    retrieval_metrics = evaluator.evaluate_retrieval(
        ground_truth_chunks=["DOC#chunk_0002"],
        retrieved_chunks=["DOC#chunk_0001", "DOC#chunk_0002", "DOC#chunk_0003"],
    )
    assert retrieval_metrics["hit_rate_at_1"] == 0.0
    assert retrieval_metrics["hit_rate_at_3"] == 1.0
    assert retrieval_metrics["mrr"] == 0.5  # Rank 2 -> 1/2 = 0.5

    # Generation evaluation (grounded)
    gen_metrics = evaluator.evaluate_generation(
        query="What is basic structure?",
        retrieved_contexts=["The basic structure doctrine preserves constitutional democracy."],
        generated_answer="The basic structure preserves constitutional democracy. [Document: Test, Chunk: 0]",
    )
    assert gen_metrics["faithfulness"] > 0.8
    assert gen_metrics["citation_presence"] == 1.0
    assert gen_metrics["refusal_accuracy"] == 1.0

    # Generation evaluation (refusal)
    refusal_metrics = evaluator.evaluate_generation(
        query="What is the stock price?",
        retrieved_contexts=[],
        generated_answer="The available documents do not establish the answer.",
    )
    assert refusal_metrics["refusal_accuracy"] == 1.0
    assert refusal_metrics["faithfulness"] == 1.0


def test_document_loader_error_handling():
    """Verify loader raises FileNotFoundError for nonexistent paths."""
    loader = DocumentLoader()
    with pytest.raises(FileNotFoundError):
        loader.load(Path("non_existent_case_file_12345.txt"))


def test_chunker_invalid_overlap_raises_error():
    """Verify chunker rejects invalid chunk_overlap >= chunk_size."""
    with pytest.raises(ValueError):
        LegalSemanticChunker(chunk_size=100, chunk_overlap=100)


def test_legal_document_parser_unstructured_fallback():
    """Verify parser gracefully infers metadata when structured headers are absent."""
    parser = LegalDocumentParser()
    raw_doc = {
        "content": (
            "IN THE HIGH COURT OF DELHI\n\n"
            "Ram Lal vs. Shyam Lal\n\n"
            "This petition was filed in 2020 challenging municipal notices.\n"
            "The Court directs respondents to reconsider the application."
        ),
        "metadata": {"source": "manual_entry.txt", "file_stem": "ram_lal_notice"},
    }
    parsed = parser.parse(raw_doc)
    assert parsed["court"] == "High Court of Delhi"
    assert parsed["year"] == "2020"
    assert "Ram Lal" in parsed["title"]
    assert parsed["doc_id"].startswith("DOC-2020-")


@pytest.mark.asyncio
async def test_legal_rag_pipeline_summarize_case():
    """Verify pipeline case summarization functionality."""
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    retriever.clear()

    ingestion = LegalIngestionPipeline(embedder=embedder, retriever=retriever)
    await ingestion.ingest_directory(SAMPLE_DATA_DIR)

    rag = LegalRAGPipeline(embedder=embedder, retriever=retriever)
    summary = await rag.summarize_case("SCI-1973-WP-135")

    assert summary["status"] == "success"
    assert summary["case_id"] == "SCI-1973-WP-135"
    assert summary["total_chunks"] > 0
    assert len(summary["summary"]) > 0


@pytest.mark.asyncio
async def test_real_pdf_ingestion_and_page_metadata():
    """Verify real legal PDF ingestion, page boundary extraction, and page attribution."""
    real_pdf_dir = PROJECT_ROOT / "data" / "legal_judgments"
    civil_pdf = real_pdf_dir / "civil case judgemnt.pdf"
    if not civil_pdf.exists():
        pytest.skip("Real judgment PDF not found in data/legal_judgments")

    loader = DocumentLoader()
    doc = loader.load(civil_pdf)

    assert doc["is_scanned"] is False
    assert doc["metadata"]["page_count"] == 6
    assert len(doc["pages"]) == 6
    assert doc["pages"][0]["page_number"] == 1
    assert "REPORTABLE" in doc["pages"][0]["text"]

    parser = LegalDocumentParser()
    parsed = parser.parse(doc)
    assert "1615" in parsed["doc_id"]
    assert "Supreme Court" in parsed["court"]
    assert parsed["metadata"]["page_count"] == 6

    chunker = LegalSemanticChunker(chunk_size=400, chunk_overlap=50)
    chunks = chunker.split_document(parsed)
    assert len(chunks) > 0
    # Verify page attribution on chunks
    assert all("page_number" in c for c in chunks)
    assert any(c["page_number"] == 1 for c in chunks)


def test_scanned_pdf_detection_ocr_required():
    """Verify explicit detection and OCR requirement for scanned image-only PDFs."""
    parser = LegalDocumentParser()
    scanned_raw_doc = {
        "content": "",
        "pages": [
            {"page_number": 1, "text": "", "char_count": 0},
            {"page_number": 2, "text": "", "char_count": 0},
        ],
        "is_scanned": True,
        "ocr_required": True,
        "metadata": {"source": "scanned_judgment.pdf", "file_stem": "scanned_judgment"},
    }

    parsed = parser.parse(scanned_raw_doc)
    assert parsed["is_scanned"] is True
    assert parsed["ocr_required"] is True
    assert "OCR is required" in parsed["error"]

    chunker = LegalSemanticChunker()
    chunks = chunker.split_document(parsed)
    # Scanned document must not produce empty chunks
    assert chunks == []


@pytest.mark.asyncio
async def test_explore_possible_options_decision_support():
    """Verify explore_possible_options distinguishes user facts, findings, and risks."""
    rag = LegalRAGPipeline()
    problem = "State government took possession of land without paying statutory solatium."
    res = await rag.explore_possible_options(problem)

    assert res["status"] == "success"
    analysis = res["analysis"]
    assert "Facts Supplied by the User" in analysis
    assert "Possible Legal Routes" in analysis
    assert "Risks, Deadlines" in analysis
    assert "Disclaimer" in analysis or "disclaimer" in res
    assert "advocate_cta" in res


def test_advocate_matching_and_cta_generation():
    """Verify advocate matching criteria and non-blocking CTA generation."""
    from rag.advocate_matching.matcher import AdvocateMatcher

    matcher = AdvocateMatcher()
    result = matcher.find_suitable_advocates(practice_area="Civil Law / Land Acquisition")

    assert result["status"] == "success"
    assert result["total_matched"] >= 1
    top = result["advocates"][0]
    assert top["verified"] is True
    assert "Civil Law / Land Acquisition" in top["practice_areas"]

    # CTA generation
    cta = matcher.generate_advocate_cta(
        practice_area="Civil Law / Land Acquisition",
        court="Supreme Court of India",
        origin_source="document_summary",
    )
    assert cta["cta_title"] == "Find a Suitable Advocate"
    assert cta["non_blocking"] is True
    assert cta["context_payload"]["practice_area"] == "Civil Law / Land Acquisition"


def test_advocate_matching_empty_state():
    """Verify empty state when no matching advocate profiles exist."""
    from rag.advocate_matching.matcher import AdvocateMatcher

    matcher = AdvocateMatcher()
    result = matcher.find_suitable_advocates(practice_area="NonExistentAviationMaritimeDispute")

    assert result["status"] == "no_matches"
    assert result["total_matched"] == 0
    assert result["advocates"] == []
    assert "No advocate profiles found" in result["message"]
