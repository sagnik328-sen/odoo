from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: UserRole
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        special_chars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        if not any(c in special_chars for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class MessageResponse(BaseModel):
    message: str
