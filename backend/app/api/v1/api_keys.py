import uuid
import secrets
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel

from app.api import deps
from app.core.api_key_auth import hash_api_key
from app.models.api_key import ApiKey
from app.services.audit_service import audit_service
from app.core.api_key_auth import redis_client
from app.core.rbac import Permission
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter()

class ApiKeyCreate(BaseModel):
    name: str
    scopes: str # comma separated

class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    scopes: str
    last_used_at: datetime | None
    expires_at: datetime | None
    is_active: bool
    created_at: datetime

class ApiKeyCreateResponse(ApiKeyResponse):
    raw_key: str # Only shown once!

@router.post("", response_model=ApiKeyCreateResponse)
@limiter.limit("120/minute")
async def create_api_key(
    request: Request,
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    raw_key = f"sk_{secrets.token_urlsafe(32)}"
    key_hash = hash_api_key(raw_key)
    
    api_key = ApiKey(
        tenant_id=membership.tenant_id,
        name=payload.name,
        key_hash=key_hash,
        scopes=payload.scopes,
        created_by=membership.user_id,
        is_active=True
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    await audit_service.create_log(
        db=db,
        action="API_KEY_CREATED",
        actor_user_id=membership.user_id,
        resource_type="ApiKey",
        resource_id=str(api_key.id)
    )
    await db.commit()
    
    return {
        "id": api_key.id,
        "name": api_key.name,
        "scopes": api_key.scopes,
        "last_used_at": api_key.last_used_at,
        "expires_at": api_key.expires_at,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "raw_key": raw_key
    }

@router.get("", response_model=List[ApiKeyResponse])
@limiter.limit("120/minute")
async def list_api_keys(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(ApiKey).where(ApiKey.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())

@router.patch("/{key_id}/rotate", response_model=ApiKeyCreateResponse)
@limiter.limit("120/minute")
async def rotate_api_key(
    request: Request,
    key_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(ApiKey).where(ApiKey.id == key_id, ApiKey.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    api_key = result.scalars().first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    
    old_hash = api_key.key_hash
    raw_key = f"sk_{secrets.token_urlsafe(32)}"
    key_hash = hash_api_key(raw_key)
    
    api_key.key_hash = key_hash
    await db.commit()
    
    if redis_client:
        await redis_client.delete(f"apikey:{old_hash}")
    
    await audit_service.create_log(
        db=db,
        action="API_KEY_ROTATED",
        actor_user_id=membership.user_id,
        resource_type="ApiKey",
        resource_id=str(api_key.id)
    )
    await db.commit()
    
    return {
        "id": api_key.id,
        "name": api_key.name,
        "scopes": api_key.scopes,
        "last_used_at": api_key.last_used_at,
        "expires_at": api_key.expires_at,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "raw_key": raw_key
    }

@router.delete("/{key_id}")
@limiter.limit("120/minute")
async def revoke_api_key(
    request: Request,
    key_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    membership = Depends(deps.require_permission(Permission.MANAGE_ORGANIZATION))
) -> Any:
    stmt = select(ApiKey).where(ApiKey.id == key_id, ApiKey.tenant_id == membership.tenant_id)
    result = await db.execute(stmt)
    api_key = result.scalars().first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    api_key.is_active = False
    await db.commit()
    
    if redis_client:
        await redis_client.delete(f"apikey:{api_key.key_hash}")
    
    await audit_service.create_log(
        db=db,
        action="API_KEY_REVOKED",
        actor_user_id=membership.user_id,
        resource_type="ApiKey",
        resource_id=str(api_key.id)
    )
    await db.commit()
    
    return {"message": "API Key revoked successfully"}
