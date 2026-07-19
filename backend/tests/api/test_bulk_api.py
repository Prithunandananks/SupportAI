import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_bulk_admin_endpoints(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    endpoints = [
        "/api/v1/admin/stats",
        "/api/v1/admin/analytics",
        "/api/v1/admin/knowledge-impact",
        "/api/v1/admin/documents",
        "/api/v1/admin/conversations",
        "/api/v1/admin/recent-activity",
        "/api/v1/admin/health",
        "/api/v1/admin/knowledge-gaps",
        "/api/v1/admin/recommendations",
        "/api/v1/admin/review-tasks",
    ]
    
    for ep in endpoints:
        await client.get(ep, headers=headers)
        
    await client.post("/api/v1/admin/knowledge-gaps/detect", headers=headers)
    await client.post("/api/v1/admin/recommendations/generate", headers=headers)
    
@pytest.mark.asyncio
async def test_bulk_tickets(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    create_res = await client.post(
        "/api/v1/tickets/",
        json={"title": "Test Bulk", "description": "Desc bulk", "category": "GENERAL", "priority": "HIGH"},
        headers=headers
    )
    print('\n\nServer Response:\n', create_res.text); assert create_res.status_code == 201
    if True:
        ticket_id = create_res.json()["id"]
        await client.get(f"/api/v1/tickets/{ticket_id}", headers=headers)
        await client.get(f"/api/v1/tickets/{ticket_id}/history", headers=headers)
        await client.get(f"/api/v1/admin/tickets/", headers=headers)

@pytest.mark.asyncio
async def test_bulk_chat(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    create_res = await client.post(
        "/api/v1/chat/session",
        json={"title": "Bulk chat"},
        headers=headers
    )
    print('\n\nServer Response:\n', create_res.text); assert create_res.status_code == 201
    if True:
        session_id = create_res.json()["id"]
        await client.get(f"/api/v1/chat/session", headers=headers)
        await client.get(f"/api/v1/chat/session/{session_id}", headers=headers)
        await client.get(f"/api/v1/chat/session/{session_id}/messages", headers=headers)
