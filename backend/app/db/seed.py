import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.user import User
from app.repositories.user_repo import user_repo
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

async def seed_admin(db: AsyncSession):
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        logger.info("Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not configured.")
        return

    existing_admin = await user_repo.get_by_email(db, email=settings.ADMIN_EMAIL)
    if existing_admin:
        logger.info(f"Admin seed skipped: User with email {settings.ADMIN_EMAIL} already exists.")
        return

    logger.info(f"Seeding default administrator account: {settings.ADMIN_EMAIL}")
    
    admin_user = User(
        email=settings.ADMIN_EMAIL,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        first_name=settings.ADMIN_FIRST_NAME or "Admin",
        last_name=settings.ADMIN_LAST_NAME or "User",
        role=settings.ADMIN_ROLE,
    )
    
    db.add(admin_user)
    await db.commit()
    logger.info("Administrator account seeded successfully.")
