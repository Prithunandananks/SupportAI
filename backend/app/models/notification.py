from sqlalchemy.orm import Mapped, mapped_column
import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base_class import Base
import enum

class NotificationStatus(enum.Enum):
    NEW = "NEW"
    READ = "READ"
    ARCHIVED = "ARCHIVED"

class NotificationType(enum.Enum):
    TICKET_CREATED = "TICKET_CREATED"
    TICKET_ASSIGNED = "TICKET_ASSIGNED"
    TICKET_REPLY = "TICKET_REPLY"
    TICKET_UPDATED = "TICKET_UPDATED"
    TICKET_WAITING_CUSTOMER = "TICKET_WAITING_CUSTOMER"
    TICKET_RESOLVED = "TICKET_RESOLVED"
    TICKET_CLOSED = "TICKET_CLOSED"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String(1024), nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType, name="notification_type_enum"), nullable=False
    )
    status: Mapped[NotificationStatus] = mapped_column(
        SQLEnum(NotificationStatus, name="notification_status_enum"), default=NotificationStatus.NEW, nullable=False
    )
    metadata_obj: Mapped[Dict[str, Any] | None] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=True)
    related_ticket_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
