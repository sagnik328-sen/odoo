from datetime import date
from uuid import uuid4, UUID
from typing import Optional

from sqlalchemy import Date, String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    company_name: Mapped[str] = mapped_column(String(100), default="PeopleFlow Inc.", nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class LeavePolicySettings(Base):
    __tablename__ = "leave_policy_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    annual_allowance: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    max_consecutive_days: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    carry_over_days: Mapped[int] = mapped_column(Integer, default=5, nullable=False)


class WorkingHoursSettings(Base):
    __tablename__ = "working_hours_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    start_time: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    end_time: Mapped[str] = mapped_column(String(5), default="17:00", nullable=False)
    work_days: Mapped[str] = mapped_column(String(100), default="Monday,Tuesday,Wednesday,Thursday,Friday", nullable=False)


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    can_manage_employees: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_manage_leave: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_manage_payroll: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_view_reports: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_manage_settings: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
