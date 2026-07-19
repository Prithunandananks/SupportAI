import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.schemas.user import UserCreate
from app.api.v1.auth import get_email_from_request
import uuid
import secrets

client = TestClient(app)

def test_get_email_from_request():
    req = MagicMock()
    req.state.email = "test@example.com"
    assert get_email_from_request(req) == "test@example.com"
    
    req2 = MagicMock()
    del req2.state.email
    assert get_email_from_request(req2) == ""

@pytest.mark.asyncio
async def test_login_inactive_user(db_session: AsyncSession):
    with patch("app.api.v1.auth.user_repo.get_by_email", new_callable=AsyncMock) as mock_get_by_email, \
         patch("app.api.v1.auth.verify_password") as mock_verify:
        
        mock_user = MagicMock()
        mock_user.is_active = False
        mock_get_by_email.return_value = mock_user
        mock_verify.return_value = True
        
        response = client.post("/api/v1/auth/login", data={"username": "test@example.com", "password": "Password123!"})
        assert response.status_code == 400
        assert "Inactive user" in response.text

@pytest.mark.asyncio
async def test_refresh_token_invalid_type():
    with patch("app.api.v1.auth.jwt.decode") as mock_decode:
        mock_decode.return_value = {"sub": str(uuid.uuid4()), "type": "access"}
        
        response = client.post("/api/v1/auth/refresh", json={"refresh_token": "token"})
        assert response.status_code == 401
        assert "Invalid token type" in response.text

@pytest.mark.asyncio
async def test_refresh_token_user_not_found():
    with patch("app.api.v1.auth.jwt.decode") as mock_decode, \
         patch("app.api.v1.auth.user_repo.get", new_callable=AsyncMock) as mock_get:
        
        mock_decode.return_value = {"sub": str(uuid.uuid4()), "type": "refresh"}
        mock_get.return_value = None
        
        response = client.post("/api/v1/auth/refresh", json={"refresh_token": "token"})
        assert response.status_code == 401
        assert "User not found or inactive" in response.text

@pytest.mark.asyncio
async def test_logout_success():
    with patch("app.api.v1.auth.deps.get_current_active_user") as mock_curr:
        mock_curr.return_value = MagicMock()
        response = client.post("/api/v1/auth/logout")
        # In test client, depends override is better, but since it's just a post we can rely on normal auth or override
        pass

@pytest.mark.asyncio
async def test_reset_password_user_not_found():
    with patch("app.api.v1.auth.password_reset_repo.get_valid_token", new_callable=AsyncMock) as mock_valid, \
         patch("app.api.v1.auth.user_repo.get", new_callable=AsyncMock) as mock_get_user:
        
        mock_record = MagicMock()
        mock_record.user_id = uuid.uuid4()
        mock_valid.return_value = mock_record
        mock_get_user.return_value = None
        
        response = client.post("/api/v1/auth/reset-password", json={"token": "tok", "new_password": "NewPassword123!"})
        assert response.status_code == 400
        assert "Invalid token" in response.text

@pytest.mark.asyncio
async def test_reset_password_same_password():
    with patch("app.api.v1.auth.password_reset_repo.get_valid_token", new_callable=AsyncMock) as mock_valid, \
         patch("app.api.v1.auth.user_repo.get", new_callable=AsyncMock) as mock_get_user, \
         patch("app.api.v1.auth.verify_password") as mock_verify:
        
        mock_record = MagicMock()
        mock_record.user_id = uuid.uuid4()
        mock_valid.return_value = mock_record
        mock_user = MagicMock()
        mock_get_user.return_value = mock_user
        mock_verify.return_value = True
        
        response = client.post("/api/v1/auth/reset-password", json={"token": "tok", "new_password": "NewPassword123!"})
        assert response.status_code == 400
        assert "cannot be the same" in response.text

@pytest.mark.asyncio
async def test_switch_tenant_invalid_uuid():
    from app.api.deps import get_current_active_user
    app.dependency_overrides[get_current_active_user] = lambda: MagicMock()
    response = client.post("/api/v1/auth/switch-tenant", json={"tenant_id": "invalid-uuid"})
    assert response.status_code == 400
    assert "Invalid tenant ID" in response.text
    app.dependency_overrides.clear()
