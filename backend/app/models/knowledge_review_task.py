from sqlalchemy.orm import Mapped, mapped_column
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class ReviewTaskStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_REVIEW = "UNDER_REVIEW"
    COMPLETED = "COMPLETED"
    DISMISSED = "DISMISSED"

class KnowledgeReviewTask(Base):
    __tablename__ = "knowledge_review_tasks"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("improvement_recommendations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    assigned_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    status: Mapped[ReviewTaskStatus] = mapped_column(
        SQLEnum(ReviewTaskStatus), index=True, nullable=False, default=ReviewTaskStatus.OPEN
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
