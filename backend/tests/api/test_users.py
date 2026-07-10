import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_authorized(client: AsyncClient):
    # Register user
    await client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "password": "Password123!",
        "first_name": "Me",
        "last_name": "User"
    })
    
    # Login
    login_res = await client.post("/api/v1/auth/login", data={
        "username": "me@example.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    
    # Get /me
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["first_name"] == "Me"
    assert data["last_name"] == "User"
    assert "id" in data
