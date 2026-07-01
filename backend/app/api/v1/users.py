from typing import Any
from fastapi import APIRouter, Depends
from app.api import deps
from app.schemas.user import UserResponse
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(deps.get_current_active_user)) -> Any:
    return current_user
