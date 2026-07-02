from qdrant_client import QdrantClient

from app.core.config import settings
from app.services.retrieval.embed_service import get_embedding_service


class SearchService:
    """
    Handles semantic vector search using Qdrant.
    """

    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL
        )

        self.embedder = get_embedding_service()

    def search(
        self,
        query: str,
        limit: int = 5,
    ):
        """
        Search the Qdrant collection for the most relevant chunks.
        """

        query_vector = self.embedder.embed(query)

        response = self.client.query_points(
            collection_name=settings.COLLECTION_NAME,
            query=query_vector,
            limit=limit,
        )

        return response