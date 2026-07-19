from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime, timezone, timedelta
import secrets

from app.api import deps
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership, MembershipRole, MembershipStatus
from app.models.invitation import Invitation, InvitationStatus
from app.models.user import User
from app.core.rbac import Permission
from app.models.organization_settings import OrganizationSettings
from app.services.audit_service import audit_service

router = APIRouter()

class OrganizationCreate(BaseModel):
    name: str

class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

class InviteRequest(BaseModel):
    email: EmailStr
    role: MembershipRole

class AcceptInviteRequest(BaseModel):
    token: str

class UpdateRoleRequest(BaseModel):
    role: MembershipRole

class UpdateStatusRequest(BaseModel):
    status: MembershipStatus


async def check_last_owner(db: AsyncSession, tenant_id: uuid.UUID, membership_id: uuid.UUID = None, user_id: uuid.UUID = None):
    # Ensure there is at least one other active owner
    stmt = select(func.count(TenantMembership.id)).where(
        TenantMembership.tenant_id == tenant_id,
        TenantMembership.role == MembershipRole.OWNER,
        TenantMembership.status == MembershipStatus.ACTIVE
    )
    if membership_id:
        stmt = stmt.where(TenantMembership.id != membership_id)
    if user_id:
        stmt = stmt.where(TenantMembership.user_id != user_id)
        
    result = await db.execute(stmt)
    count = result.scalar()
    
    if count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot perform this action: organization must have at least one active owner."
        )


@router.post("", response_model=OrganizationResponse)
async def create_organization(
    payload: OrganizationCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    # Path B: Create Organization
    tenant_slug = f"org-{uuid.uuid4().hex[:8]}"
    new_tenant = Tenant(name=payload.name, slug=tenant_slug)
    db.add(new_tenant)
    await db.flush()
    
    # Create Owner Membership
    membership = TenantMembership(
        tenant_id=new_tenant.id,
        user_id=current_user.id,
        role=MembershipRole.OWNER,
        status=MembershipStatus.ACTIVE,
        joined_at=datetime.now(timezone.utc)
    )
    db.add(membership)
    await db.commit()
    await db.refresh(new_tenant)
    
    return new_tenant


@router.get("/members")
async def get_members(
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    stmt = select(TenantMembership, User).join(User, TenantMembership.user_id == User.id).where(
        TenantMembership.tenant_id == membership.tenant_id
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {
            "id": mem.id,
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": mem.role.value,
            "status": mem.status.value,
            "joined_at": mem.joined_at
        }
        for mem, user in rows
    ]


@router.patch("/members/{member_id}/role")
async def update_member_role(
    member_id: uuid.UUID,
    payload: UpdateRoleRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    stmt = select(TenantMembership).where(
        TenantMembership.id == member_id,
        TenantMembership.tenant_id == current_membership.tenant_id
    )
    result = await db.execute(stmt)
    target_membership = result.scalars().first()
    
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if target_membership.role == MembershipRole.OWNER and payload.role != MembershipRole.OWNER:
        await check_last_owner(db, current_membership.tenant_id, membership_id=target_membership.id)
        
    target_membership.role = payload.role
    await db.commit()
    return {"message": "Role updated successfully"}


@router.patch("/members/{member_id}/status")
async def update_member_status(
    member_id: uuid.UUID,
    payload: UpdateStatusRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    stmt = select(TenantMembership).where(
        TenantMembership.id == member_id,
        TenantMembership.tenant_id == current_membership.tenant_id
    )
    result = await db.execute(stmt)
    target_membership = result.scalars().first()
    
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if target_membership.role == MembershipRole.OWNER and payload.status != MembershipStatus.ACTIVE:
        await check_last_owner(db, current_membership.tenant_id, membership_id=target_membership.id)
        
    target_membership.status = payload.status
    await db.commit()
    return {"message": "Status updated successfully"}


@router.delete("/members/{member_id}")
async def remove_member(
    member_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    stmt = select(TenantMembership).where(
        TenantMembership.id == member_id,
        TenantMembership.tenant_id == current_membership.tenant_id
    )
    result = await db.execute(stmt)
    target_membership = result.scalars().first()
    
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if target_membership.role == MembershipRole.OWNER:
        await check_last_owner(db, current_membership.tenant_id, membership_id=target_membership.id)
        
    await db.delete(target_membership)
    await db.commit()
    return {"message": "Member removed successfully"}


@router.get("/invitations")
async def get_invitations(
    db: AsyncSession = Depends(deps.get_db),
    current_membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    stmt = select(Invitation).where(
        Invitation.tenant_id == current_membership.tenant_id,
        Invitation.status == InvitationStatus.PENDING
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/invite")
async def invite_member(
    payload: InviteRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    # Prevent duplicate active invitations
    stmt = select(Invitation).where(
        Invitation.tenant_id == current_membership.tenant_id,
        Invitation.email == payload.email,
        Invitation.status == InvitationStatus.PENDING
    )
    if (await db.execute(stmt)).scalars().first():
        raise HTTPException(status_code=400, detail="An active invitation already exists for this email.")
        
    # Prevent inviting existing active members
    from app.repositories.user_repo import user_repo
    user = await user_repo.get_by_email(db, email=payload.email)
    if user:
        mem_stmt = select(TenantMembership).where(
            TenantMembership.tenant_id == current_membership.tenant_id,
            TenantMembership.user_id == user.id,
            TenantMembership.status == MembershipStatus.ACTIVE
        )
        if (await db.execute(mem_stmt)).scalars().first():
            raise HTTPException(status_code=400, detail="User is already an active member.")

    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        tenant_id=current_membership.tenant_id,
        email=payload.email,
        role=payload.role.value,
        token=token,
        status=InvitationStatus.PENDING,
        created_by=current_membership.user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(invitation)
    await db.commit()
    return {"message": "Invitation created", "token": token} # Token returned for testing/UI


@router.post("/invite/accept")
async def accept_invitation(
    payload: AcceptInviteRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    # This endpoint doesn't require a current_membership since the user is joining
    stmt = select(Invitation).where(
        Invitation.token == payload.token,
        Invitation.status == InvitationStatus.PENDING
    ).execution_options(ignore_tenant=True)
    result = await db.execute(stmt)
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or no longer valid")
        
    if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        invitation.status = InvitationStatus.EXPIRED
        await db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired")
        
    # Create membership
    membership = TenantMembership(
        tenant_id=invitation.tenant_id,
        user_id=current_user.id,
        role=MembershipRole(invitation.role),
        status=MembershipStatus.ACTIVE,
        joined_at=datetime.now(timezone.utc),
        invited_at=invitation.created_at,
        invited_by=invitation.created_by
    )
    db.add(membership)
    
    current_user.tenant_id = invitation.tenant_id
    
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = datetime.now(timezone.utc)
    
    tenant_id = invitation.tenant_id
    await db.commit()
    return {"message": "Invitation accepted successfully", "tenant_id": str(tenant_id)}


@router.delete("/invitations/{invitation_id}")
async def revoke_invitation(
    invitation_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_membership = Depends(deps.require_permission(Permission.MANAGE_MEMBERS))
) -> Any:
    stmt = select(Invitation).where(
        Invitation.id == invitation_id,
        Invitation.tenant_id == current_membership.tenant_id
    )
    result = await db.execute(stmt)
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    invitation.status = InvitationStatus.REVOKED
    await db.commit()
    return {"message": "Invitation revoked successfully"}

class OrganizationSettingsUpdate(BaseModel):
    organization_name: str | None = None
    logo_url: str | None = None
    timezone: str | None = None
    default_language: str | None = None
    retention_days: int | None = None
    allowed_domains: str | None = None
    email_notifications: bool | None = None
    webhook_enabled: bool | None = None

@router.get("/settings")
async def get_organization_settings(
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(OrganizationSettings).where(OrganizationSettings.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    settings = result.scalars().first()
    
    if not settings:
        # Create default settings if they don't exist
        settings = OrganizationSettings(tenant_id=membership.tenant_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings

@router.patch("/settings")
async def update_organization_settings(
    payload: OrganizationSettingsUpdate,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(OrganizationSettings).where(OrganizationSettings.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    settings = result.scalars().first()
    
    if not settings:
        settings = OrganizationSettings(tenant_id=membership.tenant_id)
        db.add(settings)
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
        
    await db.commit()
    await db.refresh(settings)
    
    await audit_service.create_log(
        db=db,
        action="ORGANIZATION_SETTINGS_UPDATED",
        actor_user_id=membership.user_id,
        resource_type="OrganizationSettings",
        resource_id=str(settings.tenant_id)
    )
    await db.commit()
    
    return settings
