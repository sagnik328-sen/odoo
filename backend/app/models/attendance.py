from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class AttendanceStatus(StrEnum):
    PRESENT = "Present"
    ABSENT = "Absent"
    HALF_DAY = "Half-Day"
    LEAVE = "Leave"
    HOLIDAY = "Holiday"


class ApprovalStatus(StrEnum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    attendance_date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    working_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overtime_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    attendance_status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.ABSENT)
    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    corrections: Mapped[list["AttendanceCorrection"]] = relationship(
        "AttendanceCorrection",
        back_populates="attendance",
        cascade="all, delete-orphan"
    )


class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    attendance_id: Mapped[UUID] = mapped_column(ForeignKey("attendances.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    requested_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    old_check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    new_check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    new_check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    approval_status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING)
    approved_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    attendance: Mapped["Attendance"] = relationship("Attendance", back_populates="corrections")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    requester: Mapped["User"] = relationship("User", foreign_keys=[requested_by])
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by])
