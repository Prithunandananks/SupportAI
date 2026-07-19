import pytest
from app.repositories.admin_repo import AdminRepository
from app.services.retrieval.rag_pipeline import RAGPipeline
from app.services.llm.groq_service import GroqService
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership
from app.db.session import tenant_id_var
from sqlalchemy import select

@pytest.mark.asyncio
async def test_admin_repo_get_system_stats(db_session, admin_token):
    admin_repo = AdminRepository(db_session)
    stats = await admin_repo.get_stats()
    assert "total_users" in stats
    assert "active_users" in stats

@pytest.mark.asyncio
async def test_groq_service_generate_response():
    from unittest.mock import patch, MagicMock
    
    groq_service = GroqService()
    with patch.object(groq_service.client.chat.completions, "create") as mock_create:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Mock response"
        mock_create.return_value = mock_response
        
        resp = await groq_service.generate(
            prompt="hello",
            temperature=0.0
        )
        assert resp == "Mock response"

@pytest.mark.asyncio
async def test_rag_pipeline_generate_answer(db_session, admin_token):
    result = await db_session.execute(select(Tenant))
    tenant = result.scalars().first()
    tenant_id_var.set(tenant.id)
    
    from unittest.mock import MagicMock, AsyncMock
    search_service = MagicMock()
    search_service.search = AsyncMock()
    
    mock_result = MagicMock()
    mock_result.points = []
    search_service.search.return_value = mock_result
    
    rag = RAGPipeline(search_service=search_service)
    
    answer, sources, attribution = await rag.run("test query", session_id=None)
    assert "couldn't find" in answer
