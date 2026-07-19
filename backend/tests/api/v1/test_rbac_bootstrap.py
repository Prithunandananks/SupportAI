import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership, MembershipRole, MembershipStatus
from app.db.seed import seed_admin
from app.core.config import settings

@pytest.mark.asyncio
async def test_seed_admin_creates_tenant_and_membership(db_session: AsyncSession):
    # Setup test credentials
    original_email = settings.ADMIN_EMAIL
    settings.ADMIN_EMAIL = "bootstrap_test@example.com"
    settings.ADMIN_PASSWORD = "Password123!"
    
    try:
        # Run seed_admin
        await seed_admin(db_session)
        
        # Verify user was created
        result = await db_session.execute(select(User).where(User.email == "bootstrap_test@example.com"))
        user = result.scalars().first()
        assert user is not None
        assert user.role == settings.ADMIN_ROLE
        
        # Verify tenant was created (or exists) and linked
        assert user.tenant_id is not None
        result = await db_session.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = result.scalars().first()
        assert tenant is not None
        assert tenant.name == "Default Organization"
        
        # Verify TenantMembership was created
        result = await db_session.execute(
            select(TenantMembership).where(
                TenantMembership.user_id == user.id,
                TenantMembership.tenant_id == tenant.id
            )
        )
        membership = result.scalars().first()
        assert membership is not None
        assert membership.role == MembershipRole.OWNER
        assert membership.status == MembershipStatus.ACTIVE
        
    finally:
        # Restore settings
        settings.ADMIN_EMAIL = original_email

@pytest.mark.asyncio
async def test_admin_rbac_endpoints_return_200(client: AsyncClient, admin_token_headers: dict, db_session: AsyncSession, admin_user: User):
    # Make sure the admin_user has a tenant membership for the default organization 
    # (since the test suite fixtures might have bypassed seed_admin)
    result = await db_session.execute(select(Tenant).where(Tenant.name == "Default Organization"))
    tenant = result.scalars().first()
    
    if not tenant:
        from app.models.tenant import TenantStatus
        tenant = Tenant(name="Default Organization", slug="default-org-test", status=TenantStatus.ACTIVE)
        db_session.add(tenant)
        await db_session.commit()
        await db_session.refresh(tenant)

    # Check membership
    result = await db_session.execute(
        select(TenantMembership).where(
            TenantMembership.user_id == admin_user.id,
            TenantMembership.tenant_id == tenant.id
        )
    )
    membership = result.scalars().first()
    if not membership:
        membership = TenantMembership(
            tenant_id=tenant.id,
            user_id=admin_user.id,
            role=MembershipRole.OWNER,
            status=MembershipStatus.ACTIVE
        )
        db_session.add(membership)
        
        # update the user's tenant_id so the token gets proper auth
        admin_user.tenant_id = tenant.id
        db_session.add(admin_user)
        await db_session.commit()

    # Re-login to get a fresh token with tenant_id embedded
    login_data = {
        "username": "admin@example.com",
        "password": "Password123!"
    }
    r = await client.post("/api/v1/auth/login", data=login_data)
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test endpoints
    res1 = await client.get("/api/v1/admin/health", headers=headers)
    assert res1.status_code == 200

    res2 = await client.get("/api/v1/admin/knowledge-impact", headers=headers)
    assert res2.status_code == 200

    res3 = await client.get("/api/v1/organization/members", headers=headers)
    assert res3.status_code == 200

