import pytest
import uuid
import asyncio
from typing import List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.testclient import TestClient
from app.db.session import tenant_id_var
from app.services.retrieval.bm25_service import bm25_service
from app.services.search import SearchService
from app.repositories.document_repo import DocumentRepository
from app.services.embedding import EmbeddingService, EmbeddingProviderFactory
from app.schemas.document import TextChunk, ChunkMetadata
from app.core.config import settings

from unittest.mock import AsyncMock

@pytest.fixture
def test_search_service():
    repo = DocumentRepository(None, collection_name=settings.QDRANT_COLLECTION_NAME)
    provider = EmbeddingProviderFactory.create(settings.EMBEDDING_PROVIDER, settings.EMBEDDING_MODEL)
    embedding = EmbeddingService(provider=provider)
    return SearchService(embedding=embedding, repo=repo)

@pytest.mark.asyncio
async def test_rag_isolation_cross_tenant(db_session: AsyncSession):
    # Setup mocked search service
    from unittest.mock import AsyncMock, patch
    from qdrant_client.http import models as rest
    
    mock_qdrant = AsyncMock()
    mock_qdrant.query_points.return_value = AsyncMock(points=[])
    
    repo = DocumentRepository(mock_qdrant, collection_name=settings.QDRANT_COLLECTION_NAME)
    provider = EmbeddingProviderFactory.create(settings.EMBEDDING_PROVIDER, settings.EMBEDDING_MODEL)
    embedding = EmbeddingService(provider=provider)
    embedding.embed_text = AsyncMock(return_value=[0.1]*384)
    
    search_service = SearchService(embedding=embedding, repo=repo)
    
    tenant_a = uuid.uuid4()
    
    # Execute search as Tenant A
    tenant_id_var.set(tenant_a)
    await search_service.search("project architecture")
    
    # Verify qdrant was called with correct filter
    mock_qdrant.query_points.assert_called_once()
    call_kwargs = mock_qdrant.query_points.call_args.kwargs
    assert "query_filter" in call_kwargs
    q_filter = call_kwargs["query_filter"]
    
    # Must have must conditions
    assert q_filter.must is not None
    tenant_filter_found = False
    for cond in q_filter.must:
        if isinstance(cond, rest.FieldCondition) and cond.key == "tenant_id":
            assert cond.match.value == str(tenant_a)
            tenant_filter_found = True
            
    assert tenant_filter_found, "Tenant filter was not applied to vector search"

from app.core.exceptions import TenantContextMissingError

@pytest.mark.asyncio
async def test_rag_isolation_no_tenant(db_session: AsyncSession, test_search_service: SearchService):
    tenant_id_var.set(None)
    
    # Test 4: No tenant context executes
    with pytest.raises(TenantContextMissingError):
        await test_search_service.search("anything")
        
    with pytest.raises(TenantContextMissingError):
        await test_search_service.semantic_search("anything")
        
    with pytest.raises(TenantContextMissingError):
        await bm25_service.search("anything")
