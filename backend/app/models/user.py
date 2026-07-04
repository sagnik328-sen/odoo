from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.employee import EmployeeProfile


class UserRole(StrEnum):
    ADMIN = "admin"
    HR = "hr"
    EMPLOYEE = "employee"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile: Mapped[Optional["EmployeeProfile"]] = relationship(
        "EmployeeProfile",
        primaryjoin="User.id == EmployeeProfile.user_id",
        foreign_keys="[EmployeeProfile.user_id]",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )


