# CourtMind Research & Experimental Plan

## Research Questions

1. **RQ1 (Delay Risk Classification):** How accurately can gradient boosting algorithms (XGBoost) classify multi-tier court case delay risk using statutory timelines and historical hearing metadata?
2. **RQ2 (Explainability & Interpretability):** Do SHAP-derived local feature attributions provide judicially meaningful explanations for predicted delays compared to standard feature importances?
3. **RQ3 (Legal Document Groundedness):** How does legal-specific semantic chunking (preserving paragraph hierarchies and statutory clauses) impact the retrieval accuracy and hallucination rate in RAG-based legal document synthesis?

## Methodology & Phases

### Phase 1: Foundation & Data Curation
- Establish baseline repository and developer environment.
- Curate public judicial datasets with proper governance.
- Clean and normalize temporal, procedural, and jurisdictional features.

### Phase 2: Predictive Modeling & Explainability
- Implement XGBoost 3-class classification (Low / Medium / High).
- Perform K-Fold cross-validation and hyperparameter optimization.
- Compute global and instance-level SHAP values for delay drivers.

### Phase 3: Legal RAG & LLM Synthesis
- Ingest court orders, judgments, and legal petitions.
- Test semantic chunking strategies vs. naive fixed-size chunking.
- Index embeddings in pgvector and benchmark retrieval with MRR / Hit@K.
- Integrate LLM for grounded summarization and evaluate with RAG triad metrics.

### Phase 4: Integration & Evaluation
- Connect ML and RAG pipelines to the FastAPI backend.
- Expose endpoints to the React frontend dashboard.
- Conduct comprehensive system validation.
