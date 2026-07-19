import uuid
from typing import Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base_class import Base
from app.models.tenant_membership import TenantMembership, MembershipStatus
from typing import Any
from app.repositories.base import BaseRepository

class TenantMembershipRepository(BaseRepository[TenantMembership, Any]):
    async def get_by_user_and_tenant(
        self, db: AsyncSession, user_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Optional[TenantMembership]:
        # Temporarily bypass tenant_id_var since this checks membership
        # Actually, if we're finding membership, RLS on tenant_id shouldn't block it if tenant_id_var is set
        stmt = select(TenantMembership).where(
            and_(
                TenantMembership.user_id == user_id,
                TenantMembership.tenant_id == tenant_id
            )
        ).execution_options(ignore_tenant=True)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_active_memberships_for_user(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> list[TenantMembership]:
        stmt = select(TenantMembership).where(
            and_(
                TenantMembership.user_id == user_id,
                TenantMembership.status == MembershipStatus.ACTIVE
            )
        ).execution_options(ignore_tenant=True)
        result = await db.execute(stmt)
        return list(result.scalars().all())

tenant_membership_repo = TenantMembershipRepository(TenantMembership)
