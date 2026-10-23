# CourtMind

> **AI-Based Court Case Intelligence & Legal Document RAG System**  
> *B.Tech Computer Science Major Project — RAG Implementation*

---

## Overview

**CourtMind** is an intelligent judicial intelligence platform that couples machine learning predictive analytics with a **Retrieval-Augmented Generation (RAG)** engine for legal document Q&A.

The RAG subsystem is **fully implemented and operational**:
- Ingests real Indian legal judgment PDFs (page-aware parsing)
- Semantically chunks documents (500 tokens, 60-token overlap)
- Generates dense vector embeddings (SentenceTransformers ll-MiniLM-L6-v2)
- Indexes chunks in an in-memory vector store (pgvector-compatible)
- Answers legal questions with grounded citations and page references
- Generates structured 6-part legal summaries
- Persists uploaded PDFs across server restarts

---

## Current Status

| Subsystem | Status | Notes |
|---|---|---|
| **FastAPI Backend Core** | ✅ **Complete** | Health check, CORS, lifespan preload |
| **PDF Ingestion & Parsing** | ✅ **Complete** | Page-aware PyMuPDF extraction, metadata tagging |
| **Semantic Chunking** | ✅ **Complete** | 500-token chunks, 60-token overlap, legal boundary awareness |
| **Vector Embeddings** | ✅ **Complete** | ll-MiniLM-L6-v2 SentenceTransformers, cosine similarity |
| **Vector Retrieval** | ✅ **Complete** | In-memory pgvector-compatible store, top-k cosine search |
| **Document Q&A (Mode A)** | ✅ **Complete** | Grounded answers with page citations, 92.6% hit rate |
| **General Legal Q&A (Mode B)** | ✅ **Complete** | Statutory/doctrinal reference mode |
| **Structured Summarization** | ✅ **Complete** | 6-part summary: Background, Issues, Arguments, Reasoning, Decision, Principles |
| **Disk Persistence** | ✅ **Complete** | Uploaded PDFs saved to data/stored_documents/, re-ingested on startup |
| **Health Endpoint** | ✅ **Complete** | GET /api/v1/rag/health — vector store mode, chunk count, disk status |
| **Evaluation Benchmark** | ✅ **Complete** | 30-question dataset, Hit Rate 92.6%, Faithfulness 88.1%, Citation Rate 90% |
| **Test Suite** | ✅ **Complete** | 37/37 tests passing (unit + integration + persistence + API) |
| **Refusal / Out-of-Scope Guard** | ✅ **Complete** | Returns insufficient_evidence for out-of-scope queries |
| **Advocate CTA** | ✅ **Complete** | Matches relevant advocates from data/advocates.json |
| **ML Delay Risk (XGBoost)** | ⏳ **Phase 2** | Interfaces defined; awaiting dataset curation |
| **Explainability (SHAP)** | ⏳ **Phase 2** | Interfaces defined; awaiting trained models |

---

## RAG Benchmark Results

Evaluated on **30 questions** across three real Indian judgment PDFs:

| Metric | Score | Details |
|---|---|---|
| **Hit Rate @ 1** | 92.6% | Correct document retrieved as top-1 citation |
| **Hit Rate @ 3** | 92.6% | Correct document in top-3 citations |
| **Hit Rate @ 5 / Recall@5** | 92.6% | Correct document in top-5 citations |
| **MRR** | 0.9259 | Mean Reciprocal Rank across 27 document-mode questions |
| **Faithfulness** | 88.1% | Answer grounded in retrieved passages |
| **Citation Rate** | 90.0% | Percentage of answers with page citations |
| **Refusal Accuracy** | 50% | Out-of-scope guard (2/4 negative probes correctly refused) |

Run the benchmark: python -m rag.evaluation.eval_runner  
Results saved to: ag/evaluation/benchmark_results.json

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/v1/rag/health | System health: vector store mode, chunk count, disk status |
| GET | /api/v1/rag/documents | List all indexed documents |
| POST | /api/v1/rag/upload | Upload & index a PDF (saved to disk for restart persistence) |
| POST | /api/v1/rag/ask | Grounded Q&A — document mode or general legal mode |
| POST | /api/v1/rag/summarize | Structured 6-part legal summary for an indexed document |

Interactive API docs: **http://localhost:8000/docs**

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)

### 1. Install Backend Dependencies

`
pip install -r requirements.txt
`

### 2. Run the Backend Server

`
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
`

On startup the server automatically pre-indexes the three bundled Indian judgment PDFs from
data/legal_judgments/ and any previously uploaded PDFs from data/stored_documents/.

### 3. Verify

`
GET  http://localhost:8000/api/v1/rag/health   -> { "status": "ok", ... }
     http://localhost:8000/docs                -> Swagger UI
`

### 4. Run the Test Suite

`
# From project root
python -m pytest tests/ -v
`

Expected: **37 passed**

### 5. Run the Evaluation Benchmark

`
# From project root
python -m rag.evaluation.eval_runner
`

---

## Project Structure

`
court-mind/
|-- backend/
|   |-- app/
|       |-- api/v1/endpoints/
|       |   |-- rag.py              # Health, documents, upload, ask, summarize
|       |-- core/config.py          # Settings (env vars, paths)
|       |-- schemas/rag.py          # Pydantic request/response models
|       |-- services/
|       |   |-- rag_service.py      # Singleton components + startup preload
|       |   |-- storage_service.py  # PDF disk persistence
|       |-- main.py                 # FastAPI app factory + lifespan
|
|-- rag/
|   |-- ingestion/
|   |   |-- loader.py               # PDF file loader
|   |   |-- parser.py               # Page-aware text extraction (PyMuPDF)
|   |   |-- pipeline.py             # End-to-end ingestion orchestrator
|   |-- chunking/
|   |   |-- splitter.py             # Legal semantic chunker (500t / 60t overlap)
|   |-- embeddings/
|   |   |-- embedder.py             # SentenceTransformers all-MiniLM-L6-v2
|   |-- retrieval/
|   |   |-- vector_store.py         # PgVectorRetriever (in-memory + pgvector)
|   |-- generation/
|   |   |-- llm_client.py           # LLM client (grounded generation)
|   |   |-- pipeline.py             # LegalRAGPipeline (answer + summarize)
|   |-- evaluation/
|   |   |-- dataset.py              # 30-question benchmark dataset
|   |   |-- evaluator.py            # Faithfulness, citation, refusal metrics
|   |   |-- eval_runner.py          # Full benchmark runner
|   |   |-- benchmark_results.json  # Latest benchmark results
|   |-- advocate_matching/
|       |-- matcher.py              # Relevant advocate CTA matching
|
|-- data/
|   |-- legal_judgments/            # Bundled real Indian judgment PDFs (3)
|   |   |-- casee.pdf               # Maneka Gandhi (1978 AIR 597)
|   |   |-- civil case judgemnt.pdf # Civil Appeal 1615/2023 (Land Acquisition)
|   |   |-- criminal case judgemnt.pdf # Bachan Singh (1980 AIR 267)
|   |-- stored_documents/           # User-uploaded PDFs (persisted across restarts)
|   |-- advocates.json              # Advocate matching database
|
|-- tests/
|   |-- test_rag.py                 # Core RAG pipeline unit + integration tests
|   |-- test_rag_api.py             # FastAPI endpoint tests (upload, ask, summarize)
|   |-- test_health_and_eval.py     # Health check + evaluation dataset tests
|   |-- test_restart_persistence.py # Startup re-ingestion tests
|   |-- test_storage_persistence.py # Disk storage service tests
|
|-- .env.example                    # Environment variable template
|-- pytest.ini                      # Pytest configuration (asyncio mode=auto)
|-- README.md
`

---

## Environment Variables

Copy .env.example -> .env and configure as needed.

| Variable | Default | Description |
|---|---|---|
| DATABASE_URL | sqlite+aiosqlite:///./courtmind.db | ORM database (unused by RAG) |
| VECTOR_DATABASE_URL | *(optional)* | PostgreSQL + pgvector connection string |
| PDF_STORAGE_DIR | data/stored_documents | Directory for persisted user-uploaded PDFs |
| OPENAI_API_KEY | *(optional)* | LLM provider key (falls back to local model) |
| SECRET_KEY | *(set in prod)* | JWT auth secret |

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **RAG & Embeddings** | SentenceTransformers (all-MiniLM-L6-v2), PyMuPDF, custom chunker |
| **Vector Store** | In-memory pgvector-compatible store (PostgreSQL + pgvector optional) |
| **Evaluation** | Custom 30-question benchmark, faithfulness/citation/refusal metrics |
| **ML (Phase 2)** | pandas, NumPy, scikit-learn, XGBoost, SHAP (planned) |
| **Database & ORM** | PostgreSQL, SQLAlchemy 2.0, Alembic, asyncpg |
| **DevOps** | Docker, Docker Compose, Git |

---

## License

Developed as part of a B.Tech Computer Science Major Project.
