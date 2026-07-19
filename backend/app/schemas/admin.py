from typing import List, Optional, Dict, Any
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
    assigned_tickets: int = 0
    unassigned_tickets: int = 0
    average_agent_load: Optional[float] = 0.0
    tickets_with_notes: int = 0
    total_internal_notes: int = 0
    average_notes_per_ticket: Optional[float] = 0.0
    sla_compliance_rate: Optional[float] = 100.0
    sla_breached_tickets: int = 0
    average_first_response_time: Optional[float] = 0.0
    average_resolution_time: Optional[float] = None
    overdue_tickets: int = 0
    auto_assigned_tickets: int = 0
    manual_assignments: int = 0

class AgentSLA(BaseModel):
    agent_name: str
    compliance_rate: float
    resolved_tickets: int

class AgentDistribution(BaseModel):
    name: str
    value: int
    
class AgentOpenTickets(BaseModel):
    name: str
    open_tickets: int

class AnalyticsData(BaseModel):
    days: List[str]
    uploads: List[int]
    conversations: List[int]
    sla_compliance_trend: List[float]
    resolution_time_trend: List[float]
    priority_resolution_time: Dict[str, float]
    agent_sla_performance: List[AgentSLA]
    assignment_distribution: List[AgentDistribution] = []
    open_tickets_per_agent: List[AgentOpenTickets] = []
    auto_assignment_success_rate: float = 0.0

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

class TopDocument(BaseModel):
    document_id: str
    filename: str
    count: int

class ProblematicChunk(BaseModel):
    chunk_index: int
    document_id: str
    filename: str
    flag_count: int

class DocumentHealth(BaseModel):
    document_id: str
    filename: str
    total_references: int
    flagged_responses: int
    health_score: float

class KnowledgeGapResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    filename: str
    gap_type: str
    severity: str
    description: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

class ImprovementRecommendationResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    filename: str
    knowledge_gap_id: Optional[uuid.UUID] = None
    recommendation_type: str
    severity: str
    title: str
    description: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

class RecommendationStatusUpdate(BaseModel):
    status: str

class GapTrend(BaseModel):
    date: str
    count: int

class AffectedDocument(BaseModel):
    document_id: str
    filename: str
    gap_count: int

class KnowledgeImpactAnalytics(BaseModel):
    top_flagged_documents: List[TopDocument]
    top_referenced_documents: List[TopDocument]
    top_problematic_chunks: List[ProblematicChunk]
    document_health_ranking: List[DocumentHealth]
    
    total_open_gaps: int = 0
    critical_gaps: int = 0
    gap_resolution_rate: float = 0.0
    gap_trend: List[GapTrend] = []
    most_affected_documents: List[AffectedDocument] = []
    recent_gaps: List[KnowledgeGapResponse] = []
    
    open_recommendations: int = 0
    critical_recommendations: int = 0
    completed_recommendations: int = 0
    recommendation_resolution_rate: float = 0.0
    most_recommended_documents: List[AffectedDocument] = []
    recent_recommendations: List[ImprovementRecommendationResponse] = []
    
    open_review_tasks: int = 0
    completed_reviews: int = 0
    review_completion_rate: float = 0.0
    average_review_time: Optional[float] = None
    reviewer_workload: List[Dict[str, Any]] = []

class KnowledgeReviewTaskResponse(BaseModel):
    id: uuid.UUID
    recommendation_id: uuid.UUID
    document_id: uuid.UUID
    filename: str
    assigned_admin_id: Optional[uuid.UUID] = None
    assigned_admin_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    recommendation_title: Optional[str] = None

class KnowledgeReviewTaskCreate(BaseModel):
    recommendation_id: uuid.UUID
    document_id: uuid.UUID
    assigned_admin_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None

class KnowledgeReviewTaskUpdate(BaseModel):
    assigned_admin_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    notes: Optional[str] = None
