import asyncio
import uuid
import contextvars
from sqlalchemy import select, Column, Uuid, String
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

    # Now test with tenant_id_var set to T1
    tenant_id_var.set(t1_id)
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"Users found for T1: {[u.name for u in users]}")

        result = await session.execute(select(Tenant))
        tenants = result.scalars().all()
        print(f"Tenants found for T1: {[t.name for t in tenants]}")

asyncio.run(main())
