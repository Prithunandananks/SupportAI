from app.core.rbac import Permission
from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.repositories.admin_repo import AdminRepository
from app.schemas.admin import (
    DashboardStatsResponse,
    AnalyticsData,
    AdminDocumentResponse,
    AdminConversationResponse,
    AdminHealthResponse,
    AdminActivityResponse,
    KnowledgeImpactAnalytics,
    KnowledgeGapResponse,
    ImprovementRecommendationResponse,
    RecommendationStatusUpdate,
    KnowledgeReviewTaskResponse,
    KnowledgeReviewTaskCreate,
    KnowledgeReviewTaskUpdate,
)
from app.db.qdrant import qdrant_db

router = APIRouter()

def get_admin_repo(session: AsyncSession = Depends(deps.get_db)) -> AdminRepository:
    return AdminRepository(session=session)

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    """Get high level counts for dashboard cards"""
    stats = await repo.get_stats()
    return stats

@router.get("/analytics", response_model=AnalyticsData)
async def get_analytics(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    """Get charting data"""
    return await repo.get_analytics()

@router.get("/knowledge-impact", response_model=KnowledgeImpactAnalytics)
async def get_knowledge_impact(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    """Get knowledge impact analytics"""
    return await repo.get_knowledge_impact_analytics()

@router.get("/documents", response_model=List[AdminDocumentResponse])
async def get_recent_documents(
    limit: int = 10,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    return await repo.get_recent_documents(limit=limit)

@router.get("/conversations", response_model=List[AdminConversationResponse])
async def get_recent_conversations(
    limit: int = 10,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    return await repo.get_recent_conversations(limit=limit)

@router.get("/recent-activity", response_model=List[AdminActivityResponse])
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    return await repo.get_recent_activity(limit=limit)

@router.get("/health", response_model=AdminHealthResponse)
async def get_health(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        stats = await repo.get_stats()
        database_status = "healthy"
    except Exception as e:
        logger.exception("Failed to get database stats for health check")
        stats = {
            "total_documents": 0,
            "total_users": 0,
            "total_conversations": 0
        }
        database_status = "unhealthy"

    qdrant_status = "healthy"
    try:
        await qdrant_db.client.get_collections()
    except Exception:
        logger.exception("Failed to connect to qdrant for health check")
        qdrant_status = "unhealthy"

    return AdminHealthResponse(
        database=database_status,
        qdrant=qdrant_status,
        documents=stats["total_documents"],
        users=stats["total_users"],
        conversations=stats["total_conversations"],
    )

@router.post("/knowledge-gaps/detect", response_model=List[KnowledgeGapResponse])
async def detect_knowledge_gaps(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from app.services.knowledge_gap_service import knowledge_gap_service
    from app.models.document import Document
    # This will generate new gaps based on current analytics and save them to DB
    new_gaps = await knowledge_gap_service.detect_gaps(session)
    
    out = []
    for gap in new_gaps:
        doc = await session.get(Document, gap.document_id)
        out.append({
            "id": gap.id,
            "document_id": gap.document_id,
            "filename": doc.filename if doc else "Unknown",
            "gap_type": gap.gap_type.value,
            "severity": gap.severity.value,
            "description": gap.description,
            "created_at": gap.created_at,
            "resolved_at": gap.resolved_at
        })
    return out

@router.get("/knowledge-gaps", response_model=List[KnowledgeGapResponse])
async def get_knowledge_gaps(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from sqlalchemy import select, desc
    from app.models.knowledge_gap import KnowledgeGap
    from app.models.document import Document
    
    stmt = (
        select(KnowledgeGap, Document.filename)
        .join(Document, KnowledgeGap.document_id == Document.id)
        .order_by(desc(KnowledgeGap.created_at))
    )
    result = await session.execute(stmt)
    
    return [
        {
            "id": gap.id,
            "document_id": gap.document_id,
            "filename": filename,
            "gap_type": gap.gap_type.value,
            "severity": gap.severity.value,
            "description": gap.description,
            "created_at": gap.created_at,
            "resolved_at": gap.resolved_at
        }
        for gap, filename in result.all()
    ]


@router.post("/recommendations/generate", response_model=List[ImprovementRecommendationResponse])
async def generate_recommendations(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from app.services.recommendation_service import recommendation_service
    from app.models.document import Document
    new_recs = await recommendation_service.generate_recommendations(session)
    
    out = []
    for rec in new_recs:
        doc = await session.get(Document, rec.document_id)
        out.append({
            "id": rec.id,
            "document_id": rec.document_id,
            "filename": doc.filename if doc else "Unknown",
            "knowledge_gap_id": rec.knowledge_gap_id,
            "recommendation_type": rec.recommendation_type.value,
            "severity": rec.severity,
            "title": rec.title,
            "description": rec.description,
            "status": rec.status.value,
            "created_at": rec.created_at,
            "resolved_at": rec.resolved_at
        })
    return out

@router.get("/recommendations", response_model=List[ImprovementRecommendationResponse])
async def get_recommendations(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from sqlalchemy import select, desc
    from app.models.improvement_recommendation import ImprovementRecommendation
    from app.models.document import Document
    
    stmt = (
        select(ImprovementRecommendation, Document.filename)
        .join(Document, ImprovementRecommendation.document_id == Document.id)
        .order_by(desc(ImprovementRecommendation.created_at))
    )
    result = await session.execute(stmt)
    
    return [
        {
            "id": rec.id,
            "document_id": rec.document_id,
            "filename": filename,
            "knowledge_gap_id": rec.knowledge_gap_id,
            "recommendation_type": rec.recommendation_type.value,
            "severity": rec.severity,
            "title": rec.title,
            "description": rec.description,
            "status": rec.status.value,
            "created_at": rec.created_at,
            "resolved_at": rec.resolved_at
        }
        for rec, filename in result.all()
    ]

@router.patch("/recommendations/{id}/status", response_model=ImprovementRecommendationResponse)
async def update_recommendation_status(
    id: str,
    update_data: RecommendationStatusUpdate,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from fastapi import HTTPException
    from app.models.improvement_recommendation import ImprovementRecommendation, RecommendationStatus
    from app.models.document import Document
    from datetime import datetime, timezone
    
    rec = await session.get(ImprovementRecommendation, id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    try:
        new_status = RecommendationStatus(update_data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    rec.status = new_status
    if new_status in [RecommendationStatus.COMPLETED, RecommendationStatus.DISMISSED]:
        rec.resolved_at = datetime.now(timezone.utc)
    else:
        rec.resolved_at = None
        
    session.add(rec)
    await session.commit()
    await session.refresh(rec)
    
    doc = await session.get(Document, rec.document_id)
    return {
        "id": rec.id,
        "document_id": rec.document_id,
        "filename": doc.filename if doc else "Unknown",
        "knowledge_gap_id": rec.knowledge_gap_id,
        "recommendation_type": rec.recommendation_type.value,
        "severity": rec.severity,
        "title": rec.title,
        "description": rec.description,
        "status": rec.status.value,
        "created_at": rec.created_at,
        "resolved_at": rec.resolved_at
    }


@router.post("/review-tasks", response_model=KnowledgeReviewTaskResponse)
async def create_review_task(
    data: KnowledgeReviewTaskCreate,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from app.services.knowledge_review_service import knowledge_review_service
    from app.models.document import Document
    from app.models.improvement_recommendation import ImprovementRecommendation
    
    task = await knowledge_review_service.create_task(
        db=session,
        recommendation_id=data.recommendation_id,
        document_id=data.document_id,
        assigned_admin_id=data.assigned_admin_id,
        notes=data.notes
    )
    
    doc = await session.get(Document, task.document_id)
    rec = await session.get(ImprovementRecommendation, task.recommendation_id)
    admin_user = None
    if task.assigned_admin_id:
        admin_user = await session.get(User, task.assigned_admin_id)
        
    return {
        "id": task.id,
        "recommendation_id": task.recommendation_id,
        "document_id": task.document_id,
        "filename": doc.filename if doc else "Unknown",
        "assigned_admin_id": task.assigned_admin_id,
        "assigned_admin_name": f"{admin_user.first_name} {admin_user.last_name}" if admin_user else None,
        "status": task.status.value,
        "notes": task.notes,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at,
        "recommendation_title": rec.title if rec else None
    }

@router.get("/review-tasks", response_model=List[KnowledgeReviewTaskResponse])
async def get_review_tasks(
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from sqlalchemy import select, desc
    from app.models.knowledge_review_task import KnowledgeReviewTask
    from app.models.document import Document
    from app.models.improvement_recommendation import ImprovementRecommendation
    
    stmt = (
        select(KnowledgeReviewTask, Document.filename, User.first_name, User.last_name, ImprovementRecommendation.title)
        .join(Document, KnowledgeReviewTask.document_id == Document.id)
        .join(ImprovementRecommendation, KnowledgeReviewTask.recommendation_id == ImprovementRecommendation.id)
        .outerjoin(User, KnowledgeReviewTask.assigned_admin_id == User.id)
        .order_by(desc(KnowledgeReviewTask.created_at))
    )
    result = await session.execute(stmt)
    
    out = []
    for task, filename, fname, lname, rec_title in result.all():
        out.append({
            "id": task.id,
            "recommendation_id": task.recommendation_id,
            "document_id": task.document_id,
            "filename": filename,
            "assigned_admin_id": task.assigned_admin_id,
            "assigned_admin_name": f"{fname} {lname}" if fname else None,
            "status": task.status.value,
            "notes": task.notes,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "completed_at": task.completed_at,
            "recommendation_title": rec_title
        })
    return out

@router.patch("/review-tasks/{id}", response_model=KnowledgeReviewTaskResponse)
async def update_review_task(
    id: str,
    update_data: KnowledgeReviewTaskUpdate,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from fastapi import HTTPException
    from app.services.knowledge_review_service import knowledge_review_service
    from app.models.knowledge_review_task import ReviewTaskStatus
    from app.models.document import Document
    from app.models.improvement_recommendation import ImprovementRecommendation
    
    task = await knowledge_review_service.get_task(session, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if update_data.status:
        try:
            status_enum = ReviewTaskStatus(update_data.status)
            task = await knowledge_review_service.update_task_status(session, id, status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
            
    if update_data.assigned_admin_id is not None:
        # Check if they are passing a valid UUID or empty string (which we treat as None for unassignment, but schema needs Optional[UUID])
        task = await knowledge_review_service.assign_task(session, id, update_data.assigned_admin_id)
        
    if update_data.notes is not None:
        task.notes = update_data.notes
        session.add(task)
        await session.commit()
        await session.refresh(task)
        
    doc = await session.get(Document, task.document_id)
    rec = await session.get(ImprovementRecommendation, task.recommendation_id)
    admin_user = None
    if task.assigned_admin_id:
        admin_user = await session.get(User, task.assigned_admin_id)
        
    return {
        "id": task.id,
        "recommendation_id": task.recommendation_id,
        "document_id": task.document_id,
        "filename": doc.filename if doc else "Unknown",
        "assigned_admin_id": task.assigned_admin_id,
        "assigned_admin_name": f"{admin_user.first_name} {admin_user.last_name}" if admin_user else None,
        "status": task.status.value,
        "notes": task.notes,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at,
        "recommendation_title": rec.title if rec else None
    }

@router.get("/review-tasks/{id}", response_model=KnowledgeReviewTaskResponse)
async def get_review_task(
    id: str,
    current_user: User = Depends(deps.require_permission(Permission.VIEW_ANALYTICS)),
    session: AsyncSession = Depends(deps.get_db),
) -> Any:
    from fastapi import HTTPException
    from app.services.knowledge_review_service import knowledge_review_service
    from app.models.document import Document
    from app.models.improvement_recommendation import ImprovementRecommendation
    
    task = await knowledge_review_service.get_task(session, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    doc = await session.get(Document, task.document_id)
    rec = await session.get(ImprovementRecommendation, task.recommendation_id)
    admin_user = None
    if task.assigned_admin_id:
        admin_user = await session.get(User, task.assigned_admin_id)
        
    return {
        "id": task.id,
        "recommendation_id": task.recommendation_id,
        "document_id": task.document_id,
        "filename": doc.filename if doc else "Unknown",
        "assigned_admin_id": task.assigned_admin_id,
        "assigned_admin_name": f"{admin_user.first_name} {admin_user.last_name}" if admin_user else None,
        "status": task.status.value,
        "notes": task.notes,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at,
        "recommendation_title": rec.title if rec else None
    }
