import re
from pydantic import BaseModel, EmailStr, Field, field_validator
import uuid

# Password must be min 8 chars, 1 uppercase, 1 lowercase, 1 numeric
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$")


class UserBase(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserCreate(UserBase):
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must be at least 8 characters long and contain at least one uppercase letter, "
                "one lowercase letter, and one number."
            )
        return v


class UserResponse(UserBase):
    id: uuid.UUID
    role: str
    is_active: bool

    class Config:
        from_attributes = True
