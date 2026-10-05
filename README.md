# CourtMind

> **AI-Based Court Case Delay Intelligence & Legal Document Analysis**  
> *B.Tech Major Project • Research & Development*

---

## Overview

**CourtMind** is an intelligent judicial intelligence platform designed to address systemic challenges in court case management and legal document processing. By coupling machine learning predictive analytics with retrieval-augmented generation (RAG), CourtMind aims to deliver data-driven insights into case delay risks while empowering legal practitioners and researchers with grounded document search and synthesis capabilities.

> **Status Notice:** This repository currently contains the foundational architecture and modular codebase structure. Machine learning training pipelines and active LLM integrations are designated under **Planned / Under Development**.

---

## Problem

Modern legal systems experience significant challenges:
1. **Case Backlogs & Unpredictable Timelines:** Subordinate and appellate courts face millions of pending cases. Identifying which matters are at acute risk of protracted delays due to adjournments, transfer frequency, or case complexity remains largely manual and reactive.
2. **Lack of Explainability:** Traditional statistical methods fail to pinpoint individual driver factors behind hearing delays.
3. **Information Overload in Legal Documents:** Court orders, judgments, and legal filings are voluminous and unstructured, making information retrieval, precedent tracking, and clause verification time-consuming.

---

## Proposed Solution

CourtMind proposes a two-pronged, modular architecture:
1. **Delay Intelligence Subsystem:**
   - Evaluates structured court case attributes (filing timeline, hearing frequency, adjournment records, bench configurations).
   - Utilizes **XGBoost** for multi-class delay risk stratification (`Low` / `Medium` / `High`).
   - Uses **SHAP (SHapley Additive exPlanations)** to provide transparent, instance-level feature attribution explaining *why* a case is likely to experience delays.
2. **Legal Document Intelligence & RAG Subsystem:**
   - Ingests legal PDF orders, filings, and statutory references.
   - Applies domain-aware semantic chunking that respects judicial document structures.
   - Indexes embeddings into **PostgreSQL + pgvector** for fast similarity retrieval.
   - Synthesizes grounded legal summaries and answers domain-specific queries using Large Language Models (LLMs) with citation attribution.

---

## Architecture

```
                                  +------------------------------+
                                  |     React + TypeScript UI    |
                                  |   (Vite + Tailwind CSS)      |
                                  +--------------+---------------+
                                                 |
                                         REST API Calls
                                                 |
                                  +--------------v---------------+
                                  |       FastAPI Backend        |
                                  +-------+--------------+-------+
                                          |              |
                    +---------------------+              +---------------------+
                    |                                                          |
        +-----------v-----------+                                  +-----------v-----------+
        |   ML Delay Pipeline   |                                  |   RAG Document Engine |
        |  (XGBoost + SHAP)     |                                  | (pgvector + Embeddings|
        |  [Planned Phase 2]    |                                  |    + LLM Generation)  |
        +-----------------------+                                  |   [Planned Phase 3]   |
                                                                   +-----------+-----------+
                                                                               |
                                                                   +-----------v-----------+
                                                                   |  PostgreSQL + pgvector|
                                                                   +-----------------------+
```

---

## Planned AI Pipeline

### 1. Delay Risk Classification (Phase 2)
- **Data Preprocessing:** Cleaning and normalizing raw court case logs, handling missing hearings, and parsing jurisdictional codes.
- **Feature Engineering:** Deriving temporal hearing intervals, adjournment-to-listing ratios, court workload indices, and statutory complexity scores.
- **Model Training:** Multi-class XGBoost classifier with cross-validation and hyperparameter optimization.
- **Explainability:** SHAP TreeExplainer generating local force plots and global feature attribution summaries.

### 2. Legal Document RAG (Phase 3)
- **Ingestion & Parsing:** PDF extraction with layout and clause boundary preservation.
- **Semantic Chunking:** Splitting documents by paragraph hierarchy and legal sections.
- **Vector Embedding:** Dense embeddings generated via Sentence Transformers (or OpenAI).
- **Vector Store:** PostgreSQL pgvector indexing with cosine similarity search.
- **Grounded LLM Generation:** Prompt orchestration enforcing factual grounding and source citations.
- **Evaluation:** Quantitative benchmarks assessing Context Precision, Recall, Faithfulness, and Answer Relevance.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Machine Learning** | pandas, NumPy, scikit-learn, XGBoost, SHAP *(Planned)* |
| **RAG & Vector Search**| PostgreSQL 16, `pgvector`, Sentence Transformers, LangChain/OpenAI *(Planned)* |
| **Database & ORM** | PostgreSQL 16, SQLAlchemy 2.0, Alembic, asyncpg |
| **DevOps & Tooling** | Docker, Docker Compose, Git |

---

## Project Structure

```
court-mind/
├── frontend/                  # React + Vite + TypeScript web application
│   ├── public/                # Static assets (favicons, icons)
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── main.tsx           # React DOM root entry
│   │   ├── index.css          # Tailwind CSS style definitions
│   │   └── vite-env.d.ts      # Vite TypeScript type declarations
│   ├── package.json           # Frontend dependencies & build scripts
│   ├── tailwind.config.js     # Tailwind design system configuration
│   ├── tsconfig.json          # TypeScript compiler options
│   └── vite.config.ts         # Vite build and proxy configuration
│
├── backend/                   # FastAPI backend application
│   ├── app/
│   │   ├── api/               # API routes & versioned endpoints
│   │   │   └── v1/
│   │   │       ├── endpoints/ # Route handlers (e.g. health.py)
│   │   │       └── router.py  # Consolidated v1 router
│   │   ├── core/              # Core configuration, settings & logging
│   │   ├── models/            # SQLAlchemy database models (placeholder)
│   │   ├── schemas/           # Pydantic validation & serialization models
│   │   ├── services/          # Business logic services (placeholder)
│   │   └── main.py            # FastAPI entry point & CORS configuration
│   ├── tests/                 # Backend test suite (pytest)
│   └── requirements.txt       # Python dependencies
│
├── ml/                        # Machine Learning pipeline (XGBoost + SHAP)
│   ├── data/                  # Raw and processed datasets (git ignored)
│   │   ├── raw/
│   │   └── processed/
│   ├── preprocessing/         # Cleaning & dataset normalization
│   ├── features/              # Delay-specific feature engineering
│   ├── models/                # XGBoost classifier & SHAP explainer wrappers
│   ├── evaluation/            # Multi-class performance & calibration metrics
│   └── notebooks/             # Exploratory research & EDA notebooks
│
├── rag/                       # Legal Document Analysis (RAG Subsystem)
│   ├── ingestion/             # Document loading and PDF parsing
│   ├── chunking/              # Semantic legal text chunkers
│   ├── embeddings/            # Vector embedding generators
│   ├── retrieval/             # pgvector store & similarity search
│   ├── generation/            # LLM clients & grounded QA pipeline
│   └── evaluation/            # Retrieval and hallucination metrics
│
├── docs/                      # Project documentation & research notes
│   ├── architecture/          # Architecture diagrams and system specs
│   ├── research/              # Research questions, roadmap, and literature notes
│   └── decisions/             # Architecture Decision Records (ADRs)
│
├── tests/                     # Integration tests across subsystems
├── .env.example               # Environment variables template
├── .gitignore                 # Comprehensive Git ignore rules
├── docker-compose.yml         # Local development services (PostgreSQL + pgvector)
└── README.md                  # Project overview and development guide
```

---

## Development Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.11 or higher
- **Docker & Docker Compose** (optional, for local PostgreSQL + pgvector)
- **Git**

---

### 1. Environment Configuration

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

---

### 2. Backend Setup

1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```

2. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS:**
     ```bash
     source venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Verify backend health endpoint:
   - URL: `http://127.0.0.1:8000/api/health`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the web dashboard in your browser:
   - URL: `http://localhost:5173`

---

### 4. Database Setup (PostgreSQL + pgvector)

To start a local PostgreSQL instance with pgvector support using Docker:

```bash
docker compose up -d
```

---

## Team Development

To support parallel collaboration among team members:

| Developer Domain | Core Directories | Primary Objectives |
|---|---|---|
| **Developer 1 (Frontend)** | `frontend/` | UI/UX dashboard, SHAP chart visualizations, document viewer |
| **Developer 2 (Backend / API)** | `backend/` | FastAPI routes, database models, auth, async pipeline coordination |
| **Developer 3 (Machine Learning)** | `ml/` | Data curation, feature extraction, XGBoost training, SHAP integration |
| **Developer 4 (RAG / NLP)** | `rag/` | PDF parsing, semantic chunking, pgvector search, LLM grounded synthesis |

### Collaboration Guidelines
- **Branching Strategy:** Create descriptive feature branches from `main` (e.g., `feat/frontend-dashboard`, `feat/ml-feature-engineering`, `feat/rag-chunking`).
- **Secrets Management:** Never commit `.env` or real API keys. Use `.env.example` to declare required keys.
- **Code Standards:** Use type annotations in Python and TypeScript. Run tests before submitting pull requests.

---

## Current Status

| Subsystem / Capability | Status | Notes |
|---|---|---|
| **Project Foundation & Monorepo Structure** |  **Completed** | Clean modular architecture initialized |
| **FastAPI Backend Core & Health Check** |  **Completed** | `GET /api/health` operational |
| **Frontend Shell & Design System** |  **Completed** | React + Vite + Tailwind foundation |
| **PostgreSQL + pgvector Compose Spec** |  **Completed** | Ready for containerized local DB |
| **ML Delay Risk Model (XGBoost)** | ⏳ **Planned (Phase 2)** | Interfaces defined; awaiting dataset curation |
| **Explainability Engine (SHAP)** | ⏳ **Planned (Phase 2)** | Interfaces defined; awaiting trained models |
| **Legal Document Parsing & Chunking** | ⏳ **Planned (Phase 3)** | Interfaces defined |
| **Vector Retrieval & RAG Synthesis** | ⏳ **Planned (Phase 3)** | Interfaces defined; awaiting pgvector integration |

---

## License

This project is developed as part of an academic B.Tech Major Project.
