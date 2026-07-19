import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action: Mapped[str] = mapped_column(String, nullable=False, index=True)
    resource_type: Mapped[str | None] = mapped_column(String, nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    
    old_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
