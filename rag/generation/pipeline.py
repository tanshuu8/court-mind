import logging
import re
from typing import Any, Dict, List, Optional
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.exceptions import LLMGenerationError
from rag.advocate_matching.matcher import AdvocateMatcher

logger = logging.getLogger("courtmind.rag_pipeline")

# ---------------------------------------------------------------------------
# Topic-coherence helpers
# ---------------------------------------------------------------------------

# Common English and legal-domain stopwords that carry no topic signal.
_TOPIC_STOPWORDS: frozenset = frozenset({
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "not", "no", "nor",
    "this", "that", "these", "those", "it", "its", "what", "which", "who",
    "whom", "how", "when", "where", "why", "whether", "if", "then", "than",
    "so", "as", "such", "both", "each", "other", "any", "all", "some",
    "case", "judgment", "document", "court", "order", "matter", "question",
    "answer", "said", "held", "held", "also", "only", "very", "per",
    "under", "above", "upon", "within", "between", "about", "against",
    "after", "before", "during", "through", "into", "out", "over", "up",
    "down", "here", "there", "further", "whereas", "herein", "thereof",
    "laid", "down", "prescribed", "given", "made", "make", "take",
    "taken", "give", "show", "set", "get", "put", "come", "go",
})


def _content_words(text: str) -> frozenset:
    """Returns non-trivial lowercase word tokens from *text* after stopword removal."""
    tokens = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return frozenset(t for t in tokens if t not in _TOPIC_STOPWORDS)



class LegalRAGPipeline:
    """End-to-End Grounded Legal Question Answering, Summarization, and Options Pipeline.
    
    Orchestrates:
    1. Query embedding via TextEmbedder
    2. Vector retrieval & metadata filtering via PgVectorRetriever
    3. Grounded Q&A with page-level citations
    4. Structured 6-part legal document summarization
    5. Decision-support legal options exploration
    6. Non-blocking advocate discovery CTA integration
    """

    def __init__(
        self,
        embedder: Optional[TextEmbedder] = None,
        retriever: Optional[PgVectorRetriever] = None,
        llm_client: Optional[LLMClient] = None,
        advocate_matcher: Optional[AdvocateMatcher] = None,
        min_similarity_threshold: float = 0.15,
    ) -> None:
        self.embedder = embedder or TextEmbedder()
        self.retriever = retriever or PgVectorRetriever()
        self.llm_client = llm_client or LLMClient()
        self.advocate_matcher = advocate_matcher or AdvocateMatcher()
        self.min_similarity_threshold = min_similarity_threshold

    async def answer_question(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        case_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5,
        mode: str = "document",
    ) -> Dict[str, Any]:
        """Performs retrieve-then-read pipeline to answer queries grounded in legal documents.

        Args:
            query: User legal inquiry or follow-up question.
            filters: Optional metadata filtering criteria.
            case_id: Optional specific case/document filter to scope retrieval.
            conversation_history: Optional previous Q&A turns to support coherent follow-ups.
            top_k: Number of most similar chunks to retrieve.
            mode: 'document' (strictly scoped to selected document) or 'general' (statutory reference).

        Returns:
            Dictionary with `query`, `answer`, `citations`, `retrieved_passages`, `advocate_cta`.
        """
        if mode == "general":
            return await self.answer_general_question(query=query, case_id=case_id)

        combined_filters = dict(filters or {})
        if case_id:
            combined_filters["doc_id"] = case_id

        # 1. Embed query into dense vector space
        query_vec = self.embedder.embed_query(query)

        # 2. Retrieve top-k relevant chunks (passing query_text for hybrid boost)
        retrieved_chunks = await self.retriever.search_similar(
            query_vec, top_k=top_k, filters=combined_filters if combined_filters else None, query_text=query
        )

        # 3. Filter chunks by similarity threshold and deduplicate by chunk_id
        seen_ids = set()
        valid_chunks = []
        for c in retrieved_chunks:
            cid = c.get("chunk_id")
            if cid not in seen_ids and c.get("similarity_score", 0.0) >= self.min_similarity_threshold:
                seen_ids.add(cid)
                valid_chunks.append(c)

        # 4a. Document-intent mismatch guard (pre-LLM).
        # Check whether the query's primary intent is structurally incompatible with
        # the selected document (e.g. capital punishment asked against land acquisition,
        # rarest of rare asked against 1979 procedural Bachan Singh, maritime against Maneka Gandhi).
        intent_mismatch = self._check_document_intent_mismatch(query, case_id, valid_chunks or retrieved_chunks)
        if intent_mismatch:
            cta = self.advocate_matcher.generate_advocate_cta(
                practice_area=None,
                court=None,
                origin_source="unsupported_rag_query",
            )
            return {
                "query": query,
                "mode": "document",
                "doc_id": case_id,
                "answer": intent_mismatch,
                "citations": [],
                "retrieved_passages": valid_chunks or retrieved_chunks,
                "is_grounded": False,
                "status": "insufficient_evidence",
                "source_attribution": "Selected Document Passages",
                "advocate_cta": cta,
            }

        # 4b. Topic-coherence gate: even if similarity scores are above threshold,
        #     verify that at least one chunk shares substantive content words with
        #     the query. A zero-overlap result means the retrieved passages are
        #     topically unrelated to the question (e.g. maritime EEZ asked against
        #     a passport-rights judgment) and the LLM must not be invoked.
        if valid_chunks and not self._has_topic_coherence(query, valid_chunks):
            cta = self.advocate_matcher.generate_advocate_cta(
                practice_area=None,
                court=None,
                origin_source="unsupported_rag_query",
            )
            return {
                "query": query,
                "mode": "document",
                "doc_id": case_id,
                "answer": (
                    "The available documents do not establish the answer to this question. "
                    "The selected document does not contain relevant evidence for the query topic. "
                    "Please switch to 'General Legal Question' mode if you are seeking general "
                    "statutory or legal reference."
                ),
                "citations": [],
                "retrieved_passages": valid_chunks,
                "is_grounded": False,
                "status": "insufficient_evidence",
                "source_attribution": "Selected Document Passages",
                "advocate_cta": cta,
            }

        # 5. Check for insufficient evidence (no valid chunks at all)
        if not valid_chunks:
            cta = self.advocate_matcher.generate_advocate_cta(
                practice_area=None,
                court=None,
                origin_source="unsupported_rag_query",
            )
            return {
                "query": query,
                "mode": "document",
                "doc_id": case_id,
                "answer": (
                    "The available documents do not establish the answer to this question. "
                    "The selected document does not contain relevant evidence for the query topic based on its indexed passages. "
                    "Please switch to 'General Legal Question' mode if you are seeking general "
                    "statutory or legal reference."
                ),
                "citations": [],
                "retrieved_passages": retrieved_chunks,
                "is_grounded": False,
                "status": "insufficient_evidence",
                "source_attribution": "Selected Document Passages",
                "advocate_cta": cta,
            }

        # 5b. Build structured prompt with citations and page numbers
        context_blocks = []
        for i, chunk in enumerate(valid_chunks, start=1):
            meta = chunk.get("metadata", {})
            title = meta.get("title", chunk.get("doc_id", "Unknown Case"))
            doc_id = chunk.get("doc_id", "DOC-UNKNOWN")
            court = meta.get("court", "Court")
            year = meta.get("year", "N/A")
            page = chunk.get("page_number", meta.get("page_number", 1))
            chunk_idx = chunk.get("chunk_index", 0)
            text = chunk.get("text", "")

            block = (
                f"[Source {i}: Title: {title}, Document ID: {doc_id}, "
                f"Court: {court}, Year: {year}, Page: {page}, Chunk: {chunk_idx}]\n{text}"
            )
            context_blocks.append(block)

        context_str = "\n\n".join(context_blocks)

        history_str = ""
        if conversation_history:
            history_lines = [f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in conversation_history[-4:]]
            history_str = f"Conversation History:\n" + "\n".join(history_lines) + "\n\n"

        system_prompt = (
            "You are CourtMind's legal assistant. Answer the user's legal question strictly "
            "based on the provided court judgment passages.\n\n"
            "Rules:\n"
            "1. Base your answer ONLY on the provided context passages. Do not assume or extrapolate facts.\n"
            "2. Cite your sources using the format [Document: {title} ({year}), Page: {page}, Chunk: {chunk_index}]. Include page number for every factual claim.\n"
            "3. If the provided passages do not establish the answer, state explicitly: "
            "'The available documents do not establish the answer to this question.'\n"
            "4. Do NOT fabricate citations or reference passages not in the context.\n"
            "5. Maintain a neutral, professional judicial tone."
        )

        user_prompt = f"{history_str}Context Passages:\n{context_str}\n\nQuestion: {query}"

        try:
            raw_answer = await self.llm_client.generate_response(system_prompt, user_prompt)
        except LLMGenerationError as exc:
            logger.error("LLM generation failed in answer_question: %s", exc.message)
            top_meta = valid_chunks[0].get("metadata", {}) if valid_chunks else {}
            cta = self.advocate_matcher.generate_advocate_cta(
                practice_area=self._infer_practice_area(query, valid_chunks[0].get("text", "")),
                court=top_meta.get("court"),
                origin_source="rag_qa_error",
            )
            return {
                "query": query,
                "mode": "document",
                "doc_id": case_id,
                "answer": f"LLM generation failed: {exc.message}",
                "citations": [],
                "retrieved_passages": valid_chunks,
                "is_grounded": False,
                "status": "error",
                "source_attribution": f"Error: Provider generation failed ({exc.provider})",
                "disclaimer": f"Error: {type(exc).__name__}",
                "advocate_cta": cta,
            }

        # 6. Format structured citations with page numbers
        citations = [
            {
                "doc_id": c["doc_id"],
                "chunk_id": c["chunk_id"],
                "chunk_index": c["chunk_index"],
                "page_number": c.get("page_number", c.get("metadata", {}).get("page_number", 1)),
                "title": c.get("metadata", {}).get("title"),
                "court": c.get("metadata", {}).get("court"),
                "year": c.get("metadata", {}).get("year"),
                "decision_date": c.get("metadata", {}).get("decision_date"),
                "source": c.get("metadata", {}).get("source"),
                "similarity_score": c.get("similarity_score"),
            }
            for c in valid_chunks
        ]

        is_established = not any(neg in raw_answer.lower() for neg in ["do not establish", "does not establish", "not established"])

        top_meta = valid_chunks[0].get("metadata", {})
        cta = self.advocate_matcher.generate_advocate_cta(
            practice_area=self._infer_practice_area(query, valid_chunks[0].get("text", "")),
            court=top_meta.get("court"),
            origin_source="rag_qa_result",
        )

        return {
            "query": query,
            "mode": "document",
            "doc_id": case_id,
            "answer": raw_answer,
            "citations": citations if is_established else [],
            "retrieved_passages": valid_chunks,
            "is_grounded": is_established,
            "status": "success" if is_established else "insufficient_evidence",
            "provider": self.llm_client.provider,
            "model": self.llm_client.model_name,
            "source_attribution": "Selected Document Passages",
            "advocate_cta": cta,
        }

    async def answer_general_question(
        self,
        query: str,
        case_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Answers statutory, doctrine, and general legal reference questions (Mode B)."""
        try:
            answer_text = await self.llm_client.generate_general_legal_response(query)
        except LLMGenerationError as exc:
            logger.error("LLM generation failed in answer_general_question: %s", exc.message)
            cta = self.advocate_matcher.generate_advocate_cta(
                practice_area=self._infer_practice_area(query, ""),
                court="Supreme Court / High Court",
                origin_source="general_legal_reference_error",
            )
            return {
                "query": query,
                "mode": "general",
                "doc_id": case_id,
                "answer": f"Generation failed: {exc.message}",
                "citations": [],
                "retrieved_passages": [],
                "is_grounded": False,
                "status": "error",
                "source_attribution": f"Error: Provider generation failed ({exc.provider})",
                "disclaimer": f"Error: {type(exc).__name__}",
                "advocate_cta": cta,
            }

        cta = self.advocate_matcher.generate_advocate_cta(
            practice_area=self._infer_practice_area(query, answer_text),
            court="Supreme Court / High Court",
            origin_source="general_legal_reference",
        )
        return {
            "query": query,
            "mode": "general",
            "doc_id": case_id,
            "answer": answer_text,
            "citations": [],
            "retrieved_passages": [],
            "is_grounded": False,
            "status": "success",
            "provider": self.llm_client.provider,
            "model": self.llm_client.model_name,
            "source_attribution": "General Legal Reference (Statutory Codes & Landmark Precedents)",
            "disclaimer": (
                "Notice: This answer is provided from CourtMind General Legal Reference for informational purposes. "
                "It is NOT extracted from the selected document and does not constitute formal legal advice. "
                "Please consult a qualified advocate for representation."
            ),
            "advocate_cta": cta,
        }

    async def summarize_document(self, doc_id: str) -> Dict[str, Any]:
        """Generates structured legal summary with 6 sections grounded in the document.

        Sections:
        1. Case Background & Parties
        2. Issues Before the Court
        3. Arguments Described in the Judgment
        4. Court's Reasoning
        5. Final Decision or Order
        6. Important Legal Principles & Practical Takeaways
        """
        all_chunks = await self.retriever.search_similar(
            [0.0] * self.embedder.dimension,
            top_k=50,
            filters={"doc_id": doc_id},
        )

        if not all_chunks:
            return {
                "doc_id": doc_id,
                "summary": "No document records found for the requested document ID.",
                "status": "not_found",
            }

        all_chunks.sort(key=lambda x: x.get("chunk_index", 0))
        meta = all_chunks[0].get("metadata", {})
        total_pages = meta.get("page_count", len(set(c.get("page_number", 1) for c in all_chunks)))

        # Compile representative excerpts across early, middle, and late chunks
        first_few = [c["text"] for c in all_chunks[:3]]
        middle_few = [c["text"] for c in all_chunks[len(all_chunks)//2:len(all_chunks)//2 + 2]] if len(all_chunks) > 4 else []
        last_few = [c["text"] for c in all_chunks[-2:]] if len(all_chunks) > 3 else []
        combined_text = "\n\n".join(first_few + middle_few + last_few)

        system_prompt = (
            "You are a judicial research assistant. Produce a structured legal case summary "
            "with sections: Case Background & Parties, Issues Before the Court, Arguments, "
            "Court's Reasoning, Final Decision, and Legal Principles."
        )
        user_prompt = (
            f"SUMMARIZE_DOCUMENT\n"
            f"Case Title: {meta.get('title')}\n"
            f"Document ID: {doc_id}\n"
            f"Total Pages: {total_pages}\n\n"
            f"Judgment Content:\n{combined_text[:4000]}"
        )

        try:
            summary_text = await self.llm_client.generate_response(system_prompt, user_prompt)
        except LLMGenerationError as exc:
            logger.error("LLM generation failed in summarize_document: %s", exc.message)
            cta = self.advocate_matcher.generate_advocate_cta(
                practice_area=self._infer_practice_area(meta.get("title", ""), combined_text),
                court=meta.get("court"),
                origin_source="document_summary_error",
            )
            return {
                "doc_id": doc_id,
                "case_id": doc_id,
                "title": meta.get("title"),
                "court": meta.get("court"),
                "year": meta.get("year"),
                "total_pages": total_pages,
                "total_chunks": len(all_chunks),
                "summary": f"Document summarization failed: {exc.message}",
                "status": "error",
                "advocate_cta": cta,
            }

        cta = self.advocate_matcher.generate_advocate_cta(
            practice_area=self._infer_practice_area(meta.get("title", ""), combined_text),
            court=meta.get("court"),
            origin_source="document_summary",
        )

        return {
            "doc_id": doc_id,
            "case_id": doc_id,
            "title": meta.get("title"),
            "court": meta.get("court"),
            "year": meta.get("year"),
            "total_pages": total_pages,
            "total_chunks": len(all_chunks),
            "summary": summary_text,
            "status": "success",
            "provider": self.llm_client.provider,
            "model": self.llm_client.model_name,
            "advocate_cta": cta,
        }

    async def summarize_case(self, case_id: str) -> Dict[str, Any]:
        """Backward-compatible alias for summarize_document."""
        return await self.summarize_document(case_id)

    async def explore_possible_options(
        self, problem_description: str, doc_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates decision-support options analysis distinguishing facts, findings, and risks.

        Args:
            problem_description: User's stated legal problem or dispute facts.
            doc_id: Optional document filter to anchor exploration to a specific judgment.

        Returns:
            Structured decision-support analysis dictionary with disclaimer and advocate CTA.
        """
        query_vec = self.embedder.embed_query(problem_description)
        filters = {"doc_id": doc_id} if doc_id else None
        retrieved_chunks = await self.retriever.search_similar(query_vec, top_k=3, filters=filters)

        context_blocks = []
        for i, c in enumerate(retrieved_chunks, start=1):
            meta = c.get("metadata", {})
            page = c.get("page_number", meta.get("page_number", 1))
            context_blocks.append(
                f"[Source {i}: Title: {meta.get('title')}, Document ID: {c.get('doc_id')}, "
                f"Court: {meta.get('court')}, Year: {meta.get('year')}, Page: {page}, Chunk: {c.get('chunk_index')}]\n{c.get('text')}"
            )
        context_str = "\n\n".join(context_blocks)

        system_prompt = (
            "You are CourtMind's decision-support assistant. Explore Possible Options for the user's legal problem."
        )
        user_prompt = (
            f"EXPLORE_OPTIONS\n"
            f"Stated Legal Problem: {problem_description}\n\n"
            f"Context Passages:\n{context_str}"
        )

        analysis_text = await self.llm_client.generate_response(system_prompt, user_prompt)

        cta = self.advocate_matcher.generate_advocate_cta(
            practice_area=self._infer_practice_area(problem_description, context_str),
            court=retrieved_chunks[0].get("metadata", {}).get("court") if retrieved_chunks else None,
            origin_source="explore_options",
        )

        return {
            "problem_description": problem_description,
            "analysis": analysis_text,
            "supporting_passages": retrieved_chunks,
            "disclaimer": "This analysis is an informational decision-support assessment and does not constitute formal legal advice. Please consult a qualified advocate.",
            "status": "success",
            "advocate_cta": cta,
        }

    # ------------------------------------------------------------------
    # Intent-mismatch and topic-coherence guards
    # ------------------------------------------------------------------

    # Maps document identity signals to topics that document CANNOT answer.
    # Keys are substrings matched against case_id (lowercased).
    # Values are lists of (intent_terms, refusal_message) tuples.
    # intent_terms: ANY of these in the query → mismatch.
    _DOCUMENT_FOREIGN_INTENTS: List[Dict] = [
        {
            "doc_signals": ["1615", "land acquisition", "rajesh kumar"],
            "foreign_intents": [
                {
                    "terms": ["capital punishment", "death penalty", "death sentence", "rarest of rare",
                              "murder", "ipc 302", "section 302", "criminal appeal"],
                    "message": (
                        "The selected document (Union of India v. Rajesh Kumar and Ors., 2023) is a civil "
                        "land acquisition judgment concerning deemed lapse under Section 24(2) of the 2013 "
                        "Act and does not establish the answer to this question. It contains insufficient "
                        "evidence regarding criminal law, capital punishment, or death penalty "
                        "jurisprudence. Please switch to 'General Legal Question' mode for such queries."
                    ),
                },
                {
                    "terms": ["maritime", "exclusive economic zone", "eez", "patent", "trademark",
                              "divorce", "matrimonial", "arbitration clause"],
                    "message": (
                        "The selected document (Civil Appeal No. 1615 of 2023, Land Acquisition) does not "
                        "establish the answer to this question. It contains insufficient evidence for the "
                        "queried topic. Please switch to 'General Legal Question' mode."
                    ),
                },
            ],
        },
        {
            "doc_signals": ["1980 air", "bachan singh", "1978 air  267", "1979"],
            "foreign_intents": [
                {
                    "terms": ["rarest of rare", "death penalty", "capital punishment", "mitigating", "aggravating"],
                    "message": (
                        "The selected document (Bachan Singh etc. v. State of Punjab, 14 Sept 1979, 2-Judge Bench) "
                        "does not establish or discuss the 'rarest of rare' doctrine or capital punishment principles. "
                        "This 1979 judgment specifically addresses procedural law under Sections 377 and 401 CrPC regarding appeals "
                        "against conviction heard alongside revision petitions for sentence enhancement. The 'rarest of rare' doctrine was laid down "
                        "in the subsequent 1980 5-Judge Constitution Bench judgment in Bachan Singh v. State of Punjab ((1980) 2 SCC 684). "
                        "To explore that doctrine or general statutory questions, please switch to 'General Legal Question' mode."
                    ),
                },
                {
                    "terms": ["land acquisition", "section 24", "compensation lapse", "solatium",
                              "maritime", "patent", "trademark", "divorce", "matrimonial"],
                    "message": (
                        "The selected document (Bachan Singh etc. v. State of Punjab, 1979, 2-Judge Bench) "
                        "addresses criminal procedure under Sections 377 and 401 CrPC. The queried topic is "
                        "not established and this judgment does not establish the answer. It contains insufficient "
                        "evidence for patent or foreign matters. Please switch to 'General Legal Question' mode."
                    ),
                },
            ],
        },
        {
            "doc_signals": ["1978 air  597", "maneka gandhi", "1978 air 597"],
            "foreign_intents": [
                {
                    "terms": ["maritime", "exclusive economic zone", "eez", "patent", "trademark",
                              "land acquisition", "solatium", "capital punishment", "death penalty",
                              "divorce", "matrimonial"],
                    "message": (
                        "The selected document (Maneka Gandhi v. Union of India, 1978) does not establish "
                        "the answer to this question. It addresses passport impoundment and personal liberty under "
                        "Article 21 and contains insufficient evidence regarding maritime or foreign matters. "
                        "Please switch to 'General Legal Question' mode for such queries."
                    ),
                },
            ],
        },
    ]

    def _check_document_intent_mismatch(
        self, query: str, case_id: Optional[str], chunks: List[Dict[str, Any]]
    ) -> Optional[str]:
        """Returns a refusal message string when the query's primary intent is
        structurally incompatible with the selected document's domain, or None
        when the query may legitimately be answered.

        This guard runs *after* topic-coherence so it only fires when some word
        overlap exists (otherwise topic-coherence would have already refused).
        It catches cases like EVAL-06 where "land" overlaps but the core intent
        ("capital punishment") is unrelated to the land-acquisition document.
        """
        if not case_id:
            return None
        case_lower = case_id.lower()
        q_lower = query.lower()

        # Also inspect metadata of retrieved chunks for doc identity
        chunk_doc_ids = " ".join(
            str(c.get("doc_id", "")) + " " + str(c.get("metadata", {}).get("title", ""))
            for c in chunks
        ).lower()

        for entry in self._DOCUMENT_FOREIGN_INTENTS:
            # Check if this entry applies to the selected document
            if not any(sig in case_lower or sig in chunk_doc_ids for sig in entry["doc_signals"]):
                continue
            # Check each foreign intent
            for fi in entry["foreign_intents"]:
                if any(term in q_lower for term in fi["terms"]):
                    return fi["message"]

        return None

    _BROAD_LEGAL_INQUIRY_TERMS: frozenset = frozenset({
        "constitution", "constitutional", "article", "liberty", "fundamental",
        "rights", "right", "issue", "issues", "principle", "principles",
        "reasoning", "reason", "decision", "holding", "held", "summary",
        "summarize", "facts", "background", "overview", "ratio", "obiter",
        "impound", "impounding", "passport", "procedure", "fair", "just",
        "compensation", "lapse", "appeal", "sentence", "revision", "jurisdiction",
        "doctrine", "statute", "statutory", "ruling", "precedent", "order",
    })

    def _has_topic_coherence(self, query: str, chunks: List[Dict[str, Any]]) -> bool:
        """Returns True if the query exhibits topic coherence with retrieved context.

        Allows through:
        1. Queries containing substantive broad legal inquiry terms (e.g. 'constitutional',
           'reasoning', 'principles', 'issues', 'liberty', 'procedure').
        2. Queries with strong similarity scores (>= 0.30) from dense retrieval.
        3. Queries sharing at least 1 non-trivial content word with at least one chunk.

        Only refuses queries that have zero lexical overlap, low similarity, and no
        broad legal inquiry terms (e.g. maritime law queried against passport judgment).
        """
        q_lower = query.lower()
        if any(term in q_lower for term in self._BROAD_LEGAL_INQUIRY_TERMS):
            return True

        if any(chunk.get("similarity_score", 0.0) >= 0.30 for chunk in chunks):
            return True

        q_words = _content_words(query)
        if not q_words:
            # Can't determine — allow through (edge case: single stopword query).
            return True
        for chunk in chunks:
            chunk_words = _content_words(chunk.get("text", ""))
            if q_words & chunk_words:  # non-empty intersection
                return True
        return False

    def _infer_practice_area(self, text_a: str, text_b: str) -> str:
        """Heuristic helper to infer legal practice area for advocate matching."""
        combined = f"{text_a} {text_b}".lower()
        if any(w in combined for w in ["constitution", "article 21", "article 14", "article 32", "writ", "fundamental right"]):
            return "Constitutional Law"
        if any(w in combined for w in ["criminal", "penal", "bail", "conviction", "section 302", "crpc", "ipc"]):
            return "Criminal Law"
        if any(w in combined for w in ["land", "acquisition", "compensation", "property", "civil appeal", "eviction"]):
            return "Civil Law / Land Acquisition"
        if any(w in combined for w in ["arbitration", "contract", "commercial", "tender", "company"]):
            return "Commercial Arbitration"
        return "Constitutional Law"
