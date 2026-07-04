from datetime import timedelta
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.schemas.auth import (
    UserCreate, UserResponse, LoginRequest, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
)
from app.utils.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_blacklist = set()  # Simple in-memory blacklist for local dev

    def register(self, user_in: UserCreate) -> UserResponse:
        # Check if email exists
        existing_user = self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if employee ID exists
        existing_employee = self.user_repo.get_by_employee_id(user_in.employee_id)
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee ID already registered"
            )
        
        # Create user
        hashed_password = get_password_hash(user_in.password)
        user = User(
            employee_id=user_in.employee_id,
            full_name=user_in.full_name,
            email=user_in.email,
            hashed_password=hashed_password,
            role=UserRole.EMPLOYEE
        )
        user = self.user_repo.create(user)
        
        # Log verification link for local dev
        verification_token = create_access_token(
            data={"sub": str(user.id), "purpose": "email_verification"},
            expires_delta=timedelta(hours=24)
        )
        logger.info(f"Email verification link for {user.email}: http://localhost:5173/verify-email?token={verification_token}")
        
        return UserResponse.model_validate(user)

    def login(self, login_in: LoginRequest) -> TokenResponse:
        user = self.user_repo.get_by_email(login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )

    def logout(self, token: str) -> MessageResponse:
        self.token_blacklist.add(token)
        return MessageResponse(message="Successfully logged out")

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        if refresh_token in self.token_blacklist:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )
        
        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Blacklist old refresh token
        self.token_blacklist.add(refresh_token)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserResponse.model_validate(user)
        )

    def forgot_password(self, request: ForgotPasswordRequest) -> MessageResponse:
        user = self.user_repo.get_by_email(request.email)
        if user:
            # Generate reset token and log it for local dev
            reset_token = create_access_token(
                data={"sub": str(user.id), "purpose": "password_reset"},
                expires_delta=timedelta(hours=1)
            )
            logger.info(f"Password reset link for {user.email}: http://localhost:5173/reset-password?token={reset_token}")
        
        return MessageResponse(message="If an account with that email exists, a reset link has been sent")

    def reset_password(self, request: ResetPasswordRequest) -> MessageResponse:
        payload = decode_token(request.token)
        if payload is None or payload.get("purpose") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
        
        user_id_str: Optional[str] = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.hashed_password = get_password_hash(request.new_password)
        self.user_repo.update(user)
        
        return MessageResponse(message="Password successfully reset")
