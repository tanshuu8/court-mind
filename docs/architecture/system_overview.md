# CourtMind System Architecture

## High-Level Architecture Overview

CourtMind integrates structured judicial analytics with unstructured legal document intelligence.

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React + Vite + Tailwind)"]
        UI[CourtMind Web Dashboard]
    end

    subgraph API["Backend Layer (FastAPI)"]
        Router[API Gateway / Router]
        CaseSvc[Case Delay Service]
        DocSvc[Legal Document Service]
    end

    subgraph ML_Subsystem["Machine Learning Pipeline"]
        Preprocessor[Data Preprocessor]
        FeatureEng[Feature Engineering]
        XGBoost[XGBoost Delay Classifier]
        SHAP[SHAP Explainability Engine]
    end

    subgraph RAG_Subsystem["RAG & Document Intelligence"]
        Parser[PDF & Order Parser]
        Chunker[Semantic Legal Chunker]
        Embedder[Vector Embeddings]
        LLM[Grounded LLM Generator]
    end

    subgraph Storage["Data Tier"]
        Postgres[(PostgreSQL + pgvector)]
    end

    UI <--> Router
    Router --> CaseSvc
    Router --> DocSvc

    CaseSvc --> Preprocessor --> FeatureEng --> XGBoost --> SHAP
    DocSvc --> Parser --> Chunker --> Embedder --> Postgres
    DocSvc --> Postgres --> LLM
```

## Subsystem Responsibilities

1. **Frontend**: Interactive React dashboard displaying case risk status, SHAP explanation charts, legal search, and grounded document summarization.
2. **FastAPI Backend**: High-performance asynchronous REST API handling authentication, case intake, ML inference triggering, and RAG search dispatching.
3. **ML Subsystem**: Handles structured judicial features to classify case delay risk into Low, Medium, or High categories and calculates feature contributions via SHAP.
4. **RAG Subsystem**: Ingests unstructured court rulings/orders, breaks text into semantic legal units, indexes in pgvector, and generates grounded responses via an LLM.
5. **PostgreSQL + pgvector**: Unified relational store for case metadata, user accounts, and high-dimensional vector embeddings.
