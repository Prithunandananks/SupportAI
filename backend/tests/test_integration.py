import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_admin_auth_rejection(client: AsyncClient, user_token: str):
    response = await client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_admin_auth_success(client: AsyncClient, admin_token: str):
    response = await client.get("/api/v1/admin/health", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code not in (401, 403)

@pytest.mark.asyncio
async def test_upload_validation_empty_file(client: AsyncClient, admin_token: str):
    files = {"file": ("empty.txt", b"", "text/plain")}
    response = await client.post("/api/v1/documents/upload", headers={"Authorization": f"Bearer {admin_token}"}, files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_upload_validation_oversized(client: AsyncClient, admin_token: str):
    large_content = b"0" * (11 * 1024 * 1024)
    files = {"file": ("large.txt", large_content, "text/plain")}
    response = await client.post("/api/v1/documents/upload", headers={"Authorization": f"Bearer {admin_token}"}, files=files)
    assert response.status_code == 400
    assert "exceeds" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_upload_validation_unsupported_ext(client: AsyncClient, admin_token: str):
    files = {"file": ("test.exe", b"fake exe content", "application/x-msdownload")}
    response = await client.post("/api/v1/documents/upload", headers={"Authorization": f"Bearer {admin_token}"}, files=files)
    assert response.status_code == 400
    assert "unsupported file type" in response.json()["detail"].lower() or "unsupported file extension" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_chat_auth_rejection(client: AsyncClient):
    # No auth -> will hit real auth and return 401
    response = await client.post("/api/v1/chat", json={"message": "hello"})
    assert response.status_code == 401
