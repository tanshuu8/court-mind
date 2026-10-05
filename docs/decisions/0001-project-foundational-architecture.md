# ADR 0001: Foundational Architecture and Technology Stack Selection

## Status
Accepted

## Context
CourtMind is a B.Tech major project combining judicial delay prediction (structured machine learning) with legal document question answering and summarization (unstructured document intelligence / RAG). The system requires clean modularity to enable 4 developers to work concurrently on Frontend, Backend, ML, and RAG components.

## Decision
1. **Frontend**: React + Vite + TypeScript + Tailwind CSS for fast compilation, static type safety, and responsive UI components.
2. **Backend**: FastAPI (Python) for asynchronous performance, automated OpenAPI generation, and native integration with Python ML/RAG ecosystems.
3. **Machine Learning**: XGBoost for tabular delay risk classification (Low/Med/High) and SHAP for instance-level explainability.
4. **Vector & Relational Storage**: PostgreSQL with `pgvector` extension to avoid multiple disparate database servers and streamline relational metadata and high-dimensional vector search.
5. **RAG Framework**: Modular Python pipelines supporting decoupled embedding models and LLM providers.

## Consequences
- Single backend stack (Python) reduces overhead for ML/RAG integration.
- Unified PostgreSQL + pgvector eliminates need for a separate standalone vector DB instance during development.
- Clear module boundaries allow independent parallel development across team members.
