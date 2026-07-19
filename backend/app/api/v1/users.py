from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.schemas.user import UserResponse
from app.models.user import User
from app.repositories.user_repo import user_repo

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(deps.get_current_active_user)) -> Any:
    return current_user

@router.get("/admins", response_model=List[UserResponse])
async def list_admins(
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
) -> Any:
    """List all users with the Admin role."""
    return await user_repo.get_admins(db)

@router.get("/me/organizations")
async def get_my_organizations(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    from app.repositories.tenant_membership_repo import tenant_membership_repo
    from sqlalchemy.orm import selectinload
    
    # We want to return the tenants. Let's just fetch memberships and include tenant data.
    memberships = await tenant_membership_repo.get_active_memberships_for_user(db, current_user.id)
    
    # We don't have a joinedload in get_active_memberships_for_user, so let's do a manual query
    from sqlalchemy import select
    from app.models.tenant_membership import TenantMembership, MembershipStatus
    from app.models.tenant import Tenant
    
    stmt = select(TenantMembership, Tenant).join(Tenant, TenantMembership.tenant_id == Tenant.id).where(
        TenantMembership.user_id == current_user.id,
        TenantMembership.status == MembershipStatus.ACTIVE
    ).execution_options(ignore_tenant=True)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "tenant_slug": tenant.slug,
            "role": membership.role.value,
            "joined_at": membership.joined_at
        }
        for membership, tenant in rows
    ]
