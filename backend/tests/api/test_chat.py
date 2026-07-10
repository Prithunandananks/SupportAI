import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_chat_unauthorized(client: AsyncClient):
    response = await client.post("/api/v1/chat/session", json={"title": "Test Session"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_chat_authorized(client: AsyncClient, user_token: str):
    # 1. Create a session
    response = await client.post(
        "/api/v1/chat/session",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"title": "Test Session"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Session"
    session_id = data["id"]
    
    # 2. Get sessions
    response = await client.get(
        "/api/v1/chat/session",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) > 0
    assert sessions[0]["id"] == session_id
    
    # 3. Send message in session
    response = await client.post(
        f"/api/v1/chat/session/{session_id}/message",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"message": "Hello AI"}
    )
    assert response.status_code == 200
    msg_data = response.json()
    assert "answer" in msg_data
    
    # 4. Rename session
    response = await client.put(
        f"/api/v1/chat/session/{session_id}",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"title": "Renamed Session"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Renamed Session"
    
    # 5. Delete session
    response = await client.delete(
        f"/api/v1/chat/session/{session_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 204
