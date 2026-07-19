import uuid
from sqlalchemy import String, Text, Enum as SQLEnum, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
import enum

from app.db.base_class import Base
from app.models.user import User

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TicketCategory(str, enum.Enum):
    REPORT = "REPORT"
    GENERAL = "GENERAL"
    BUG = "BUG"
    FEATURE = "FEATURE"

class TicketHistoryEvent(str, enum.Enum):
    CREATED = "CREATED"
    ASSIGNMENT_CHANGED = "ASSIGNMENT_CHANGED"
    STATUS_CHANGED = "STATUS_CHANGED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    CUSTOMER_CLOSED = "CUSTOMER_CLOSED"
    ADMIN_CLOSED = "ADMIN_CLOSED"

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    status: Mapped[TicketStatus] = mapped_column(SQLEnum(TicketStatus), default=TicketStatus.OPEN, index=True, nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(SQLEnum(TicketPriority), default=TicketPriority.MEDIUM, index=True, nullable=False)
    category: Mapped[TicketCategory] = mapped_column(SQLEnum(TicketCategory), default=TicketCategory.GENERAL, nullable=False)
    
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    assigned_admin_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), index=True, nullable=True)
    chat_message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("chat_messages.id"), index=True, nullable=True)
    report_reason: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    knowledge_sources: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    customer = relationship("User", foreign_keys=[customer_id], backref="tickets_created")
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id], backref="tickets_assigned")
    
    messages: Mapped[list["TicketMessage"]] = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.created_at")
    history: Mapped[list["TicketStatusHistory"]] = relationship("TicketStatusHistory", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketStatusHistory.created_at")

    @property
    def assigned_admin_name(self) -> str | None:
        if self.assigned_admin:
            return f"{self.assigned_admin.first_name or ''} {self.assigned_admin.last_name or ''}".strip()
        return None

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("User")

class TicketStatusHistory(Base):
    __tablename__ = "ticket_status_history"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type: Mapped[TicketHistoryEvent] = mapped_column(SQLEnum(TicketHistoryEvent), nullable=False)
    old_value: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_value: Mapped[str | None] = mapped_column(String(50), nullable=True)
    changed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    ticket = relationship("Ticket", back_populates="history")
    changer = relationship("User")
