import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.db.base_class import Base

class TenantStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    TRIAL = "TRIAL"
    ARCHIVED = "ARCHIVED"

class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    status: Mapped[TenantStatus] = mapped_column(SQLEnum(TenantStatus), default=TenantStatus.ACTIVE)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
