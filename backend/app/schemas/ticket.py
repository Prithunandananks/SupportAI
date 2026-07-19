from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import Optional, List
import uuid
from datetime import datetime, timezone, timedelta
from app.models.ticket import TicketStatus, TicketPriority, TicketCategory

class TicketMessageBase(BaseModel):
    message: str

class TicketMessageCreate(TicketMessageBase):
    pass

class TicketMessageResponse(TicketMessageBase):
    id: uuid.UUID
    ticket_id: uuid.UUID
    sender_id: uuid.UUID
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TicketNoteBase(BaseModel):
    content: str

class TicketNoteCreate(TicketNoteBase):
    pass

class TicketNoteResponse(TicketNoteBase):
    id: uuid.UUID
    ticket_id: uuid.UUID
    author_id: uuid.UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TicketBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    category: TicketCategory
    priority: Optional[TicketPriority] = TicketPriority.MEDIUM

class TicketCreate(TicketBase):
    conversation_id: Optional[uuid.UUID] = None
    chat_message_id: Optional[uuid.UUID] = None
    report_reason: Optional[str] = None
    customer_comment: Optional[str] = None

class TicketUpdateStatus(BaseModel):
    status: TicketStatus

class TicketAssignAdmin(BaseModel):
    assignee_id: Optional[uuid.UUID] = None
    assigned_admin_id: Optional[uuid.UUID] = None

class TicketStatusHistoryResponse(BaseModel):
    id: uuid.UUID
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    event_type: str
    changed_by: uuid.UUID
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TicketResponse(TicketBase):
    id: uuid.UUID
    ticket_number: str
    status: TicketStatus
    priority: TicketPriority
    customer_id: uuid.UUID
    assigned_admin_id: Optional[uuid.UUID] = None
    conversation_id: Optional[uuid.UUID] = None
    chat_message_id: Optional[uuid.UUID] = None
    report_reason: Optional[str] = None
    customer_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TicketDetailResponse(TicketResponse):
    messages: List[TicketMessageResponse] = []
    history: List[TicketStatusHistoryResponse] = []
    
class AdminTicketResponse(TicketResponse):
    first_response_due: Optional[datetime] = None
    resolution_due: Optional[datetime] = None
    first_response_at: Optional[datetime] = None

    def _ensure_aware(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    @computed_field
    def is_breached(self) -> bool:
        now = datetime.now(timezone.utc)
        if self.first_response_due and not self.first_response_at and now > self._ensure_aware(self.first_response_due):
            return True
        if self.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            if self.resolution_due and self.closed_at and self._ensure_aware(self.closed_at) > self._ensure_aware(self.resolution_due):
                return True
        else:
            if self.resolution_due and now > self._ensure_aware(self.resolution_due):
                return True
        return False

    @computed_field
    def is_overdue(self) -> bool:
        if self.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            return False
        now = datetime.now(timezone.utc)
        if self.first_response_due and not self.first_response_at and now > self._ensure_aware(self.first_response_due):
            return True
        if self.resolution_due and now > self._ensure_aware(self.resolution_due):
            return True
        return False

    @computed_field
    def is_due_soon(self) -> bool:
        if self.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            return False
        if self.is_overdue:
            return False
            
        from app.core.sla_config import DUE_SOON_THRESHOLD_HOURS
        now = datetime.now(timezone.utc)
        threshold = timedelta(hours=DUE_SOON_THRESHOLD_HOURS)
        
        if self.first_response_due and not self.first_response_at and (self._ensure_aware(self.first_response_due) - now) <= threshold:
            return True
        if self.resolution_due and (self._ensure_aware(self.resolution_due) - now) <= threshold:
            return True
        return False

class AdminTicketDetailResponse(AdminTicketResponse):
    internal_notes: List[TicketNoteResponse] = []
    messages: List[TicketMessageResponse] = []
    history: List[TicketStatusHistoryResponse] = []
