from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.utils.security import decode_token, is_token_revoked

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    if is_token_revoked(token):
        raise credentials_exception from None
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    if payload.get("type") != "access":
        raise credentials_exception
    
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise credentials_exception from None
    
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_uuid)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user


class PermissionChecker:
    def __init__(self, permission_name: str):
        self.permission_name = permission_name
    
    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        if current_user.role == UserRole.ADMIN:
            return current_user
            
        from app.repositories.settings import SettingsRepository
        settings_repo = SettingsRepository(db)
        role_perm = settings_repo.get_role_permissions(current_user.role.value)
        if not getattr(role_perm, self.permission_name, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user


def require_roles(roles: list[str]) -> RoleChecker:
    """Create a FastAPI dependency that allows only the supplied role values."""
    try:
        allowed_roles = [UserRole(role.lower()) for role in roles]
    except ValueError as exc:
        raise RuntimeError(f"Unknown role configured: {roles}") from exc
    return RoleChecker(allowed_roles)
