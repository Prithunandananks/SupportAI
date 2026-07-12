from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.api import deps
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, TokenRefreshRequest, TokenPayload
from app.repositories.user_repo import user_repo

router = APIRouter()


from app.core.logger import logger
import json

@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
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
        "access_token": create_access_token(user.id, user.role),
        "refresh_token": create_refresh_token(user.id, user.role),
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
        "access_token": create_access_token(user.id, user.role),
        "refresh_token": request.refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(current_user=Depends(deps.get_current_active_user)) -> Any:
    # Future integration: Token revocation/blacklist mechanism goes here
    return {"message": "Successfully logged out"}
