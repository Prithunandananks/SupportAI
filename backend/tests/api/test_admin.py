import pytest
from httpx import AsyncClient

@pytest.fixture
async def admin_token(client: AsyncClient, db_session):
    # Register user
    await client.post("/api/v1/auth/register", json={
        "email": "admin@example.com",
        "password": "Password123!",
        "first_name": "Admin",
        "last_name": "User"
    })
    
    # Promote to Admin
    from app.repositories.user_repo import user_repo
    user = await user_repo.get_by_email(db_session, email="admin@example.com")
    if user:
        user.role = "Admin"
        db_session.add(user)
        await db_session.commit()
    
    # Login
    login_res = await client.post("/api/v1/auth/login", data={
        "username": "admin@example.com",
        "password": "Password123!"
    })
    return login_res.json()["access_token"]


@pytest.mark.asyncio
async def test_get_stats_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/admin/stats")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_stats_authorized(client: AsyncClient, admin_token: str):
    response = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert "total_users" in data
    assert "total_conversations" in data

@pytest.mark.asyncio
async def test_get_analytics(client: AsyncClient, admin_token: str):
    response = await client.get(
        "/api/v1/admin/analytics",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "days" in data
    assert "uploads" in data
    assert "conversations" in data

@pytest.mark.asyncio
async def test_get_documents(client: AsyncClient, admin_token: str):
    response = await client.get(
        "/api/v1/admin/documents?limit=5",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_conversations(client: AsyncClient, admin_token: str):
    response = await client.get(
        "/api/v1/admin/conversations?limit=5",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_health(client: AsyncClient, admin_token: str):
    response = await client.get(
        "/api/v1/admin/health",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["database"] == "healthy"
    assert data["qdrant"] in ["healthy", "unhealthy"]
    assert "documents" in data
    assert "users" in data
    assert "conversations" in data
