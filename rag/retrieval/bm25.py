"""Okapi BM25 Lexical Ranking Engine for Legal Document Chunks.

Implements classic Okapi BM25 (k1=1.5, b=0.75) with legal-domain term
normalization, field-weighted scoring (title/headings receive higher weight),
and fast in-memory inverted index lookups.
"""
import math
import re
from typing import Any, Dict, List, Optional, Set, Tuple

# Common legal and English stopwords
_STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
    "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
    "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same",
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
    "yours", "yourself", "yourselves",
}


def tokenize_legal_text(text: str) -> List[str]:
    """Extracts normalized legal tokens preserving statutory identifiers like 24(2), 377(3), etc."""
    if not text:
        return []
    # Match statutory citations e.g. 24(2), 10(3)(c) as well as regular alphanumeric terms
    raw_tokens = re.findall(r"\b\d+(?:\([a-zA-Z0-9]+\))+|\b[a-zA-Z0-9_\-]{2,}\b", text.lower())
    tokens: List[str] = []
    for t in raw_tokens:
        clean = t.strip(".,;:\"'!?[]{}").lower()
        if clean and clean not in _STOPWORDS and len(clean) >= 2:
            tokens.append(clean)
            m = re.match(r"^(\d+)\(", clean)
            if m:
                base = m.group(1)
                if base not in tokens:
                    tokens.append(base)
    return tokens


class BM25Index:
    """In-memory BM25 inverted index optimized for legal judgments and statutory chunks."""

    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.doc_len: Dict[str, int] = {}
        self.doc_count: int = 0
        self.avg_doc_len: float = 0.0
        # term -> {chunk_id: term_frequency}
        self.inverted_index: Dict[str, Dict[str, int]] = {}
        # term -> IDF
        self.idf: Dict[str, float] = {}
        # chunk_id -> chunk dict
        self.chunks_map: Dict[str, Dict[str, Any]] = {}

    def index_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """Indexes a collection of chunks into the BM25 inverted index."""
        self.doc_len.clear()
        self.inverted_index.clear()
        self.idf.clear()
        self.chunks_map.clear()

        total_len = 0
        self.doc_count = len(chunks)

        if self.doc_count == 0:
            self.avg_doc_len = 0.0
            return

        for chunk in chunks:
            chunk_id = chunk["chunk_id"]
            self.chunks_map[chunk_id] = chunk

            # Weight metadata (title, court, section headings) 2x
            meta = chunk.get("metadata", {})
            title = str(meta.get("title", ""))
            heading = str(meta.get("section_heading", ""))
            text = chunk.get("text", "")

            body_tokens = tokenize_legal_text(text)
            meta_tokens = tokenize_legal_text(f"{title} {heading}") * 2
            all_tokens = body_tokens + meta_tokens

            doc_length = len(all_tokens)
            self.doc_len[chunk_id] = doc_length
            total_len += doc_length

            # Compute term frequencies
            tf_dict: Dict[str, int] = {}
            for t in all_tokens:
                tf_dict[t] = tf_dict.get(t, 0) + 1

            for t, count in tf_dict.items():
                if t not in self.inverted_index:
                    self.inverted_index[t] = {}
                self.inverted_index[t][chunk_id] = count

        self.avg_doc_len = total_len / self.doc_count if self.doc_count > 0 else 0.0

        # Precompute IDF for each term
        for term, postings in self.inverted_index.items():
            df = len(postings)
            # Robertson-Spärck Jones IDF formula
            self.idf[term] = math.log(1.0 + (self.doc_count - df + 0.5) / (df + 0.5))

    def search(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Tuple[str, float]]:
        """Scores indexed chunks against query using BM25 formula with optional filtering.

        Returns:
            List of (chunk_id, bm25_score) ordered by descending relevance.
        """
        if not query or self.doc_count == 0:
            return []

        query_tokens = tokenize_legal_text(query)
        if not query_tokens:
            return []

        scores: Dict[str, float] = {}

        for term in query_tokens:
            if term not in self.inverted_index:
                continue

            term_idf = self.idf.get(term, 0.0)
            postings = self.inverted_index[term]

            for chunk_id, tf in postings.items():
                # Apply metadata filters if provided
                if filters and not self._matches_filters(self.chunks_map[chunk_id], filters):
                    continue

                d_len = self.doc_len.get(chunk_id, self.avg_doc_len)
                num = tf * (self.k1 + 1.0)
                den = tf + self.k1 * (1.0 - self.b + self.b * (d_len / (self.avg_doc_len or 1.0)))
                bm25_term_score = term_idf * (num / den)

                scores[chunk_id] = scores.get(chunk_id, 0.0) + bm25_term_score

        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]

    def _matches_filters(self, chunk: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        meta = chunk.get("metadata", {})
        for key, val in filters.items():
            if val is None or val == "":
                continue
            val_str = str(val).strip().lower()

            if key in ("doc_id", "case_id"):
                chunk_doc = str(chunk.get("doc_id", "")).lower()
                meta_doc = str(meta.get("doc_id", "")).lower()
                chunk_title = str(meta.get("title", "")).lower()
                if val_str in chunk_doc or chunk_doc in val_str or val_str in meta_doc or val_str in chunk_title:
                    continue
                return False
            elif key == "court":
                chunk_court = str(meta.get("court", "")).lower()
                if val_str in chunk_court or chunk_court in val_str:
                    continue
                return False
            elif key == "year":
                if str(meta.get("year", "")) == str(val):
                    continue
                return False
        return True

