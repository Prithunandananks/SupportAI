import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User
from app.services.notification_service import notification_service
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter()

class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str
    status: str
    metadata_obj: Any
    related_ticket_id: uuid.UUID | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    limit: int = 50,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Retrieve notifications for the current user.
    """
    notifications = await notification_service.get_user_notifications(db, current_user.id, limit=limit)
    
    # We must map `type` and `status` ENUMs to their string values if pydantic has trouble, 
    # but `from_attributes` usually handles Enum if typed as str or properly defined.
    # We'll map them explicitly just in case to match the schema response.
    resp = []
    for n in notifications:
        resp.append(NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type.value,
            status=n.status.value,
            metadata_obj=n.metadata_obj,
            related_ticket_id=n.related_ticket_id,
            is_read=n.is_read,
            created_at=n.created_at,
            read_at=n.read_at
        ))
    return resp

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Mark a specific notification as read.
    """
    notification = await notification_service.mark_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found or access denied")
        
    return NotificationResponse(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        type=notification.type.value,
        status=notification.status.value,
        metadata_obj=notification.metadata_obj,
        related_ticket_id=notification.related_ticket_id,
        is_read=notification.is_read,
        created_at=notification.created_at,
        read_at=notification.read_at
    )

@router.patch("/read-all")
async def mark_all_notifications_as_read(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Mark all unread notifications as read.
    """
    await notification_service.mark_all_as_read(db, current_user.id)
    return {"status": "success"}

@router.patch("/{notification_id}/archive", response_model=NotificationResponse)
async def archive_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Archive a specific notification.
    """
    notification = await notification_service.archive_notification(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found or access denied")
        
    return NotificationResponse(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        type=notification.type.value,
        status=notification.status.value,
        metadata_obj=notification.metadata_obj,
        related_ticket_id=notification.related_ticket_id,
        is_read=notification.is_read,
        created_at=notification.created_at,
        read_at=notification.read_at
    )
