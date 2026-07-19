from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.db.base_class import Base

class FeedbackEnum(str, enum.Enum):
    LIKE = "LIKE"
    DISLIKE = "DISLIKE"

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'user' or 'assistant'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    feedback: Mapped[FeedbackEnum | None] = mapped_column(SQLEnum(FeedbackEnum), nullable=True)

    tickets = relationship("Ticket", foreign_keys="[Ticket.chat_message_id]", viewonly=True)

    @property
    def flagged(self) -> bool:
        return len(self.tickets) > 0

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    
    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")
    sources: Mapped[list["MessageSource"]] = relationship(
        "MessageSource", back_populates="chat_message", cascade="all, delete-orphan"
    )
