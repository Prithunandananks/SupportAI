import pytest
from httpx import AsyncClient
from app.models.user import User

@pytest.mark.asyncio
async def test_admin_health_success(client: AsyncClient, admin_user: User, admin_token_headers: dict):
    # This should return 200 after the migration fixes the tickethistoryevent enum
    res = await client.get("/api/v1/admin/health", headers=admin_token_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["database"] == "healthy"
    assert "documents" in data
    assert "users" in data
    assert "conversations" in data

@pytest.mark.asyncio
async def test_admin_health_degraded_fallback(client: AsyncClient, admin_user: User, admin_token_headers: dict, monkeypatch):
    # Test degraded fallback if get_stats() fails
    async def mock_get_stats(*args, **kwargs):
        raise Exception("Mocked database failure")
    
    # We monkeypatch the repository method
    from app.repositories.admin_repo import AdminRepository
    monkeypatch.setattr(AdminRepository, "get_stats", mock_get_stats)
    
    res = await client.get("/api/v1/admin/health", headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["database"] == "unhealthy"
    # Even on failure, it should return default zeros instead of crashing with HTTP 500
    assert data["documents"] == 0
    assert data["users"] == 0
    assert data["conversations"] == 0
