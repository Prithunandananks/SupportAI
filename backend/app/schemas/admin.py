from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
from app.schemas.user import UserResponse

class DashboardStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_conversations: int
    total_ai_messages: int
    total_documents: int
    flagged_questions: int
    average_confidence: Optional[float] = None
    positive_feedback: Optional[float] = None
    negative_feedback: Optional[float] = None
    likes: int
    dislikes: int
    total_reports: int
    open_reports: int
    closed_reports: int
    report_rate: Optional[float] = None

class AnalyticsResponse(BaseModel):
    days: List[str]
    uploads: List[int]
    conversations: List[int]

class AdminDocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    user_id: uuid.UUID
    file_size: int
    content_type: str
    created_at: datetime

class AdminConversationResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    message_count: int

class AdminHealthResponse(BaseModel):
    database: str
    qdrant: str
    documents: int
    users: int
    conversations: int

class AdminActivityResponse(BaseModel):
    id: str
    type: str
    description: str
    created_at: datetime
