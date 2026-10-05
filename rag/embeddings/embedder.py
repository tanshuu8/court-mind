from typing import List, Optional


class TextEmbedder:
    """Generates dense vector embeddings for legal text chunks and search queries.

    Designed to support models such as:
    - sentence-transformers/all-MiniLM-L6-v2
    - BAAI/bge-base-en-v1.5
    - OpenAI text-embedding-3-small
    """

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        dimension: int = 384,
    ) -> None:
        self.model_name = model_name
        self.dimension = dimension
        self.client = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embeds a batch of legal text chunks into dense vector representations.

        TODO:
            1. Initialize embedding model (via HuggingFace pipeline or OpenAI API client).
            2. Batch inference on input texts.
            3. Normalize vector embeddings to unit length (L2 norm) for cosine similarity.
        """
        raise NotImplementedError("TextEmbedder.embed_texts() will be implemented in Phase 3.")

    def embed_query(self, query: str) -> List[float]:
        """Embeds a single search query into vector representation.

        TODO:
            1. Preprocess query text.
            2. Compute single vector embedding.
        """
        raise NotImplementedError("TextEmbedder.embed_query() will be implemented in Phase 3.")
