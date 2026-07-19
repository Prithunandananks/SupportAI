import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_markdown_lifecycle(client: AsyncClient, admin_token: str):
    # 1. Upload Markdown
    file_content = b"# Hello Markdown\n\nThis is a test markdown file."
    upload_res = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("test.md", file_content, "text/markdown")}
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    assert data["filename"] == "test.md"
    doc_id = data["document_id"]

    # 2. Hybrid Search (Retrieval)
    search_res = await client.get(
        "/api/v1/documents/search?q=test",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert isinstance(search_data["results"], list)

    # 3. Replacement (Upload new, delete old)
    new_content = b"# Replaced Markdown\n\nThis is the new content."
    replace_upload_res = await client.post(
        "/api/v1/documents/upload",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"file": ("test_v2.md", new_content, "text/markdown")}
    )
    assert replace_upload_res.status_code == 201
    new_doc_id = replace_upload_res.json()["document_id"]

    # Delete old
    delete_old_res = await client.delete(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert delete_old_res.status_code == 204

    # 4. Deletion of the new one
    delete_new_res = await client.delete(
        f"/api/v1/documents/{new_doc_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert delete_new_res.status_code == 204
