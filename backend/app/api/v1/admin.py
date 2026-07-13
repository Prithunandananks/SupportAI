from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.repositories.admin_repo import AdminRepository
from app.schemas.admin import (
    DashboardStatsResponse,
    AnalyticsResponse,
    AdminDocumentResponse,
    AdminConversationResponse,
    AdminHealthResponse,
    AdminActivityResponse,
)
from app.db.qdrant import qdrant_db

router = APIRouter()

def get_admin_repo(session: AsyncSession = Depends(deps.get_db)) -> AdminRepository:
    return AdminRepository(session=session)

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(deps.require_role("Admin")),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    """Get high level counts for dashboard cards"""
    stats = await repo.get_stats()
    return stats

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(deps.require_role("Admin")),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    """Get charting data"""
    return await repo.get_analytics()

@router.get("/documents", response_model=List[AdminDocumentResponse])
async def get_recent_documents(
    limit: int = 10,
    current_user: User = Depends(deps.require_role("Admin")),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    return await repo.get_recent_documents(limit=limit)

@router.get("/conversations", response_model=List[AdminConversationResponse])
async def get_recent_conversations(
    limit: int = 10,
    current_user: User = Depends(deps.require_role("Admin")),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    return await repo.get_recent_conversations(limit=limit)

@router.get("/recent-activity", response_model=List[AdminActivityResponse])
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(deps.require_role("Admin")),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    return await repo.get_recent_activity(limit=limit)

@router.get("/health", response_model=AdminHealthResponse)
async def get_health(
    current_user: User = Depends(deps.require_role("Admin")),
    repo: AdminRepository = Depends(get_admin_repo),
) -> Any:
    stats = await repo.get_stats()
    qdrant_status = "healthy"
    try:
        await qdrant_db.client.get_collections()
    except Exception:
        qdrant_status = "unhealthy"

    return AdminHealthResponse(
        database="healthy",
        qdrant=qdrant_status,
        documents=stats["total_documents"],
        users=stats["total_users"],
        conversations=stats["total_conversations"],
    )
