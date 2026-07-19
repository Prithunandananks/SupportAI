import pytest
import uuid
from datetime import datetime, timedelta, timezone
# pyrefly: ignore [missing-import]
from fastapi import HTTPException
import json
from unittest.mock import AsyncMock, patch

from app.core.api_key_auth import verify_api_key, hash_api_key, require_api_scope
from app.models.api_key import ApiKey
from app.db.session import tenant_id_var

@pytest.mark.asyncio
async def test_verify_api_key_missing():
    from fastapi import Request
    
    class DummyRequest:
        client = None
        headers = {}
    
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(request=DummyRequest(), api_key=None, db=AsyncMock())
    assert exc.value.status_code == 401
    assert "Missing X-API-Key header" in exc.value.detail

@pytest.mark.asyncio
async def test_verify_api_key_valid(db_session):
    import uuid
    tenant_id = uuid.uuid4()
    user_id = uuid.uuid4()
    
    raw_key = "test_key_123"
    hashed = hash_api_key(raw_key)
    
    api_key = ApiKey(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        created_by=user_id,
        key_hash=hashed,
        name="test_key",
        scopes="read,write",
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True
    )
    
    db_session.add(api_key)
    await db_session.commit()
    
    class DummyClient:
        host = "127.0.0.1"
    class DummyRequest:
        client = DummyClient()
        headers = {"user-agent": "pytest"}
        
    result = await verify_api_key(request=DummyRequest(), api_key=raw_key, db=db_session)
    assert result.id == api_key.id
    assert tenant_id_var.get() == tenant_id

@pytest.mark.asyncio
async def test_verify_api_key_invalid(db_session):
    class DummyRequest:
        client = None
        headers = {}
        
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(request=DummyRequest(), api_key="invalid", db=db_session)
    assert exc.value.status_code == 401

@pytest.mark.asyncio
async def test_verify_api_key_revoked(db_session):
    tenant_id = uuid.uuid4()
    raw_key = "revoked_key"
    api_key = ApiKey(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        created_by=uuid.uuid4(),
        key_hash=hash_api_key(raw_key),
        name="revoked",
        scopes="read",
        is_active=False
    )
    db_session.add(api_key)
    await db_session.commit()
    
    class DummyRequest:
        client = None
        headers = {}
        
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(request=DummyRequest(), api_key=raw_key, db=db_session)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_verify_api_key_expired(db_session):
    tenant_id = uuid.uuid4()
    raw_key = "expired_key"
    api_key = ApiKey(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        created_by=uuid.uuid4(),
        key_hash=hash_api_key(raw_key),
        name="expired",
        scopes="read",
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        is_active=True
    )
    db_session.add(api_key)
    await db_session.commit()
    
    class DummyRequest:
        client = None
        headers = {}
        
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(request=DummyRequest(), api_key=raw_key, db=db_session)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_require_api_scope():
    key = ApiKey(scopes="read,write")
    
    checker_read = require_api_scope("read")
    res = await checker_read(key)
    assert res == key
    
    checker_admin = require_api_scope("admin")
    with pytest.raises(HTTPException) as exc:
        await checker_admin(key)
    assert exc.value.status_code == 403
