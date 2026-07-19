from typing import List, Optional
import asyncio
from app.schemas.document import SearchResult
from app.schemas.search import HybridSearchResponse
from app.services.embedding import EmbeddingService
from app.repositories.document_repo import DocumentRepository
from app.services.retrieval.bm25_service import bm25_service
from app.services.retrieval.fusion import reciprocal_rank_fusion
from app.core.config import settings
from app.db.session import tenant_id_var
from app.core.exceptions import TenantContextMissingError
from qdrant_client.http import models as rest

class SearchService:
    def __init__(self, embedding: EmbeddingService, repo: DocumentRepository):
        self.embedding = embedding
        self.repo = repo
        self.bm25 = bm25_service

    async def semantic_search(
        self, query: str, limit: int = 5, user_id: Optional[str] = None
    ) -> List[SearchResult]:
        # semantic_search relies on search_similar which uses tenant_id_var internally
        # However, we must explicitly ensure tenant_id is present to fail closed.
        tenant_id = tenant_id_var.get()
        if not tenant_id:
            raise TenantContextMissingError("Tenant context required for retrieval")
            
        # Generate query vector
        query_vector = await self.embedding.embed_text(query)

        # Perform similarity search
        return await self.repo.search_similar(
            query_vector=query_vector, limit=limit, user_id=user_id
        )

    async def search(self, query: str | list[str], limit: int = 5) -> HybridSearchResponse:
        """
        Executes hybrid retrieval (Dense + Lexical BM25) for one or multiple queries and fuses the results using RRF.
        Returns a HybridSearchResponse mimicking Qdrant's .points abstraction for backwards compatibility with RAGPipeline.
        """
        tenant_id = tenant_id_var.get()
        if not tenant_id:
            raise TenantContextMissingError("Tenant context required for retrieval")
            
        must_conditions = [
            rest.FieldCondition(
                key="tenant_id", match=rest.MatchValue(value=str(tenant_id))
            )
        ]
        query_filter = rest.Filter(must=must_conditions)
        
        queries = [query] if isinstance(query, str) else query
        
        all_vector_results = []
        all_bm25_results = []
        
        for q in queries:
            query_vector = await self.embedding.embed_text(q)

            vector_search_task = self.repo.client.query_points(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                query=query_vector,
                limit=limit,
                query_filter=query_filter
            )
            
            bm25_search_task = self.bm25.search(q, limit=limit)
            
            vector_response, bm25_response = await asyncio.gather(
                vector_search_task, 
                bm25_search_task
            )
            all_vector_results.append(vector_response)
            all_bm25_results.append(bm25_response)
            
        fused_response = reciprocal_rank_fusion(
            vector_results=all_vector_results,
            bm25_results=all_bm25_results,
            limit=limit
        )

        return fused_response
