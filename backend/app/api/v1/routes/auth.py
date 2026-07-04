from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    VerifyEmailRequest,
)
from app.schemas.settings import ChangePasswordRequest
from app.services.auth import AuthService


router = APIRouter()
security = HTTPBearer()


@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register(user_in)


@router.post("/auth/login", response_model=TokenResponse)
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.login(login_in)


@router.post("/auth/logout", response_model=MessageResponse)
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    return auth_service.logout(credentials.credentials)


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.refresh_access_token(request.refresh_token)


@router.post("/auth/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.forgot_password(request)


@router.post("/auth/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.reset_password(request)


@router.post("/auth/verify-email", response_model=MessageResponse)
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.verify_email(request)


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/auth/change-password", response_model=MessageResponse)
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    auth_service = AuthService(db)
    return auth_service.change_password(current_user, request.old_password, request.new_password)

