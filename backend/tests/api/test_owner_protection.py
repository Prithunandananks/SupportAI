import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership, MembershipRole, MembershipStatus

pytestmark = pytest.mark.asyncio

async def test_last_owner_protection(client: AsyncClient, db_session: AsyncSession, admin_user, admin_token_headers):
    # Setup: ensure admin_user is the ONLY owner of a tenant
    from app.db.session import tenant_id_var
    tenant_id = tenant_id_var.get()
    
    # Verify the owner cannot be removed
    from sqlalchemy import select
    from app.models.tenant_membership import TenantMembership
    mem_stmt = await db_session.execute(
        select(TenantMembership.id).where(TenantMembership.user_id == admin_user.id).execution_options(ignore_tenant=True)
    )
    membership_id = mem_stmt.scalar()
    
    # Attempt to demote
    resp = await client.patch(
        f"/api/v1/organization/members/{membership_id}/role",
        headers=admin_token_headers,
        json={"role": "ADMIN"}
    )
    assert resp.status_code == 400
    assert "must have at least one active owner" in resp.json()["detail"]

    # Attempt to suspend
    resp = await client.patch(
        f"/api/v1/organization/members/{membership_id}/status",
        headers=admin_token_headers,
        json={"status": "SUSPENDED"}
    )
    assert resp.status_code == 400
    
    # Attempt to remove
    resp = await client.delete(
        f"/api/v1/organization/members/{membership_id}",
        headers=admin_token_headers
    )
    assert resp.status_code == 400
