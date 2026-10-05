"""CourtMind Retrieval-Augmented Generation (RAG) Subsystem.

This package contains modular interfaces for legal document analysis:
- ingestion: File loading & legal PDF document parsing
- chunking: Domain-aware semantic text splitting (legal provisions, orders, facts)
- embeddings: Vector embedding generation
- retrieval: pgvector / similarity search and top-k reranking
- generation: LLM prompt orchestrator and grounded legal synthesis
- evaluation: RAG triad evaluation (faithfulness, answer relevance, context recall)
"""

__version__ = "0.1.0"
