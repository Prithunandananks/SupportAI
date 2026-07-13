import uuid
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.password_reset import PasswordResetToken

class PasswordResetRepo(BaseRepository[PasswordResetToken, dict]):
    async def get_valid_token(self, db: AsyncSession, token_hash: str) -> Optional[PasswordResetToken]:
        from datetime import datetime, timezone
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(timezone.utc)
        )
        result = await db.execute(stmt)
        return result.scalars().first()
        
    async def invalidate_all_for_user(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        from datetime import datetime, timezone
        stmt = update(PasswordResetToken).where(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used_at.is_(None)
        ).values(used_at=datetime.now(timezone.utc))
        await db.execute(stmt)
        await db.commit()

password_reset_repo = PasswordResetRepo(PasswordResetToken)
