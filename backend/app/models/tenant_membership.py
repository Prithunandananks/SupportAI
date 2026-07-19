import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class MembershipRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    SUPPORT_AGENT = "SUPPORT_AGENT"
    KNOWLEDGE_MANAGER = "KNOWLEDGE_MANAGER"
    VIEWER = "VIEWER"

class MembershipStatus(str, enum.Enum):
    INVITED = "INVITED"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"

class TenantMembership(Base):
    __tablename__ = "tenant_memberships"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    role: Mapped[MembershipRole] = mapped_column(SQLEnum(MembershipRole), nullable=False)
    status: Mapped[MembershipStatus] = mapped_column(SQLEnum(MembershipStatus), nullable=False, default=MembershipStatus.ACTIVE)
    
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    invited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    invited_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
