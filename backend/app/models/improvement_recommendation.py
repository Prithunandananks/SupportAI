from sqlalchemy.orm import Mapped, mapped_column
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base


class RecommendationType(str, enum.Enum):
    DOCUMENT_REVIEW = "DOCUMENT_REVIEW"
    CONTENT_EXPANSION = "CONTENT_EXPANSION"
    CONTENT_UPDATE = "CONTENT_UPDATE"
    KNOWLEDGE_GAP = "KNOWLEDGE_GAP"
    RETRIEVAL_OPTIMIZATION = "RETRIEVAL_OPTIMIZATION"
    CHUNK_REVIEW = "CHUNK_REVIEW"

class RecommendationStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DISMISSED = "DISMISSED"

class ImprovementRecommendation(Base):
    __tablename__ = "improvement_recommendations"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    knowledge_gap_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_gaps.id", ondelete="SET NULL"), index=True, nullable=True
    )
    
    recommendation_type: Mapped[RecommendationType] = mapped_column(
        SQLEnum(RecommendationType), index=True, nullable=False
    )
    severity: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    status: Mapped[RecommendationStatus] = mapped_column(
        SQLEnum(RecommendationStatus), default=RecommendationStatus.OPEN, index=True, nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
