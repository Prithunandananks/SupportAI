import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.api import deps
from app.services.audit_service import audit_service
from app.core.rbac import Permission

router = APIRouter()

@router.get("")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    actor_user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    logs = await audit_service.search_logs(
        db=db,
        skip=skip,
        limit=limit,
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date
    )
    return logs

@router.get("/export")
async def export_audit_logs(
    actor_user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    csv_data = await audit_service.export_logs_csv(
        db=db,
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date
    )
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit_logs.csv"})
