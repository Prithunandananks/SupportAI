from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.api import deps
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, create_hmac_token, validate_password_strength, get_password_hash
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, TokenRefreshRequest, TokenPayload
from app.repositories.user_repo import user_repo
from app.core.rate_limit import limiter
from fastapi import BackgroundTasks
import secrets
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from app.services.email_service import email_service
from app.repositories.password_reset_repo import password_reset_repo
from app.models.password_reset import PasswordResetToken

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def get_email_from_request(request: Request) -> str:
    return getattr(request.state, "email", "")

router = APIRouter()

from app.core.logger import logger
import json

@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/minute")
async def register(request: Request, user_in: UserCreate, db: AsyncSession = Depends(deps.get_db)) -> Any:
    user = await user_repo.get_by_email(db, email=user_in.email)
    req_id = getattr(request.state, "request_id", "unknown")
    if user:
        logger.warning(json.dumps({
            "event": "registration_failed",
            "reason": "email_exists",
            "email": user_in.email,
            "request_id": req_id
        }))
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user = await user_repo.create(db, obj_in=user_in)
    logger.info(json.dumps({
        "event": "user_registered",
        "user_id": str(user.id),
        "request_id": req_id
    }))
    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    req_id = getattr(request.state, "request_id", "unknown")
    user = await user_repo.get_by_email(db, email=form_data.username.lower())
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(json.dumps({
            "event": "login_failed",
            "reason": "invalid_credentials",
            "request_id": req_id
        }))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        logger.warning(json.dumps({
            "event": "login_failed",
            "reason": "inactive_user",
            "request_id": req_id
        }))
        raise HTTPException(status_code=400, detail="Inactive user")

    logger.info(json.dumps({
        "event": "user_login",
        "user_id": str(user.id),
        "request_id": req_id
    }))
    
    return {
        "access_token": create_access_token(user.id, user.role, user.tenant_id),
        "refresh_token": create_refresh_token(user.id, user.role, user.tenant_id),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: TokenRefreshRequest, db: AsyncSession = Depends(deps.get_db)
) -> Any:
    try:
        payload = jwt.decode(
            request.refresh_token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token",
        )

    if token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    import uuid
    user = await user_repo.get(db, id=uuid.UUID(token_data.sub))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return {
        "access_token": create_access_token(user.id, user.role, user.tenant_id),
        "refresh_token": request.refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(current_user=Depends(deps.get_current_active_user)) -> Any:
    # Future integration: Token revocation/blacklist mechanism goes here
    return {"message": "Successfully logged out"}

@router.post("/forgot-password")
@limiter.limit("10/hour")
@limiter.limit("5/hour", key_func=get_email_from_request)
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    request.state.email = payload.email.lower()
    
    user = await user_repo.get_by_email(db, email=payload.email.lower())
    if not user:
        return {"message": "If that email is registered, a password reset link has been sent."}
        
    user_id = user.id
    user_email = user.email
        
    await password_reset_repo.invalidate_all_for_user(db, user_id)
    
    raw_token = secrets.token_urlsafe(32)
    token_hash = create_hmac_token(raw_token)
    
    db_obj = PasswordResetToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
    )
    db.add(db_obj)
    await db.commit()
    
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    background_tasks.add_task(
        email_service.send_password_reset_email, user_email, reset_url
    )
    
    return {"message": "If that email is registered, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    if not validate_password_strength(payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 12 characters, and include uppercase, lowercase, number, and special character."
        )
        
    token_hash = create_hmac_token(payload.token)
    token_record = await password_reset_repo.get_valid_token(db, token_hash)
    
    if not token_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token."
        )
        
    user = await user_repo.get(db, id=token_record.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token.")
        
    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="New password cannot be the same as the current password."
        )
        
    user.hashed_password = get_password_hash(payload.new_password)
    token_record.used_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"message": "Password has been successfully reset."}

class TenantSwitchRequest(BaseModel):
    tenant_id: str

@router.post("/switch-tenant", response_model=Token)
async def switch_tenant(
    request: TenantSwitchRequest,
    current_user = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    import uuid
    from app.repositories.tenant_membership_repo import tenant_membership_repo
    from app.models.tenant_membership import MembershipStatus
    
    try:
        tenant_uuid = uuid.UUID(request.tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID")

    membership = await tenant_membership_repo.get_by_user_and_tenant(db, current_user.id, tenant_uuid)
    
    if not membership or membership.status != MembershipStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an active member of this organization"
        )
        
    return {
        "access_token": create_access_token(current_user.id, current_user.role, tenant_uuid),
        "refresh_token": create_refresh_token(current_user.id, current_user.role, tenant_uuid),
        "token_type": "bearer",
    }

