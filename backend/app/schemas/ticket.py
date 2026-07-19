from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import uuid
from datetime import datetime
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

class TicketBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    category: TicketCategory

class TicketCreate(TicketBase):
    conversation_id: Optional[uuid.UUID] = None
    chat_message_id: Optional[uuid.UUID] = None
    report_reason: Optional[str] = None
    customer_comment: Optional[str] = None

class TicketUpdateStatus(BaseModel):
    status: TicketStatus

class TicketAssignAdmin(BaseModel):
    assigned_admin_id: uuid.UUID

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
    knowledge_sources: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TicketDetailResponse(TicketResponse):
    messages: List[TicketMessageResponse] = []
    history: List[TicketStatusHistoryResponse] = []
    
class AdminTicketDetailResponse(TicketDetailResponse):
    assigned_admin_name: Optional[str] = None
