from functools import lru_cache

from sentence_transformers import SentenceTransformer


MODEL_NAME = "BAAI/bge-small-en-v1.5"


class EmbeddingService:
    """
    Handles text embedding generation using Sentence Transformers.
    """

    def __init__(self):
        self.model = SentenceTransformer(MODEL_NAME)

    def embed(self, text: str) -> list[float]:
        """
        Generate an embedding vector for a single text.
        """
        embedding = self.model.encode(
            text,
            normalize_embeddings=True,
        )

        return embedding.tolist()


@lru_cache
def get_embedding_service() -> EmbeddingService:
    """
    Returns a singleton EmbeddingService instance.
    """
    return EmbeddingService()