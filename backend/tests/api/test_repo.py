import pytest
from app.repositories.user_repo import user_repo
from app.schemas.user import UserCreate
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_repo_create(db_session: AsyncSession):
    user_in = UserCreate(
        email="repotest@example.com",
        password="Password123!",
        first_name="Repo",
        last_name="Test"
    )
    user = await user_repo.create(db_session, obj_in=user_in)
    assert user.email == "repotest@example.com"
