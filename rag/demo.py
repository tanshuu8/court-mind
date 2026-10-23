import asyncio
from pathlib import Path

from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.chunking.splitter import LegalSemanticChunker
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline
from rag.ingestion.pipeline import LegalIngestionPipeline
from rag.evaluation.evaluator import RAGEvaluator


async def run_courtmind_rag_demo() -> None:
    print("=" * 70)
    print(" CourtMind - Legal Document RAG Pipeline Demo")
    print("=" * 70)

    # 1. Resolve paths
    project_root = Path(__file__).resolve().parent.parent
    sample_dir = project_root / "data" / "sample_judgments"

    print(f"\n[1] Initializing Ingestion & RAG Subsystems...")
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    llm_client = LLMClient()
    evaluator = RAGEvaluator()

    ingestion_pipeline = LegalIngestionPipeline(
        loader=DocumentLoader(),
        parser=LegalDocumentParser(),
        chunker=LegalSemanticChunker(chunk_size=450, chunk_overlap=50),
        embedder=embedder,
        retriever=retriever,
    )

    rag_pipeline = LegalRAGPipeline(
        embedder=embedder,
        retriever=retriever,
        llm_client=llm_client,
    )

    # 2. Ingest sample documents
    print(f"\n[2] Ingesting legal judgments from: {sample_dir}")
    ingestion_summary = await ingestion_pipeline.ingest_directory(sample_dir)
    print(f" -> Documents Ingested : {ingestion_summary['documents_ingested']}")
    print(f" -> Total Chunks Indexed: {ingestion_summary['total_chunks_indexed']}")
    for doc in ingestion_summary["details"]:
        print(f"    - [{doc['doc_id']}] {doc['title']} ({doc['year']}) -> {doc['chunks_indexed']} chunks")

    # 3. Query Execution
    test_queries = [
        {
            "type": "Grounded Legal Query (Kesavananda)",
            "query": "What is the Basic Structure Doctrine established in Kesavananda Bharati?",
        },
        {
            "type": "Grounded Legal Query (Privacy)",
            "query": "Is the right to privacy recognized as a fundamental right under Article 21?",
        },
        {
            "type": "Unanswerable / Out-of-Domain Query",
            "query": "What was the fine imposed on the defendant for patent infringement in the 2024 smartphone dispute?",
        },
    ]

    print("\n" + "=" * 70)
    print(" Running Evaluation Queries")
    print("=" * 70)

    for i, item in enumerate(test_queries, start=1):
        print(f"\n--- Query {i}: [{item['type']}] ---")
        print(f"Question: {item['query']}")

        result = await rag_pipeline.answer_question(item["query"], top_k=3)

        print(f"\nAnswer:")
        print(f"  {result['answer']}")

        print(f"\nStatus: {result['status']} | Grounded: {result['is_grounded']}")

        if result["citations"]:
            print(f"Citations ({len(result['citations'])}):")
            for cit in result["citations"]:
                print(f"  * {cit['title']} ({cit['year']}) [{cit['chunk_id']}] - Score: {cit['similarity_score']}")

        # Evaluation metrics
        contexts = [p["text"] for p in result["retrieved_passages"]]
        metrics = evaluator.evaluate_generation(
            query=item["query"],
            retrieved_contexts=contexts,
            generated_answer=result["answer"],
        )
        print(f"Evaluation Metrics: Faithfulness={metrics['faithfulness']} | "
              f"Refusal Accuracy={metrics['refusal_accuracy']} | "
              f"Citation Presence={metrics['citation_presence']}")

    print("\n" + "=" * 70)
    print(" CourtMind RAG Demo Completed Successfully")
    print("=" * 70)


def main() -> None:
    asyncio.run(run_courtmind_rag_demo())


if __name__ == "__main__":
    main()
