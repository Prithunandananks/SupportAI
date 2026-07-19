import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    webhook_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, index=True) # e.g. PENDING, SUCCESS, FAILED
    
    request_body: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    response_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_body: Mapped[str | None] = mapped_column(String, nullable=True)
    
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
