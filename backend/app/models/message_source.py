from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class MessageSource(Base):
    __tablename__ = "message_sources"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    chat_message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    retrieval_score: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    chat_message = relationship("ChatMessage", back_populates="sources")
    document = relationship("Document", back_populates="message_sources")
