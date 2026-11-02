import json
import math
import os
import re
from typing import Any, Dict, List, Optional
from rag.retrieval.bm25 import BM25Index, tokenize_legal_text


class PgVectorRetriever:
    """Manages index operations and similarity search over PostgreSQL with pgvector extension.

    Features:
    - Dual-mode architecture (PostgreSQL pgvector when available, in-memory vector store fallback)
    - Strict document-level filtering by doc_id / case_id / title / court / year
    - Hybrid BM25 + dense vector retrieval with Reciprocal Rank Fusion (RRF)
    - Preserves page numbers and chunk metadata
    """

    def __init__(
        self,
        connection_url: Optional[str] = None,
        table_name: str = "courtmind_chunks",
        embedding_dimension: int = 384,
    ) -> None:
        self.connection_url = connection_url or os.getenv("VECTOR_DATABASE_URL")
        self.table_name = table_name
        self.dimension = embedding_dimension

        # In-memory storage cache / fallback
        self._memory_chunks: Dict[str, Dict[str, Any]] = {}
        self._memory_embeddings: Dict[str, List[float]] = {}
        self._is_postgres_active: bool = False

        # BM25 lexical index (rebuilt on each upsert)
        self._bm25_index: BM25Index = BM25Index()

        if self.connection_url and not self.connection_url.startswith("memory:"):
            self._try_init_postgres()

    def _try_init_postgres(self) -> None:
        """Attempts connection to PostgreSQL and initializes pgvector table if available."""
        try:
            import psycopg2
            from psycopg2.extras import Json

            conn = psycopg2.connect(self.connection_url)
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS {self.table_name} (
                        chunk_id VARCHAR(255) PRIMARY KEY,
                        doc_id VARCHAR(255) NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        page_number INTEGER NOT NULL DEFAULT 1,
                        text TEXT NOT NULL,
                        metadata JSONB NOT NULL,
                        embedding vector({self.dimension}) NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS {self.table_name}_embedding_idx 
                    ON {self.table_name} USING hnsw (embedding vector_cosine_ops);
                """)
                conn.commit()
            conn.close()
            self._is_postgres_active = True
        except Exception:
            self._is_postgres_active = False

    async def upsert_chunks(
        self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]
    ) -> int:
        """Stores chunks and vector embeddings into pgvector or memory index."""
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Chunks count ({len(chunks)}) must match embeddings count ({len(embeddings)})."
            )

        if not chunks:
            return 0

        for chunk, emb in zip(chunks, embeddings):
            chunk_id = chunk["chunk_id"]
            self._memory_chunks[chunk_id] = chunk
            self._memory_embeddings[chunk_id] = emb

        # Rebuild BM25 index over all currently stored chunks
        self._bm25_index.index_chunks(list(self._memory_chunks.values()))

        if self._is_postgres_active and self.connection_url:
            try:
                import psycopg2
                from psycopg2.extras import Json

                conn = psycopg2.connect(self.connection_url)
                with conn.cursor() as cur:
                    query = f"""
                        INSERT INTO {self.table_name} (chunk_id, doc_id, chunk_index, page_number, text, metadata, embedding)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (chunk_id) DO UPDATE SET
                            text = EXCLUDED.text,
                            metadata = EXCLUDED.metadata,
                            embedding = EXCLUDED.embedding;
                    """
                    records = [
                        (
                            c["chunk_id"],
                            c["doc_id"],
                            c["chunk_index"],
                            c.get("page_number", c.get("metadata", {}).get("page_number", 1)),
                            c["text"],
                            Json(c.get("metadata", {})),
                            emb,
                        )
                        for c, emb in zip(chunks, embeddings)
                    ]
                    cur.executemany(query, records)
                    conn.commit()
                conn.close()
            except Exception:
                pass

        return len(chunks)

    async def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        query_text: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Queries nearest neighbors using Cosine Similarity with hybrid entity ranking.

        Args:
            query_embedding: Vector representation of the search query.
            top_k: Maximum number of closest matches to return.
            filters: Optional dictionary of metadata criteria (e.g. {'doc_id': '...'}).
            query_text: Optional raw text of the query to apply entity-aware ranking.

        Returns:
            List of ranked chunk dictionaries with similarity_score and distance.
        """
        if self._is_postgres_active and self.connection_url:
            try:
                return self._search_postgres(query_embedding, top_k, filters)
            except Exception:
                pass

        return self._search_memory(query_embedding, top_k, filters, query_text=query_text)

    def _search_memory(
        self,
        query_vec: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        query_text: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Hybrid BM25 + dense cosine similarity search with Reciprocal Rank Fusion (RRF).

        Algorithm:
        1. Compute BM25 scores for all filtered chunks → rank list A
        2. Compute dense cosine similarity for all filtered chunks → rank list B
        3. Fuse both rank lists with RRF: score = 1/(k+rank_A) + 1/(k+rank_B), k=60
        4. Return top-k by RRF score; deduplication by chunk_id is implicit via dict.
        """
        q_lower = query_text.lower() if query_text else ""
        RRF_K = 60

        # ── 1. Collect candidate chunk_ids passing filters ──────────────────
        candidate_ids: List[str] = []
        for chunk_id, chunk in self._memory_chunks.items():
            if filters and not self._matches_filters(chunk, filters):
                continue
            candidate_ids.append(chunk_id)

        if not candidate_ids:
            return []

        candidate_set = set(candidate_ids)

        # ── 2. Dense cosine similarity ranking ──────────────────────────────
        dense_scores: List[tuple] = []  # (chunk_id, sim)
        for chunk_id in candidate_ids:
            emb = self._memory_embeddings.get(chunk_id)
            if emb is None:
                continue
            sim = sum(a * b for a, b in zip(query_vec, emb))
            sim = max(-1.0, min(1.0, sim))
            dense_scores.append((chunk_id, sim))

        # Apply early-chunk boost for overview-style queries (generic, not doc-specific)
        overview_terms = [
            "what is this case about", "what is the case about", "overview",
            "facts of the case", "about this case", "parties", "what happened",
        ]
        if query_text and any(term in q_lower for term in overview_terms):
            boosted = []
            for chunk_id, sim in dense_scores:
                chunk = self._memory_chunks[chunk_id]
                idx = chunk.get("chunk_index", 999)
                pg = chunk.get("page_number", chunk.get("metadata", {}).get("page_number", 999))
                if idx <= 4 or pg <= 2:
                    sim = min(1.0, sim + 0.12)
                boosted.append((chunk_id, sim))
            dense_scores = boosted

        dense_scores.sort(key=lambda x: x[1], reverse=True)
        dense_rank: Dict[str, int] = {cid: rank + 1 for rank, (cid, _) in enumerate(dense_scores)}
        dense_score_map: Dict[str, float] = {cid: s for cid, s in dense_scores}

        # ── 3. BM25 lexical ranking (pre-filtered by candidate_set) ─────────
        bm25_results: List[tuple] = []  # (chunk_id, bm25_score)
        if query_text and self._bm25_index.doc_count > 0:
            raw_bm25 = self._bm25_index.search(query_text, top_k=len(candidate_ids) * 2, filters=filters)
            bm25_results = [(cid, score) for cid, score in raw_bm25 if cid in candidate_set]

        bm25_rank: Dict[str, int] = {cid: rank + 1 for rank, (cid, _) in enumerate(bm25_results)}

        # ── 4. RRF fusion ────────────────────────────────────────────────────
        # Chunks not ranked by BM25 get rank = len(candidate_ids) + 1 (worst possible)
        worst_bm25_rank = len(candidate_ids) + 1
        fused: Dict[str, float] = {}
        for chunk_id in candidate_ids:
            r_dense = dense_rank.get(chunk_id, worst_bm25_rank)
            r_bm25 = bm25_rank.get(chunk_id, worst_bm25_rank)
            fused[chunk_id] = 1.0 / (RRF_K + r_dense) + 1.0 / (RRF_K + r_bm25)

        sorted_chunks = sorted(fused.items(), key=lambda x: x[1], reverse=True)

        # ── 5. Build result list ─────────────────────────────────────────────
        results: List[Dict[str, Any]] = []
        for chunk_id, rrf_score in sorted_chunks[:top_k]:
            chunk = self._memory_chunks[chunk_id]
            # Use dense cosine score for similarity_score (for threshold filtering in pipeline)
            dense_sim = dense_score_map.get(chunk_id, 0.0)
            page_num = chunk.get("page_number", chunk.get("metadata", {}).get("page_number", 1))
            results.append({
                "chunk_id": chunk["chunk_id"],
                "doc_id": chunk["doc_id"],
                "chunk_index": chunk["chunk_index"],
                "page_number": page_num,
                "text": chunk["text"],
                "metadata": chunk.get("metadata", {}),
                "similarity_score": round(max(0.0, dense_sim), 5),
                "hybrid_score": round(rrf_score, 6),
                "distance": round(1.0 - max(0.0, dense_sim), 5),
            })
        return results

    def _calculate_hybrid_boost(self, chunk: Dict[str, Any], q_lower: str) -> float:
        """Legacy method kept for backward compatibility. Returns 0.0 — boosting is now
        handled inside _search_memory via BM25 RRF fusion."""
        return 0.0

    def _matches_filters(self, chunk: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Evaluates whether a chunk matches strict filter criteria."""
        meta = chunk.get("metadata", {})
        for key, val in filters.items():
            if val is None or val == "":
                continue
            val_str = str(val).strip().lower()

            if key in ("doc_id", "case_id"):
                chunk_doc = str(chunk.get("doc_id", "")).lower()
                meta_doc = str(meta.get("doc_id", "")).lower()
                chunk_title = str(meta.get("title", "")).lower()
                # Substring or exact match against doc_id or title
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

            else:
                if key in chunk and str(chunk[key]).lower() == val_str:
                    continue
                if key in meta and str(meta[key]).lower() == val_str:
                    continue
                return False

        return True

    def _search_postgres(
        self,
        query_vec: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """PostgreSQL pgvector cosine distance operator (<=>)."""
        import psycopg2

        conn = psycopg2.connect(self.connection_url)
        where_clauses = []
        params: List[Any] = [query_vec]

        if filters:
            for k, v in filters.items():
                if k in ("doc_id", "chunk_id", "case_id"):
                    where_clauses.append("doc_id ILIKE %s")
                    params.append(f"%{v}%")
                else:
                    where_clauses.append("metadata->>%s = %s")
                    params.extend([k, str(v)])

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        query = f"""
            SELECT chunk_id, doc_id, chunk_index, page_number, text, metadata,
                   1 - (embedding <=> %s::vector) AS similarity_score
            FROM {self.table_name}
            {where_sql}
            ORDER BY embedding <=> %s::vector ASC
            LIMIT %s;
        """
        params.extend([query_vec, top_k])

        results = []
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            for row in rows:
                sim = float(row[6])
                results.append({
                    "chunk_id": row[0],
                    "doc_id": row[1],
                    "chunk_index": row[2],
                    "page_number": row[3],
                    "text": row[4],
                    "metadata": row[5] if isinstance(row[5], dict) else json.loads(row[5]),
                    "similarity_score": round(sim, 5),
                    "distance": round(1.0 - sim, 5),
                })
        conn.close()
        return results

    def clear(self) -> None:
        """Clears stored chunks from memory, BM25 index, and Postgres."""
        self._memory_chunks.clear()
        self._memory_embeddings.clear()
        self._bm25_index = BM25Index()
        if self._is_postgres_active and self.connection_url:
            try:
                import psycopg2
                conn = psycopg2.connect(self.connection_url)
                with conn.cursor() as cur:
                    cur.execute(f"TRUNCATE TABLE {self.table_name};")
                    conn.commit()
                conn.close()
            except Exception:
                pass
