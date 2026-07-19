from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

# Force asyncpg if postgresql is provided
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine_kwargs = {
    "echo": False,
    "future": True,
}

if not db_url.startswith("sqlite"):
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = settings.DATABASE_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DATABASE_MAX_OVERFLOW

engine = create_async_engine(db_url, **engine_kwargs)

import contextvars
from sqlalchemy import event, bindparam
from sqlalchemy.orm import Session, with_loader_criteria
from app.db.base import Base

tenant_id_var = contextvars.ContextVar('tenant_id', default=None)

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
            lambda cls: cls.tenant_id == bindparam("tenant_id", callable_=lambda: tenant_id_var.get()) if hasattr(cls, "tenant_id") else True,
            include_aliases=True,
            propagate_to_loaders=True
        )
    )

@event.listens_for(Session, "before_flush")
def _receive_before_flush(session, flush_context, instances):
    t_id = tenant_id_var.get()
    if not t_id:
        return
    for obj in session.new:
        if hasattr(obj, "tenant_id") and getattr(obj, "tenant_id") is None:
            obj.tenant_id = t_id

AsyncSessionLocal = async_sessionmaker(
    bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
)
