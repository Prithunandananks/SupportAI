import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.core.config import settings
from app.models.user import User
from app.models.tenant import Tenant, TenantStatus
from app.models.tenant_membership import TenantMembership, MembershipRole, MembershipStatus
from app.repositories.user_repo import user_repo
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

async def seed_admin(db: AsyncSession):
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        logger.info("Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not configured.")
        return

    # Ensure Default Organization exists
    stmt = select(Tenant).where(Tenant.name == "Default Organization")
    result = await db.execute(stmt)
    tenant = result.scalars().first()
    
    if not tenant:
        logger.info("Creating Default Organization...")
        tenant = Tenant(
            name="Default Organization",
            slug="default-org",
            status=TenantStatus.ACTIVE
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)

    # Check if admin user exists
    existing_admin = await user_repo.get_by_email(db, email=settings.ADMIN_EMAIL)
    
    if not existing_admin:
        logger.info(f"Seeding default administrator account: {settings.ADMIN_EMAIL}")
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            first_name=settings.ADMIN_FIRST_NAME or "Admin",
            last_name=settings.ADMIN_LAST_NAME or "User",
            role=settings.ADMIN_ROLE,
            tenant_id=tenant.id
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        existing_admin = admin_user
    else:
        # Update existing admin tenant_id if missing
        if not existing_admin.tenant_id:
            existing_admin.tenant_id = tenant.id
            db.add(existing_admin)
            await db.commit()
            logger.info(f"Updated administrator account {settings.ADMIN_EMAIL} with default tenant context.")
            
    # Ensure TenantMembership exists
    mem_stmt = select(TenantMembership).where(
        TenantMembership.user_id == existing_admin.id,
        TenantMembership.tenant_id == tenant.id
    )
    mem_result = await db.execute(mem_stmt)
    membership = mem_result.scalars().first()
    
    if not membership:
        logger.info(f"Creating OWNER TenantMembership for {settings.ADMIN_EMAIL}...")
        membership = TenantMembership(
            tenant_id=tenant.id,
            user_id=existing_admin.id,
            role=MembershipRole.OWNER,
            status=MembershipStatus.ACTIVE,
            joined_at=datetime.now(timezone.utc)
        )
        db.add(membership)
        await db.commit()
        logger.info("Administrator membership seeded successfully.")
    else:
        logger.info("Administrator membership already exists.")

