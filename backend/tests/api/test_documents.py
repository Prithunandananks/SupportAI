import pytest
from httpx import AsyncClient




@pytest.mark.asyncio
async def test_upload_document_unauthorized(client: AsyncClient):
    file_content = b"This is a test document."
    response = await client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.txt", file_content, "text/plain")}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_document_authorized(client: AsyncClient, user_token: str):
    file_content = b"This is a test document."
    response = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test.txt", file_content, "text/plain")}
    )
    if response.status_code != 201:
        assert False, f"Expected 201, got {response.status_code}. Response: {response.text}"
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert "Document processing started" in data["message"]
    assert "document_id" in data


@pytest.mark.asyncio
async def test_upload_document_invalid_type(client: AsyncClient, user_token: str):
    file_content = b"This is a fake image."
    response = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {user_token}"},
        files={"file": ("test.jpg", file_content, "image/jpeg")}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_search_documents_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/documents/search?q=test")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_search_documents_authorized(client: AsyncClient, user_token: str):
    response = await client.get(
        "/api/v1/documents/search?q=test_query",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "test_query"
    assert "results" in data
    assert isinstance(data["results"], list)
