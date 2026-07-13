from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.repositories.base import BaseRepository
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash


class UserRepository(BaseRepository[User, UserCreate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> User | None:
        query = select(User).filter(User.email == email)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_admins(self, db: AsyncSession) -> list[User]:
        query = select(User).filter(User.role == "Admin")
        result = await db.execute(query)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            role="Customer",
            is_active=True,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


user_repo = UserRepository(User)
