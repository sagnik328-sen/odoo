from datetime import timedelta
import threading
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.utils.email import send_welcome_email, send_password_reset_email, send_verification_email

from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    VerifyEmailRequest,
)
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    is_token_revoked,
    revoke_token,
    verify_password,
)

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

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
            role=user_in.role
        )
        user = self.user_repo.create(user)
        
        # Log verification link for local dev
        _verification_token = create_access_token(
            data={"sub": str(user.id), "purpose": "email_verification"},
            expires_delta=timedelta(hours=24)
        )
        logger.info("email_verification_token_created user_id=%s", user.id)
        
        # Send verification email asynchronously
        verification_link = f"{settings.frontend_url}/verify-email?token={_verification_token}"
        threading.Thread(
            target=send_verification_email,
            args=(user.email, user.full_name, verification_link),
            daemon=True
        ).start()
        
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
            
        if not user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification is required. Please verify your email first."
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user)
        )

    def logout(self, token: str) -> MessageResponse:
        revoke_token(token)
        return MessageResponse(message="Successfully logged out")

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            ) from None
        
        if is_token_revoked(refresh_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )
        
        user_id_str: str | None = payload.get("sub")
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
            ) from None
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Blacklist old refresh token
        revoke_token(refresh_token)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserResponse.model_validate(user)
        )

    def forgot_password(self, request: ForgotPasswordRequest) -> MessageResponse:
        user = self.user_repo.get_by_email(request.email)
        if user:
            # Generate reset token and log it for local dev
            _reset_token = create_access_token(
                data={"sub": str(user.id), "purpose": "password_reset"},
                expires_delta=timedelta(hours=1)
            )
            logger.info("password_reset_token_created user_id=%s", user.id)
            
            # Send password reset email asynchronously
            reset_link = f"{settings.frontend_url}/reset-password?token={_reset_token}"
            threading.Thread(
                target=send_password_reset_email,
                args=(user.email, user.full_name, reset_link),
                daemon=True
            ).start()
        
        return MessageResponse(message="If an account with that email exists, a reset link has been sent")

    def reset_password(self, request: ResetPasswordRequest) -> MessageResponse:
        payload = decode_token(request.token)
        if payload is None or payload.get("purpose") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
        
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            ) from None
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            ) from None
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.hashed_password = get_password_hash(request.new_password)
        self.user_repo.update(user)
        
        return MessageResponse(message="Password successfully reset")

    def change_password(self, user: User, old_password: str, new_password: str) -> MessageResponse:
        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect old password"
            )
        user.hashed_password = get_password_hash(new_password)
        self.user_repo.update(user)
        return MessageResponse(message="Password changed successfully")

    def verify_email(self, request: VerifyEmailRequest) -> MessageResponse:
        payload = decode_token(request.token)
        if payload is None or payload.get("purpose") != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        user_id_str: str | None = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            ) from None
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.is_email_verified:
            return MessageResponse(message="Email is already verified")
            
        user.is_email_verified = True
        self.user_repo.update(user)
        
        return MessageResponse(message="Email successfully verified")

