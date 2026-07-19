import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class WebhookDeadLetter(Base):
    __tablename__ = "webhook_dead_letters"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    webhook_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    failure_reason: Mapped[str] = mapped_column(String, nullable=False)
    
    last_attempt: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
