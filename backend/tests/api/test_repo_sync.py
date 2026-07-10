import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.base import Base
from app.repositories.user_repo import user_repo
from app.schemas.user import UserCreate

def test_repo_sync_wrapper():
    async def run_test():
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        async with TestingSessionLocal() as session:
            user_in = UserCreate(
                email="syncwrapper@example.com",
                password="Password123!",
                first_name="Sync",
                last_name="Wrapper"
            )
            user = await user_repo.create(session, obj_in=user_in)
            assert user.email == "syncwrapper@example.com"
            
    asyncio.run(run_test())
