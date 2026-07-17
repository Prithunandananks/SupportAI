from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class ReportReasonStat(BaseModel):
    reason: str
    count: int

class StatusStat(BaseModel):
    status: str
    count: int

class RecentFlaggedResponse(BaseModel):
    ticket_id: uuid.UUID
    ticket_number: str
    title: str
    reason: Optional[str] = None
    created_at: datetime
    status: str

class ReportedQuestionStat(BaseModel):
    message_id: uuid.UUID
    customer_question: str
    ai_response: str
    report_count: int

class QualityAnalyticsResponse(BaseModel):
    total_flagged: int
    open_tickets: int
    resolved_tickets: int
    average_resolution_time_hours: Optional[float]
    report_reasons: List[ReportReasonStat]
    status_distribution: List[StatusStat]
    recent_flags: List[RecentFlaggedResponse]
    most_reported_questions: List[ReportedQuestionStat]
