import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.sql import text
from app.db.base import Base

def test_repo_raw():
    async def run_test():
        engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        async with TestingSessionLocal() as session:
            await session.execute(text("INSERT INTO users (id, email, hashed_password, is_active, role, created_at, updated_at, tenant_id) VALUES ('123', 'a@b.c', 'hash', 1, 'customer', '2023-01-01 00:00:00', '2023-01-01 00:00:00', '123e4567-e89b-12d3-a456-426614174000')"))
            await session.commit()
            
            res = await session.execute(text("SELECT email FROM users"))
            assert res.scalar() == "a@b.c"
            
    asyncio.run(run_test())
