import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class OrganizationSettings(Base):
    __tablename__ = "organization_settings"

    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True)
    
    organization_name: Mapped[str | None] = mapped_column(String, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    timezone: Mapped[str] = mapped_column(String, nullable=False, default="UTC")
    default_language: Mapped[str] = mapped_column(String, nullable=False, default="en")
    
    retention_days: Mapped[int] = mapped_column(Integer, nullable=False, default=365)
    allowed_domains: Mapped[str | None] = mapped_column(String, nullable=True) # comma separated domains
    email_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    webhook_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
