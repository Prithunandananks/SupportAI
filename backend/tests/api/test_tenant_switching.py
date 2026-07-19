import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant

pytestmark = pytest.mark.asyncio

async def test_tenant_switching(client: AsyncClient, db_session: AsyncSession, admin_user, admin_token_headers):
    # Get current organizations
    resp = await client.get(
        "/api/v1/users/me/organizations",
        headers=admin_token_headers
    )
    assert resp.status_code == 200
    orgs = resp.json()
    assert len(orgs) >= 1
    
    tenant_id = orgs[0]["tenant_id"]
    
    # Switch tenant
    switch_resp = await client.post(
        "/api/v1/auth/switch-tenant",
        headers=admin_token_headers,
        json={"tenant_id": tenant_id}
    )
    assert switch_resp.status_code == 200
    assert "access_token" in switch_resp.json()
