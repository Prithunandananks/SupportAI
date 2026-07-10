import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "Password123!",
        "first_name": "New",
        "last_name": "User"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_register_duplicate_user(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "duplicate@example.com",
        "password": "Password123!",
        "first_name": "Dup",
        "last_name": "User"
    })
    response = await client.post("/api/v1/auth/register", json={
        "email": "duplicate@example.com",
        "password": "Password123!",
        "first_name": "Dup",
        "last_name": "User"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this email already exists in the system"

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "password": "Password123!",
        "first_name": "Login",
        "last_name": "User"
    })
    
    response = await client.post("/api/v1/auth/login", data={
        "username": "login@example.com",
        "password": "Password123!"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "invalid@example.com",
        "password": "Password123!",
        "first_name": "Invalid",
        "last_name": "User"
    })
    
    response = await client.post("/api/v1/auth/login", data={
        "username": "invalid@example.com",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
