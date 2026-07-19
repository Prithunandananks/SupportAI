import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class Webhook(Base):
    __tablename__ = "webhooks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    url: Mapped[str] = mapped_column(String, nullable=False)
    secret: Mapped[str] = mapped_column(String, nullable=False)
    
    events: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
