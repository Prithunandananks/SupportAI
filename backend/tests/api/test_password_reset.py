import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import user_repo
from app.models.password_reset import PasswordResetToken
from sqlalchemy import select

pytestmark = pytest.mark.anyio

async def test_forgot_password_generic_success(client: AsyncClient, db_session: AsyncSession):
    response = await client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert response.status_code == 200
    assert "If that email is registered" in response.json()["message"]

from app.schemas.user import UserCreate

async def test_forgot_password_creates_token(client: AsyncClient, db_session: AsyncSession):
    # create user
    user = await user_repo.create(db_session, obj_in=UserCreate(
        email="test_forgot@example.com",
        password="TestPassword123!",
        first_name="Test",
        last_name="User"
    ))
    response = await client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    assert response.status_code == 200
    
    # Check DB for token
    result = await db_session.execute(select(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    tokens = result.scalars().all()
    assert len(tokens) == 1
    assert tokens[0].used_at is None

async def test_reset_password_invalid_token(client: AsyncClient, db_session: AsyncSession):
    response = await client.post("/api/v1/auth/reset-password", json={
        "token": "invalid_token",
        "new_password": "ValidPassword123!"
    })
    assert response.status_code == 400
    assert "Invalid or expired password reset token" in response.json()["detail"]

async def test_reset_password_weak_password(client: AsyncClient, db_session: AsyncSession):
    response = await client.post("/api/v1/auth/reset-password", json={
        "token": "sometoken",
        "new_password": "weak"
    })
    assert response.status_code == 400
    assert "Password must be at least 12 characters" in response.json()["detail"]

