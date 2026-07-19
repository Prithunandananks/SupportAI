import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant

pytestmark = pytest.mark.asyncio

async def test_invitation_flow(client: AsyncClient, db_session: AsyncSession, admin_user, admin_token_headers):
    # Invite a user
    resp = await client.post(
        "/api/v1/organization/invite",
        headers=admin_token_headers,
        json={"email": "newuser@example.com", "role": "SUPPORT_AGENT"}
    )
    assert resp.status_code == 200
    token = resp.json()["token"]
    
    # Try inviting again
    resp2 = await client.post(
        "/api/v1/organization/invite",
        headers=admin_token_headers,
        json={"email": "newuser@example.com", "role": "SUPPORT_AGENT"}
    )
    assert resp2.status_code == 400
    
    # Accept the invite
    # Register the user first
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "first_name": "New",
            "last_name": "User"
        }
    )
    assert reg_resp.status_code == 201
    
    # Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "newuser@example.com", "password": "Password123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_resp.status_code == 200
    new_user_token = login_resp.json()["access_token"]
    
    # Accept invite
    accept_resp = await client.post(
        "/api/v1/organization/invite/accept",
        headers={"Authorization": f"Bearer {new_user_token}"},
        json={"token": token}
    )
    assert accept_resp.status_code == 200
    
    # Verify in members list
    members_resp = await client.get(
        "/api/v1/organization/members",
        headers=admin_token_headers
    )
    assert members_resp.status_code == 200
    members = members_resp.json()
    assert any(m["email"] == "newuser@example.com" for m in members)
