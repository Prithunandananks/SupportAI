from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class GapType(str, enum.Enum):
    HIGH_FLAG_RATE = "HIGH_FLAG_RATE"
    LOW_HEALTH_SCORE = "LOW_HEALTH_SCORE"
    REPEATED_FAILURES = "REPEATED_FAILURES"
    MISSING_KNOWLEDGE = "MISSING_KNOWLEDGE"
    OUTDATED_CONTENT = "OUTDATED_CONTENT"

class GapSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class KnowledgeGap(Base):
    __tablename__ = "knowledge_gaps"
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    gap_type: Mapped[GapType] = mapped_column(SQLEnum(GapType), nullable=False, index=True)
    severity: Mapped[GapSeverity] = mapped_column(SQLEnum(GapSeverity), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    document = relationship("Document", backref="knowledge_gaps")
