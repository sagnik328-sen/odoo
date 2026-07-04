from datetime import date
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CompanySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None


class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=50)


class LeavePolicySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    annual_allowance: int
    max_consecutive_days: int
    approval_required: bool
    carry_over_days: int


class LeavePolicySettingsUpdate(BaseModel):
    annual_allowance: Optional[int] = Field(None, ge=0)
    max_consecutive_days: Optional[int] = Field(None, ge=1)
    approval_required: Optional[bool] = None
    carry_over_days: Optional[int] = Field(None, ge=0)


class WorkingHoursSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    start_time: str
    end_time: str
    work_days: str


class WorkingHoursSettingsUpdate(BaseModel):
    start_time: Optional[str] = Field(None, min_length=5, max_length=5)  # "HH:MM"
    end_time: Optional[str] = Field(None, min_length=5, max_length=5)    # "HH:MM"
    work_days: Optional[str] = Field(None, max_length=100)               # Comma-separated work days


class HolidayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    date: date


class HolidayCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    date: date


class RolePermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str
    can_manage_employees: bool
    can_manage_leave: bool
    can_manage_payroll: bool
    can_view_reports: bool
    can_manage_settings: bool


class RolePermissionUpdate(BaseModel):
    can_manage_employees: Optional[bool] = None
    can_manage_leave: Optional[bool] = None
    can_manage_payroll: Optional[bool] = None
    can_view_reports: Optional[bool] = None
    can_manage_settings: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
