import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User
from app.api.deps import get_current_active_user
import uuid

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

def override_admin():
    return User(id=uuid.uuid4(), email="admin@test.com", role="Admin", is_active=True)

def override_customer():
    return User(id=uuid.uuid4(), email="customer@test.com", role="Customer", is_active=True)

@pytest.mark.asyncio
async def test_admin_auth_rejection(async_client):
    app.dependency_overrides[get_current_active_user] = override_customer
    try:
        response = await async_client.get("/api/v1/admin/stats")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_admin_auth_success(async_client):
    app.dependency_overrides[get_current_active_user] = override_admin
    try:
        response = await async_client.get("/api/v1/admin/health")
        assert response.status_code not in (401, 403)
    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_upload_validation_empty_file(async_client):
    app.dependency_overrides[get_current_active_user] = override_admin
    try:
        files = {"file": ("empty.txt", b"", "text/plain")}
        response = await async_client.post("/api/v1/documents/upload", files=files)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_upload_validation_oversized(async_client):
    app.dependency_overrides[get_current_active_user] = override_admin
    try:
        large_content = b"0" * (11 * 1024 * 1024)
        files = {"file": ("large.txt", large_content, "text/plain")}
        response = await async_client.post("/api/v1/documents/upload", files=files)
        assert response.status_code == 400
        assert "exceeds" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_upload_validation_unsupported_ext(async_client):
    app.dependency_overrides[get_current_active_user] = override_admin
    try:
        files = {"file": ("test.exe", b"fake exe content", "application/x-msdownload")}
        response = await async_client.post("/api/v1/documents/upload", files=files)
        assert response.status_code == 400
        assert "unsupported file type" in response.json()["detail"].lower() or "unsupported file extension" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_chat_auth_rejection(async_client):
    # No override -> will hit real auth and return 401
    response = await async_client.post("/api/v1/chat", json={"message": "hello"})
    assert response.status_code == 401
