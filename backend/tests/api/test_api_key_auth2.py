import pytest
import uuid
import json
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from app.core.api_key_auth import verify_api_key, hash_api_key, require_api_scope
from app.models.api_key import ApiKey
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.fixture
def mock_request():
    req = MagicMock()
    req.client.host = "127.0.0.1"
    req.headers.get.return_value = "test-agent"
    return req

@pytest.fixture
def mock_db():
    db = AsyncMock()
    return db

@pytest.mark.asyncio
async def test_verify_api_key_no_key(mock_request, mock_db):
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(mock_request, api_key=None, db=mock_db)
    assert exc.value.status_code == 401

@pytest.mark.asyncio
@patch("app.core.api_key_auth.redis_client")
async def test_verify_api_key_cache_hit_valid(mock_redis, mock_request, mock_db):
    api_key_val = "test_key_123"
    key_hash = hash_api_key(api_key_val)
    
    tenant_id = str(uuid.uuid4())
    key_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    cached_data = {
        "id": key_id,
        "tenant_id": tenant_id,
        "created_by": user_id,
        "scopes": "read,write",
        "is_active": True,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    }
    from unittest.mock import AsyncMock
    mock_redis.get = AsyncMock(return_value=json.dumps(cached_data))
    mock_db.execute.return_value = MagicMock()
    
    result = await verify_api_key(mock_request, api_key=api_key_val, db=mock_db)
    assert result.id == uuid.UUID(key_id)
    assert result.tenant_id == uuid.UUID(tenant_id)
    assert result.scopes == "read,write"

@pytest.mark.asyncio
@patch("app.core.api_key_auth.redis_client")
async def test_verify_api_key_cache_hit_revoked(mock_redis, mock_request, mock_db):
    api_key_val = "test_key_123"
    
    cached_data = {
        "id": str(uuid.uuid4()),
        "tenant_id": str(uuid.uuid4()),
        "created_by": str(uuid.uuid4()),
        "scopes": "read,write",
        "is_active": False,
        "expires_at": None
    }
    from unittest.mock import AsyncMock
    mock_redis.get = AsyncMock(return_value=json.dumps(cached_data))
    mock_db.execute.return_value = MagicMock()
    
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(mock_request, api_key=api_key_val, db=mock_db)
    assert exc.value.status_code == 403
    assert "revoked" in exc.value.detail

@pytest.mark.asyncio
@patch("app.core.api_key_auth.redis_client")
async def test_verify_api_key_cache_hit_expired(mock_redis, mock_request, mock_db):
    api_key_val = "test_key_123"
    
    cached_data = {
        "id": str(uuid.uuid4()),
        "tenant_id": str(uuid.uuid4()),
        "created_by": str(uuid.uuid4()),
        "scopes": "read,write",
        "is_active": True,
        "expires_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    }
    from unittest.mock import AsyncMock
    mock_redis.get = AsyncMock(return_value=json.dumps(cached_data))
    mock_db.execute.return_value = MagicMock()
    
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(mock_request, api_key=api_key_val, db=mock_db)
    assert exc.value.status_code == 403
    assert "expired" in exc.value.detail

@pytest.mark.asyncio
@patch("app.core.api_key_auth.redis_client")
async def test_verify_api_key_cache_miss_db_hit(mock_redis, mock_request, mock_db):
    api_key_val = "test_key_123"
    mock_redis.get.return_value = None
    
    key_obj = MagicMock()
    key_obj.id = uuid.uuid4()
    key_obj.tenant_id = uuid.uuid4()
    key_obj.created_by = uuid.uuid4()
    key_obj.scopes = "read"
    key_obj.is_active = True
    key_obj.expires_at = None
    
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = key_obj
    mock_db.execute.return_value = mock_result
    mock_audit = patch('app.core.api_key_auth.audit_service').start()
    mock_audit.create_log = AsyncMock()
    
    result = await verify_api_key(mock_request, api_key=api_key_val, db=mock_db)
        
    assert result == key_obj
    mock_redis.setex.assert_called_once()
    mock_audit.create_log.assert_called_once()

@pytest.mark.asyncio
async def test_require_api_scope():
    checker = require_api_scope("write")
    
    valid_key = MagicMock()
    valid_key.scopes = "read, write"
    result = await checker(valid_key)
    assert result == valid_key
    
    invalid_key = MagicMock()
    invalid_key.scopes = "read"
    with pytest.raises(HTTPException) as exc:
        await checker(invalid_key)
    assert exc.value.status_code == 403
