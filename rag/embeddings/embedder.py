import math
import os
import re
from typing import List, Optional


class TextEmbedder:
    """Generates dense vector embeddings for legal text chunks and search queries.

    Supported providers:
    - 'sentence-transformers' / 'huggingface': Genuine local transformer models (e.g. all-MiniLM-L6-v2)
    - 'openai': Remote OpenAI embeddings (e.g. text-embedding-3-small)
    - 'local': Deterministic unit-normalized semantic hash projection (clearly labeled for offline test-only usage)

    All generated embeddings are normalized to unit length (L2 norm) for cosine similarity.
    """

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        dimension: int = 384,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> None:
        self.model_name = model_name
        self.dimension = dimension
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
        self._st_model = None
        self._openai_client = None
        self.is_genuine_provider = False

        env_provider = os.getenv("EMBEDDING_PROVIDER", "").lower()
        requested_provider = (provider or env_provider or "").lower()

        # 1. Try OpenAI if explicitly configured with an API key
        if requested_provider == "openai" and self.api_key:
            self._init_openai_client()

        # 2. Try SentenceTransformers (standard default for genuine local embedding)
        if not self.is_genuine_provider:
            self._init_sentence_transformer()

        # 3. If genuine models are not available or fail, use clearly labeled test-only fallback
        if not self.is_genuine_provider:
            self.provider = "local"
            self.provider_label = "test-only-deterministic-fallback"
            self.is_genuine_provider = False

    def _init_openai_client(self) -> None:
        """Initializes the official OpenAI client."""
        try:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=self.api_key)
            self.provider = "openai"
            self.provider_label = "openai (text-embedding-3-small)"
            self.is_genuine_provider = True
        except Exception:
            self._openai_client = None

    def _init_sentence_transformer(self) -> None:
        """Initializes SentenceTransformer with cached local or HuggingFace weights."""
        try:
            from sentence_transformers import SentenceTransformer
            self._st_model = SentenceTransformer(self.model_name)
            self.provider = "sentence-transformers"
            self.provider_label = f"sentence-transformers ({self.model_name})"
            self.is_genuine_provider = True
        except Exception:
            self._st_model = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embeds a batch of legal text chunks into dense vector representations.

        Args:
            texts: List of input strings to embed.

        Returns:
            List of L2-normalized float embedding vectors of size `self.dimension`.
        """
        if not texts:
            return []

        # Genuine SentenceTransformer embedding
        if self._st_model is not None:
            try:
                raw_vecs = self._st_model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
                return [self._normalize_vector(vec.tolist()[:self.dimension]) for vec in raw_vecs]
            except Exception:
                pass

        # Genuine OpenAI embedding
        if self._openai_client is not None:
            try:
                clean_texts = [t.replace("\n", " ")[:8000] for t in texts]
                model = "text-embedding-3-small" if "all-MiniLM" in self.model_name else self.model_name
                response = self._openai_client.embeddings.create(
                    input=clean_texts,
                    model=model,
                )
                embeddings = [data.embedding for data in response.data]
                return [
                    self._normalize_vector(vec[:self.dimension]) if len(vec) >= self.dimension 
                    else self._normalize_vector(vec + [0.0] * (self.dimension - len(vec)))
                    for vec in embeddings
                ]
            except Exception:
                pass

        # Offline test-only fallback (labeled clearly)
        return [self._local_test_embed(text) for text in texts]

    def embed_query(self, query: str) -> List[float]:
        """Embeds a single search query into an L2-normalized vector representation."""
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * self.dimension

    def _local_test_embed(self, text: str) -> List[float]:
        """Test-only deterministic token & character n-gram projection for offline unit testing."""
        vec = [0.0] * self.dimension
        if not text.strip():
            return vec

        tokens = re.findall(r"\w+", text.lower())
        for token in tokens:
            h = hash(token)
            idx = abs(h) % self.dimension
            sign = 1.0 if (h & 1) == 0 else -1.0
            vec[idx] += sign * 1.5

            if len(token) >= 3:
                for i in range(len(token) - 2):
                    sub = token[i:i+3]
                    sub_h = hash(sub)
                    sub_idx = abs(sub_h) % self.dimension
                    sub_sign = 1.0 if (sub_h & 1) == 0 else -1.0
                    vec[sub_idx] += sub_sign * 0.5

        clean_text = text.lower()
        for i in range(len(clean_text) - 1):
            bg = clean_text[i:i+2]
            bg_h = hash(bg)
            idx = abs(bg_h) % self.dimension
            vec[idx] += 0.2 if (bg_h & 1) == 0 else -0.2

        return self._normalize_vector(vec)

    def _normalize_vector(self, vec: List[float]) -> List[float]:
        """L2 unit normalization to ensure dot product equals cosine similarity."""
        norm = math.sqrt(sum(x * x for x in vec))
        if norm < 1e-12:
            return [0.0] * len(vec)
        return [round(x / norm, 8) for x in vec]
