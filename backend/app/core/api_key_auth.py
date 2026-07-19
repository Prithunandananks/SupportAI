import hashlib
from datetime import datetime, timezone
from fastapi import Security, HTTPException, status, Depends, Request
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.api_key import ApiKey
from app.db.session import tenant_id_var
from app.services.audit_service import audit_service

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_db_session():
    async with AsyncSessionLocal() as session:
        yield session

def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

import json
import redis.asyncio as aioredis
from app.core.config import settings

redis_client = None
if settings.REDIS_URL:
    redis_client = aioredis.from_url(settings.REDIS_URL)

async def verify_api_key(
    request: Request,
    api_key: str = Security(api_key_header),
    db: AsyncSession = Depends(get_db_session)
) -> ApiKey:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header"
        )
        
    key_hash = hash_api_key(api_key)
    
    cached_key = None
    if redis_client:
        try:
            cached_key = await redis_client.get(f"apikey:{key_hash}")
        except Exception as e:
            from app.core.logger import logger
            logger.warning(f"Redis cache error: {e}")
            
    if cached_key:
        data = json.loads(cached_key)
        # Check active and expiration from cache
        if not data.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API Key has been revoked"
            )
        expires_at = data.get("expires_at")
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API Key has expired"
            )
        
        import uuid
        
        tenant_id = uuid.UUID(data["tenant_id"])
        tenant_id_var.set(tenant_id)
        
        # Build detached model
        key_obj = ApiKey(
            id=uuid.UUID(data["id"]),
            tenant_id=tenant_id,
            created_by=uuid.UUID(data["created_by"]),
            scopes=data["scopes"],
            is_active=data["is_active"]
        )
        return key_obj

    # We must ignore tenant here because we haven't established tenant context yet
    stmt = select(ApiKey).where(ApiKey.key_hash == key_hash).execution_options(ignore_tenant=True)
    result = await db.execute(stmt)
    key_obj = result.scalars().first()
    
    if not key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
        
    if not key_obj.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key has been revoked"
        )
        
    if key_obj.expires_at and key_obj.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key has expired"
        )
        
    # Establish tenant context for this request
    tenant_id_var.set(key_obj.tenant_id)
    
    # Cache the key for 5 minutes
    cache_data = {
        "id": str(key_obj.id),
        "tenant_id": str(key_obj.tenant_id),
        "created_by": str(key_obj.created_by),
        "scopes": key_obj.scopes,
        "is_active": key_obj.is_active,
        "expires_at": key_obj.expires_at.isoformat() if key_obj.expires_at else None
    }
    if redis_client:
        try:
            await redis_client.setex(f"apikey:{key_hash}", 300, json.dumps(cache_data))
        except Exception as e:
            from app.core.logger import logger
            logger.warning(f"Redis cache error on set: {e}")
    
    # Update last used
    key_obj.last_used_at = datetime.now(timezone.utc)
    
    # Audit log
    await audit_service.create_log(
        db=db,
        action="API_KEY_USED",
        actor_user_id=key_obj.created_by,
        resource_type="ApiKey",
        resource_id=str(key_obj.id),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    await db.commit()
    
    return key_obj

def require_api_scope(required_scope: str):
    async def scope_checker(key: ApiKey = Depends(verify_api_key)):
        scopes = [s.strip() for s in key.scopes.split(",") if s.strip()]
        if required_scope not in scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API Key missing required scope: {required_scope}"
            )
        return key
    return scope_checker
