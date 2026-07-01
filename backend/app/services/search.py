from typing import List, Optional
from app.schemas.document import SearchResult
from app.services.embedding import EmbeddingService
from app.repositories.document_repo import DocumentRepository


class SearchService:
    def __init__(self, embedding: EmbeddingService, repo: DocumentRepository):
        self.embedding = embedding
        self.repo = repo

    async def semantic_search(
        self, query: str, limit: int = 5, user_id: Optional[str] = None
    ) -> List[SearchResult]:
        # Generate query vector
        query_vector = await self.embedding.embed_text(query)

        # Perform similarity search
        return await self.repo.search_similar(
            query_vector=query_vector, limit=limit, user_id=user_id
        )
