import re
from typing import Any, Dict, List, Optional


class RAGEvaluator:
    """Evaluates the legal RAG pipeline against retrieval and generation benchmarks.

    Metrics assessed:
    - Context Precision & Recall (Retrieval tier)
    - Hit Rate@K and Mean Reciprocal Rank (MRR)
    - Faithfulness & Hallucination detection (Groundedness tier)
    - Citation presence & Answer relevance (Generation tier)
    """

    def __init__(self) -> None:
        pass

    def evaluate_retrieval(
        self,
        ground_truth_chunks: List[str],
        retrieved_chunks: List[str],
    ) -> Dict[str, float]:
        """Calculates Hit Rate@K and Mean Reciprocal Rank (MRR).

        Args:
            ground_truth_chunks: Expected relevant chunk IDs (e.g. ['DOC-1973#chunk_0005']).
            retrieved_chunks: List of retrieved chunk IDs ordered by ranking.

        Returns:
            Dictionary containing hit_rate_at_1, hit_rate_at_3, hit_rate_at_5, mrr, precision_at_k, recall.
        """
        if not ground_truth_chunks or not retrieved_chunks:
            return {
                "hit_rate_at_1": 0.0,
                "hit_rate_at_3": 0.0,
                "hit_rate_at_5": 0.0,
                "mrr": 0.0,
                "precision": 0.0,
                "recall": 0.0,
            }

        gt_set = set(ground_truth_chunks)

        # Hit@K
        hit_1 = 1.0 if any(c in gt_set for c in retrieved_chunks[:1]) else 0.0
        hit_3 = 1.0 if any(c in gt_set for c in retrieved_chunks[:3]) else 0.0
        hit_5 = 1.0 if any(c in gt_set for c in retrieved_chunks[:5]) else 0.0

        # Mean Reciprocal Rank (MRR)
        mrr = 0.0
        for rank, chunk_id in enumerate(retrieved_chunks, start=1):
            if chunk_id in gt_set:
                mrr = 1.0 / rank
                break

        # Precision & Recall
        relevant_retrieved = sum(1 for c in retrieved_chunks if c in gt_set)
        precision = relevant_retrieved / len(retrieved_chunks) if retrieved_chunks else 0.0
        recall = relevant_retrieved / len(gt_set) if gt_set else 0.0

        return {
            "hit_rate_at_1": round(hit_1, 4),
            "hit_rate_at_3": round(hit_3, 4),
            "hit_rate_at_5": round(hit_5, 4),
            "mrr": round(mrr, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
        }

    def evaluate_generation(
        self,
        query: str,
        retrieved_contexts: List[str],
        generated_answer: str,
        ground_truth_answer: str = "",
    ) -> Dict[str, float]:
        """Calculates Faithfulness, Refusal Accuracy, and Citation Coverage metrics.

        Args:
            query: Input user query.
            retrieved_contexts: Context passage strings retrieved for the query.
            generated_answer: Answer synthesized by the model.
            ground_truth_answer: Optional benchmark answer string.

        Returns:
            Dictionary with faithfulness, refusal_accuracy, citation_presence, answer_relevance.
        """
        ans_lower = generated_answer.lower()
        is_refusal = "do not establish" in ans_lower or "insufficient" in ans_lower

        # 1. Refusal check
        if not retrieved_contexts:
            refusal_acc = 1.0 if is_refusal else 0.0
        else:
            refusal_acc = 1.0

        # 2. Citation presence
        has_citations = 1.0 if bool(re.search(r"\[(?:Document|Source|Chunk):?[^\]]+\]", generated_answer)) else 0.0
        if is_refusal:
            has_citations = 1.0  # Refusals do not require citations

        # 3. Faithfulness: check if substantive tokens in answer exist in retrieved contexts
        if is_refusal:
            faithfulness = 1.0
        else:
            # Strip bracketed citation tags (e.g. [Document: ...], [Source: ...])
            cleaned_answer = re.sub(r"\[[^\]]+\]", "", ans_lower)
            joined_contexts = " ".join(retrieved_contexts).lower()
            stopwords = {"the", "is", "at", "which", "on", "and", "a", "an", "this", "that", "in", "of", "to", "for", "with", "as"}
            answer_tokens = [w for w in re.findall(r"\w+", cleaned_answer) if len(w) > 3 and w not in stopwords]
            if answer_tokens:
                grounded_count = sum(1 for t in answer_tokens if t in joined_contexts)
                faithfulness = round(grounded_count / len(answer_tokens), 4)
            else:
                faithfulness = 1.0

        # 4. Answer relevance: query keyword presence in generated answer
        query_words = [w for w in re.findall(r"\w+", query.lower()) if len(w) > 3]
        if query_words and not is_refusal:
            overlap = sum(1 for w in query_words if w in ans_lower)
            relevance = round(overlap / len(query_words), 4)
        elif is_refusal:
            relevance = 1.0
        else:
            relevance = 1.0

        return {
            "faithfulness": faithfulness,
            "refusal_accuracy": refusal_acc,
            "citation_presence": has_citations,
            "answer_relevance": relevance,
        }
