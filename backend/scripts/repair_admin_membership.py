import asyncio
import os
import sys

# Ensure backend directory is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import logging

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_membership import TenantMembership, MembershipRole, MembershipStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def repair_admin_membership():
    async with AsyncSessionLocal() as session:
        # Find all users with role "Admin" or "OWNER"
        stmt = select(User).where(User.role.in_(["Admin", "OWNER", "admin", "owner"]))
        result = await session.execute(stmt)
        admins = result.scalars().all()
        
        if not admins:
            logger.info("No admin users found in the database.")
            return

        # Find default organization
        t_stmt = select(Tenant).where(Tenant.name == "Default Organization")
        t_result = await session.execute(t_stmt)
        default_tenant = t_result.scalars().first()
        
        if not default_tenant:
            logger.warning("Default Organization not found. Cannot repair memberships without a tenant.")
            return

        for admin in admins:
            logger.info(f"Checking memberships for admin: {admin.email}")
            
            # Update user's tenant_id if it's missing
            if not admin.tenant_id:
                admin.tenant_id = default_tenant.id
                session.add(admin)
                logger.info(f" - Set tenant_id for {admin.email} to Default Organization")

            # Check if this admin has any membership to the default tenant
            m_stmt = select(TenantMembership).where(
                TenantMembership.user_id == admin.id,
                TenantMembership.tenant_id == default_tenant.id
            )
            m_result = await session.execute(m_stmt)
            membership = m_result.scalars().first()
            
            if not membership:
                logger.info(f" - Creating OWNER TenantMembership for {admin.email}")
                new_membership = TenantMembership(
                    tenant_id=default_tenant.id,
                    user_id=admin.id,
                    role=MembershipRole.OWNER,
                    status=MembershipStatus.ACTIVE,
                    joined_at=datetime.now(timezone.utc)
                )
                session.add(new_membership)
            else:
                logger.info(f" - Membership already exists for {admin.email}")
                
        await session.commit()
        logger.info("Repair complete.")

if __name__ == "__main__":
    asyncio.run(repair_admin_membership())
