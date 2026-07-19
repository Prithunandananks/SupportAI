import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant
from app.models.user import User

pytestmark = pytest.mark.asyncio

async def test_membership_isolation(client: AsyncClient, db_session: AsyncSession, admin_user, admin_token_headers):
    # Admin is part of tenant A.
    # Create tenant B
    import uuid
    tenant_b = Tenant(name="Tenant B", slug=f"tenant-b-{uuid.uuid4().hex[:8]}")
    db_session.add(tenant_b)
    await db_session.commit()
    await db_session.refresh(tenant_b)
    
    # Try to switch to tenant B
    resp = await client.post(
        "/api/v1/auth/switch-tenant",
        headers=admin_token_headers,
        json={"tenant_id": str(tenant_b.id)}
    )
    assert resp.status_code == 403
    assert "not an active member" in resp.json()["detail"].lower()
