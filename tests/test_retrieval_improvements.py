"""Tests for Advanced Legal RAG Retrieval, BM25 Lexical Ranking, and Chunking Improvements."""
import pytest
from rag.chunking.splitter import LegalSemanticChunker
from rag.retrieval.bm25 import BM25Index, tokenize_legal_text
from rag.retrieval.vector_store import PgVectorRetriever


def test_bm25_tokenization_statutory_identifiers():
    """Verifies that legal section citations like 24(2) and 377(3) are preserved as tokens."""
    text = "Under Section 24(2) of the 2013 Act, and Section 377(3) of CrPC, acquisition lapses."
    tokens = tokenize_legal_text(text)
    assert "24(2)" in tokens
    assert "377(3)" in tokens
    assert "2013" in tokens
    assert "crpc" in tokens


def test_bm25_index_and_search():
    """Verifies that Okapi BM25 accurately indexes legal chunks and scores relevant terms highest."""
    chunks = [
        {
            "chunk_id": "c1",
            "doc_id": "doc1",
            "text": "The Right to Fair Compensation in Land Acquisition Act under Section 24(2) provides deemed lapse.",
            "metadata": {"title": "Land Acquisition Appeal", "section_heading": "Statutory Interpretation"},
        },
        {
            "chunk_id": "c2",
            "doc_id": "doc2",
            "text": "The criminal revision under Section 401 and enhancement of sentence under Section 377 CrPC.",
            "metadata": {"title": "Criminal Appeal", "section_heading": "Criminal Procedure"},
        },
        {
            "chunk_id": "c3",
            "doc_id": "doc3",
            "text": "Passport impoundment under Section 10(3)(c) of the Passports Act violates Article 21.",
            "metadata": {"title": "Maneka Gandhi", "section_heading": "Personal Liberty"},
        },
    ]

    index = BM25Index()
    index.index_chunks(chunks)

    assert index.doc_count == 3
    assert "24(2)" in index.inverted_index
    assert "377" in index.inverted_index
    assert "passports" in index.inverted_index

    # Search for Section 24(2)
    results = index.search("Section 24(2) Land Acquisition", top_k=2)
    assert len(results) > 0
    top_chunk_id, score = results[0]
    assert top_chunk_id == "c1"
    assert score > 0.0

    # Search for Criminal Revision
    results_crpc = index.search("Section 401 CrPC enhancement", top_k=2)
    assert len(results_crpc) > 0
    assert results_crpc[0][0] == "c2"


@pytest.mark.asyncio
async def test_hybrid_rrf_search():
    """Verifies that PgVectorRetriever's hybrid RRF fusion accurately integrates dense and BM25 scores."""
    retriever = PgVectorRetriever(connection_url="memory:")

    # Simulated 4-dim embeddings for testing (normalized)
    c1_emb = [1.0, 0.0, 0.0, 0.0]
    c2_emb = [0.0, 1.0, 0.0, 0.0]
    c3_emb = [0.0, 0.0, 1.0, 0.0]

    chunks = [
        {
            "chunk_id": "chunk_land",
            "doc_id": "CA_1615_2023",
            "chunk_index": 0,
            "page_number": 3,
            "text": "Section 24(2) deemed lapse where compensation is not paid.",
            "metadata": {"title": "Land Acquisition Case", "page_number": 3},
        },
        {
            "chunk_id": "chunk_crim",
            "doc_id": "AIR_1980_SC_267",
            "chunk_index": 0,
            "page_number": 5,
            "text": "Enhancement of sentence under Section 377 and Section 401 CrPC.",
            "metadata": {"title": "Bachan Singh", "page_number": 5},
        },
        {
            "chunk_id": "chunk_pass",
            "doc_id": "AIR_1978_SC_597",
            "chunk_index": 0,
            "page_number": 12,
            "text": "Right to go abroad under Article 21 and Section 10(3)(c) Passports Act.",
            "metadata": {"title": "Maneka Gandhi", "page_number": 12},
        },
    ]

    await retriever.upsert_chunks(chunks, [c1_emb, c2_emb, c3_emb])

    # Search query specifically targeting Section 24(2)
    query_vec = [0.9, 0.1, 0.0, 0.0]
    results = await retriever.search_similar(
        query_embedding=query_vec,
        top_k=2,
        query_text="Section 24(2) land compensation lapse",
    )

    assert len(results) == 2
    assert results[0]["chunk_id"] == "chunk_land"
    assert results[0]["page_number"] == 3
    assert "hybrid_score" in results[0]
    assert results[0]["hybrid_score"] > 0


@pytest.mark.asyncio
async def test_document_isolation_no_cross_leakage():
    """Verifies that filtering by doc_id strictly isolates chunks from the requested document."""
    retriever = PgVectorRetriever(connection_url="memory:")

    chunks = [
        {
            "chunk_id": "c_docA",
            "doc_id": "DOC_A",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Discussion on fundamental rights in DOC A.",
            "metadata": {"title": "Doc A Title"},
        },
        {
            "chunk_id": "c_docB",
            "doc_id": "DOC_B",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Discussion on fundamental rights in DOC B.",
            "metadata": {"title": "Doc B Title"},
        },
    ]

    await retriever.upsert_chunks(chunks, [[1.0, 0.0, 0.0, 0.0], [1.0, 0.0, 0.0, 0.0]])

    results = await retriever.search_similar(
        query_embedding=[1.0, 0.0, 0.0, 0.0],
        top_k=5,
        filters={"doc_id": "DOC_A"},
        query_text="fundamental rights",
    )

    assert len(results) == 1
    assert results[0]["doc_id"] == "DOC_A"


def test_chunking_heading_and_page_metadata():
    """Verifies that LegalSemanticChunker propagates section headings and page numbers into metadata."""
    chunker = LegalSemanticChunker(chunk_size=500, chunk_overlap=50)

    parsed_doc = {
        "doc_id": "TEST-JUDGMENT-01",
        "title": "State of Test v. Respondent",
        "court": "Supreme Court of India",
        "year": "2024",
        "metadata": {"author": "Bench"},
        "pages": [
            {
                "page_number": 1,
                "text": "JUDGMENT:\nThis appeal arises from an order.\nThe facts are simple.",
            },
            {
                "page_number": 2,
                "text": "HELD:\nThe statutory provision in Section 24(2) applies strictly.",
            },
        ],
    }

    chunks = chunker.split_document(parsed_doc)
    assert len(chunks) >= 2

    # Verify page preservation
    page1_chunks = [c for c in chunks if c["page_number"] == 1]
    page2_chunks = [c for c in chunks if c["page_number"] == 2]
    assert len(page1_chunks) >= 1
    assert len(page2_chunks) >= 1

    # Verify heading propagation
    p2_meta = page2_chunks[0]["metadata"]
    assert "HELD" in p2_meta.get("section_heading", "")
    assert p2_meta.get("title") == "State of Test v. Respondent"
    assert p2_meta.get("court") == "Supreme Court of India"
    assert p2_meta.get("year") == "2024"


def test_retriever_clear_resets_all_indices():
    """Verifies that clear() cleanly purges memory chunks, embeddings, and BM25 index."""
    retriever = PgVectorRetriever(connection_url="memory:")
    chunks = [
        {
            "chunk_id": "c1",
            "doc_id": "d1",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Sample text for indexing.",
            "metadata": {},
        }
    ]
    import asyncio
    asyncio.run(retriever.upsert_chunks(chunks, [[0.5, 0.5, 0.0, 0.0]]))

    assert len(retriever._memory_chunks) == 1
    assert retriever._bm25_index.doc_count == 1

    retriever.clear()
    assert len(retriever._memory_chunks) == 0
    assert len(retriever._memory_embeddings) == 0
    assert retriever._bm25_index.doc_count == 0

