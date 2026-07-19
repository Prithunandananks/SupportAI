import uuid
import secrets
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from pydantic import BaseModel, HttpUrl

from app.api import deps
from app.models.webhook import Webhook
from app.services.audit_service import audit_service
from app.core.rbac import Permission
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter()

class WebhookCreate(BaseModel):
    url: str
    events: List[str]

class WebhookUpdate(BaseModel):
    url: str | None = None
    events: List[str] | None = None
    is_active: bool | None = None

class WebhookResponse(BaseModel):
    id: uuid.UUID
    url: str
    events: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class WebhookCreateResponse(WebhookResponse):
    secret: str

from app.core.webhook_security import validate_webhook_url

@router.post("", response_model=WebhookCreateResponse)
@limiter.limit("10/minute")
async def create_webhook(
    request: Request,
    payload: WebhookCreate,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    validate_webhook_url(payload.url)
    
    secret = f"whsec_{secrets.token_urlsafe(32)}"
    
    webhook = Webhook(
        tenant_id=membership.tenant_id,
        url=payload.url,
        secret=secret,
        events=payload.events,
        is_active=True
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    
    await audit_service.create_log(
        db=db,
        action="WEBHOOK_CREATED",
        actor_user_id=membership.user_id,
        resource_type="Webhook",
        resource_id=str(webhook.id)
    )
    await db.commit()
    
    return {
        "id": webhook.id,
        "url": webhook.url,
        "events": webhook.events,
        "is_active": webhook.is_active,
        "created_at": webhook.created_at,
        "updated_at": webhook.updated_at,
        "secret": secret
    }

@router.get("", response_model=List[WebhookResponse])
@limiter.limit("60/minute")
async def list_webhooks(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(Webhook).where(Webhook.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.patch("/{webhook_id}", response_model=WebhookResponse)
@limiter.limit("10/minute")
async def update_webhook(
    request: Request,
    webhook_id: uuid.UUID,
    payload: WebhookUpdate,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(Webhook).where(Webhook.id == webhook_id, Webhook.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    webhook = result.scalars().first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    if payload.url is not None:
        validate_webhook_url(payload.url)
        webhook.url = payload.url
    if payload.events is not None:
        webhook.events = payload.events
    if payload.is_active is not None:
        webhook.is_active = payload.is_active
        
    await db.commit()
    await db.refresh(webhook)
    
    await audit_service.create_log(
        db=db,
        action="WEBHOOK_UPDATED",
        actor_user_id=membership.user_id,
        resource_type="Webhook",
        resource_id=str(webhook.id)
    )
    await db.commit()
    
    return webhook

@router.delete("/{webhook_id}")
@limiter.limit("10/minute")
async def delete_webhook(
    request: Request,
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(Webhook).where(Webhook.id == webhook_id, Webhook.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    webhook = result.scalars().first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    await db.delete(webhook)
    await db.commit()
    
    await audit_service.create_log(
        db=db,
        action="WEBHOOK_DELETED",
        actor_user_id=membership.user_id,
        resource_type="Webhook",
        resource_id=str(webhook_id)
    )
    await db.commit()
    
    return {"message": "Webhook deleted successfully"}
