import asyncio
import uuid
import contextvars
from sqlalchemy import select, Column, Uuid, String, func
from sqlalchemy.orm import declarative_base, with_loader_criteria, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import event

Base = declarative_base()

class Tenant(Base):
    __tablename__ = 'tenants'
    id = Column(Uuid, primary_key=True)
    name = Column(String)

class User(Base):
    __tablename__ = 'users'
    id = Column(Uuid, primary_key=True)
    tenant_id = Column(Uuid)
    name = Column(String)

tenant_id_var = contextvars.ContextVar('tenant_id', default=None)

engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@event.listens_for(Session, "do_orm_execute")
def _add_tenant_filter(execute_state):
    t_id = tenant_id_var.get()
    if not t_id:
        return
    if execute_state.execution_options.get("ignore_tenant", False):
        return

    execute_state.statement = execute_state.statement.options(
        with_loader_criteria(
            Base,
            lambda cls: cls.tenant_id == t_id if hasattr(cls, "tenant_id") else True,
            include_aliases=True,
            propagate_to_loaders=True,
            track_closure_variables=False
        )
    )

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    t1_id = uuid.uuid4()
    t2_id = uuid.uuid4()
    
    async with AsyncSessionLocal() as session:
        session.add(Tenant(id=t1_id, name="T1"))
        session.add(Tenant(id=t2_id, name="T2"))
        session.add(User(id=uuid.uuid4(), tenant_id=t1_id, name="User1"))
        session.add(User(id=uuid.uuid4(), tenant_id=t2_id, name="User2"))
        await session.commit()

    tenant_id_var.set(t1_id)
    async with AsyncSessionLocal() as session:
        # Test 1: Full entity
        result = await session.execute(select(User))
        print(f"Users found for T1: {len(result.all())}")

        # Test 2: Specific column
        result = await session.execute(select(User.id))
        print(f"User IDs found for T1: {len(result.all())}")

        # Test 3: Aggregation func
        result = await session.execute(select(func.count(User.id)))
        print(f"User count for T1: {result.scalar()}")

asyncio.run(main())
