from datetime import datetime
from uuid import uuid4, UUID
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import DateTime, String, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manager_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    joining_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    base_salary: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    allowances: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    bonuses: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    deductions: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tax: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    profile_picture: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="profile")
    manager: Mapped[Optional["User"]] = relationship("User", foreign_keys=[manager_id])
    documents: Mapped[List["EmployeeDocument"]] = relationship("EmployeeDocument", back_populates="profile", cascade="all, delete-orphan")


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(ForeignKey("employee_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    profile: Mapped["EmployeeProfile"] = relationship("EmployeeProfile", back_populates="documents")
