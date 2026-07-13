import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ticket import TicketStatus, TicketPriority

pytestmark = pytest.mark.asyncio

async def test_create_ticket(client: AsyncClient, user_token: str):
    headers = {"Authorization": f"Bearer {user_token}"}
    response = await client.post(
        "/api/v1/tickets/",
        json={
            "title": "Need help with login",
            "description": "I need help resetting my password.",
            "priority": "LOW",
            "category": "GENERAL"
        },
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Need help with login"
    assert "SUP-" in data["ticket_number"]
    assert data["status"] == TicketStatus.OPEN.value
    
async def test_list_customer_tickets(client: AsyncClient, user_token: str):
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create ticket
    await client.post(
        "/api/v1/tickets/",
        json={"title": "Test 1", "description": "Desc 1", "category": "GENERAL"},
        headers=headers
    )
    
    response = await client.get("/api/v1/tickets/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Test 1"

async def test_reply_to_ticket(client: AsyncClient, user_token: str):
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # Create ticket
    create_res = await client.post(
        "/api/v1/tickets/",
        json={"title": "Test Reply", "description": "Desc", "category": "GENERAL"},
        headers=headers
    )
    ticket_id = create_res.json()["id"]
    
    # Reply
    reply_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/messages",
        json={"message": "This is a reply"},
        headers=headers
    )
    assert reply_res.status_code == 200
    assert reply_res.json()["message"] == "This is a reply"
    
    # Get details
    detail_res = await client.get(f"/api/v1/tickets/{ticket_id}", headers=headers)
    assert detail_res.status_code == 200
    assert len(detail_res.json()["messages"]) == 1
    assert detail_res.json()["messages"][0]["message"] == "This is a reply"

# I would add more tests here for admin endpoints and status transitions
