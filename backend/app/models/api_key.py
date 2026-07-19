import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    
    key_hash: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    scopes: Mapped[str] = mapped_column(String, nullable=False) # comma separated scopes e.g. "tickets:read,documents:write"
    
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
