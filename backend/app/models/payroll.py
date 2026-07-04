from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class PayslipStatus(StrEnum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    PAID = "Paid"


class Payslip(Base):
    __tablename__ = "payslips"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    month: Mapped[str] = mapped_column(String(20), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    basic_salary: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    allowances: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    bonuses: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    deductions: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    tax: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    net_salary: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    status: Mapped[PayslipStatus] = mapped_column(
        Enum(PayslipStatus), index=True, default=PayslipStatus.PAID, nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
