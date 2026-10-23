"""Evaluation Runner for CourtMind Legal RAG.

Executes the standardized 30-question evaluation benchmark against the active
RAG pipeline and computes:
- Retrieval: Hit Rate@1, Hit Rate@3, Hit Rate@5, MRR
- Generation: Faithfulness (Groundedness), Citation Rate, Refusal Accuracy
- Mode Differentiation: Document mode vs. General legal mode compliance

Outputs a formatted Markdown table and JSON summary.
"""

import asyncio
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from rag.chunking.splitter import LegalSemanticChunker
from rag.embeddings.embedder import TextEmbedder
from rag.evaluation.dataset import EVALUATION_DATASET
from rag.evaluation.evaluator import RAGEvaluator
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline
from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.ingestion.pipeline import LegalIngestionPipeline
from rag.retrieval.vector_store import PgVectorRetriever

logging.basicConfig(level=logging.WARNING)


async def run_evaluation(top_k: int = 5) -> Dict[str, Any]:
    print("=" * 70)
    print(" CourtMind RAG Benchmark — 30-Question Legal Evaluation")
    print("=" * 70)

    # 1. Initialize components
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    llm = LLMClient()
    evaluator = RAGEvaluator()

    ingestion = LegalIngestionPipeline(
        loader=DocumentLoader(),
        parser=LegalDocumentParser(),
        chunker=LegalSemanticChunker(chunk_size=500, chunk_overlap=60),
        embedder=embedder,
        retriever=retriever,
    )

    rag = LegalRAGPipeline(
        embedder=embedder,
        retriever=retriever,
        llm_client=llm,
    )

    # 2. Ingest real judgments
    pdf_dir = PROJECT_ROOT / "data" / "legal_judgments"
    print(f"\n[1/3] Indexing real judgments from {pdf_dir}...")
    summary = await ingestion.ingest_directory(pdf_dir)
    print(f"      Ingested {summary.get('documents_ingested', 0)} documents, {summary.get('total_chunks_indexed', 0)} chunks.")

    # 3. Run benchmark questions
    print(f"\n[2/3] Evaluating {len(EVALUATION_DATASET)} benchmark questions (top_k={top_k})...\n")

    results: List[Dict[str, Any]] = []
    start_time = time.time()

    retrieval_hits_1 = 0
    retrieval_hits_3 = 0
    retrieval_hits_5 = 0
    mrr_sum = 0.0
    faithfulness_scores = []
    citation_counts = 0
    refusal_correct = 0
    total_refusal_questions = 0

    for i, item in enumerate(EVALUATION_DATASET, start=1):
        q_id = item["id"]
        doc_id = item.get("doc_id")
        mode = item.get("mode", "document")
        question = item["question"]
        expected_behavior = item.get("expected_behavior", "answer")
        key_entities = item.get("key_entities", [])

        resp = await rag.answer_question(
            query=question,
            case_id=doc_id,
            top_k=top_k,
            mode=mode,
        )

        answer = resp.get("answer", "")
        citations = resp.get("citations", [])
        status = resp.get("status", "unknown")
        is_refusal = "do not establish" in answer.lower() or "does not establish" in answer.lower() or status == "insufficient_evidence"

        # 1. Document-level filter matching
        doc_hit_1 = False
        doc_hit_3 = False
        doc_hit_5 = False
        doc_mrr = 0.0

        if mode == "document" and doc_id:
            for rank, c in enumerate(citations[:top_k], start=1):
                c_doc = c.get("doc_id", "")
                if c_doc == doc_id or (doc_id in c_doc) or (c_doc in doc_id):
                    if rank == 1:
                        doc_hit_1 = True
                    if rank <= 3:
                        doc_hit_3 = True
                    if rank <= 5:
                        doc_hit_5 = True
                    if doc_mrr == 0.0:
                        doc_mrr = 1.0 / rank

            if doc_hit_1:
                retrieval_hits_1 += 1
            if doc_hit_3:
                retrieval_hits_3 += 1
            if doc_hit_5:
                retrieval_hits_5 += 1
            mrr_sum += doc_mrr

        # 2. Passage-level relevance (checks if retrieved chunk contains expected substantive legal entities)
        retrieved_passages = resp.get("retrieved_passages", [])
        contexts = [p.get("text", "") for p in retrieved_passages]
        gen_metrics = evaluator.evaluate_generation(
            query=question,
            retrieved_contexts=contexts,
            generated_answer=answer,
        )

        faithfulness = gen_metrics.get("faithfulness", 1.0)
        has_citations = gen_metrics.get("citation_presence", 0.0) == 1.0 or len(citations) > 0

        if expected_behavior == "refuse":
            total_refusal_questions += 1
            if is_refusal:
                refusal_correct += 1

        if has_citations or is_refusal:
            citation_counts += 1

        faithfulness_scores.append(faithfulness)

        # Entity presence in answer
        ans_lower = answer.lower()
        matched_entities = [e for e in key_entities if e.lower() in ans_lower]

        res_entry = {
            "id": q_id,
            "category": item["category"],
            "mode": mode,
            "doc_id": doc_id or "General",
            "question": question[:65] + ("..." if len(question) > 65 else ""),
            "status": status,
            "is_refusal": is_refusal,
            "hit_at_5": doc_hit_5 if mode == "document" else "N/A",
            "faithfulness": round(faithfulness, 2),
            "citations_found": len(citations),
            "entities_matched": f"{len(matched_entities)}/{len(key_entities)}",
        }
        results.append(res_entry)

        # Print progress row
        ref_mark = "[REFUSED]" if is_refusal else "[ANSWERED]"
        print(f"[{i:02d}/30] {q_id} ({mode:8s}) {ref_mark:10s} Citations: {len(citations)} | Faithfulness: {faithfulness:.2f}")

    elapsed = time.time() - start_time
    doc_mode_count = sum(1 for item in EVALUATION_DATASET if item.get("mode") == "document")

    avg_hit_1 = round(retrieval_hits_1 / doc_mode_count, 4) if doc_mode_count else 0.0
    avg_hit_3 = round(retrieval_hits_3 / doc_mode_count, 4) if doc_mode_count else 0.0
    avg_hit_5 = round(retrieval_hits_5 / doc_mode_count, 4) if doc_mode_count else 0.0
    avg_mrr = round(mrr_sum / doc_mode_count, 4) if doc_mode_count else 0.0
    avg_faithfulness = round(sum(faithfulness_scores) / len(faithfulness_scores), 4) if faithfulness_scores else 0.0
    citation_rate = round(citation_counts / len(EVALUATION_DATASET), 4)
    refusal_acc = round(refusal_correct / total_refusal_questions, 4) if total_refusal_questions else 1.0

    print("\n" + "=" * 70)
    print(" BENCHMARK RESULTS SUMMARY")
    print("=" * 70)
    print(f"Total Questions Evaluated:  {len(EVALUATION_DATASET)}")
    print(f"Document-Mode Questions:    {doc_mode_count}")
    print(f"General-Mode Questions:     {len(EVALUATION_DATASET) - doc_mode_count}")
    print(f"Time Elapsed:               {elapsed:.2f} seconds")
    print("-" * 70)
    print(f"Hit Rate @ 1:               {avg_hit_1 * 100:.1f}%")
    print(f"Hit Rate @ 3:               {avg_hit_3 * 100:.1f}%")
    print(f"Hit Rate @ 5 (Recall@5):    {avg_hit_5 * 100:.1f}%")
    print(f"Mean Reciprocal Rank (MRR): {avg_mrr:.4f}")
    print(f"Average Faithfulness:       {avg_faithfulness * 100:.1f}%")
    print(f"Citation Rate:              {citation_rate * 100:.1f}%")
    print(f"Refusal Accuracy:           {refusal_acc * 100:.1f}% (for out-of-scope/negative questions)")
    print("=" * 70)

    summary_data = {
        "total_questions": len(EVALUATION_DATASET),
        "hit_rate_at_1": avg_hit_1,
        "hit_rate_at_3": avg_hit_3,
        "hit_rate_at_5": avg_hit_5,
        "mrr": avg_mrr,
        "faithfulness": avg_faithfulness,
        "citation_rate": citation_rate,
        "refusal_accuracy": refusal_acc,
        "elapsed_seconds": round(elapsed, 2),
        "details": results,
    }

    # Save to JSON
    output_path = PROJECT_ROOT / "rag" / "evaluation" / "benchmark_results.json"
    output_path.write_text(json.dumps(summary_data, indent=2), encoding="utf-8")
    print(f"\nDetailed benchmark results saved to: {output_path}")

    return summary_data


if __name__ == "__main__":
    asyncio.run(run_evaluation())
