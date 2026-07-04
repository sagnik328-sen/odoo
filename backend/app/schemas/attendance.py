from datetime import datetime, date
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, field_validator

from app.models.attendance import AttendanceStatus, ApprovalStatus


# Base Schemas
class AttendanceBase(BaseModel):
    attendance_date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    remarks: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    attendance_status: Optional[AttendanceStatus] = None
    remarks: Optional[str] = None


class AttendanceCorrectionBase(BaseModel):
    attendance_id: UUID
    new_check_in: Optional[datetime] = None
    new_check_out: Optional[datetime] = None
    reason: str


class AttendanceCorrectionCreate(AttendanceCorrectionBase):
    pass


class AttendanceCorrectionUpdate(BaseModel):
    approval_status: ApprovalStatus
    reason: Optional[str] = None


# Response Schemas
class AttendanceResponse(AttendanceBase):
    id: UUID
    user_id: UUID
    working_hours: float
    overtime_hours: float
    attendance_status: AttendanceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceCorrectionResponse(AttendanceCorrectionBase):
    id: UUID
    user_id: UUID
    requested_by: UUID
    old_check_in: Optional[datetime] = None
    old_check_out: Optional[datetime] = None
    approval_status: ApprovalStatus
    approved_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Request Schemas for Specific Actions
class CheckInRequest(BaseModel):
    pass


class CheckOutRequest(BaseModel):
    pass
