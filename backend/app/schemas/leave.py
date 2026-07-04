from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.leave import LeaveStatus, LeaveType, NotificationType


class LeaveCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str = Field(min_length=3, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        if (self.end_date - self.start_date).days > 365:
            raise ValueError("A leave request cannot exceed 366 calendar days")
        return self


class LeaveDecision(BaseModel):
    comment: str = Field(min_length=2, max_length=1000)


class LeaveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    employee_name: str
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    working_days: int
    remarks: str
    status: LeaveStatus
    reviewer_id: UUID | None
    reviewer_comment: str | None
    reviewed_at: datetime | None
    created_at: datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime

