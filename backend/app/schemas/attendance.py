from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.attendance import ApprovalStatus, AttendanceStatus


# Base Schemas
class AttendanceBase(BaseModel):
    attendance_date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    remarks: str | None = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    check_in: datetime | None = None
    check_out: datetime | None = None
    attendance_status: AttendanceStatus | None = None
    remarks: str | None = None


class AttendanceCorrectionBase(BaseModel):
    attendance_id: UUID
    new_check_in: datetime | None = None
    new_check_out: datetime | None = None
    reason: str


class AttendanceCorrectionCreate(AttendanceCorrectionBase):
    pass


class AttendanceCorrectionUpdate(BaseModel):
    approval_status: ApprovalStatus
    reason: str | None = None


# Response Schemas
class AttendanceResponse(AttendanceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    working_hours: float
    overtime_hours: float
    attendance_status: AttendanceStatus
    created_at: datetime
    updated_at: datetime

class AttendanceCorrectionResponse(AttendanceCorrectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    requested_by: UUID
    old_check_in: datetime | None = None
    old_check_out: datetime | None = None
    approval_status: ApprovalStatus
    approved_by: UUID | None = None
    created_at: datetime



# Request Schemas for Specific Actions
class CheckInRequest(BaseModel):
    pass


class CheckOutRequest(BaseModel):
    pass
