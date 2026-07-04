from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import (
    LeaveRequest,
    LeaveStatus,
    Notification,
    NotificationType,
)
from app.models.user import User
from app.repositories.attendance import AttendanceRepository
from app.repositories.leave import LeaveRepository, NotificationRepository
from app.schemas.leave import LeaveCreate, LeaveDecision, LeaveResponse, NotificationResponse


def working_days(start_date: date, end_date: date) -> int:
    return sum(
        1
        for offset in range((end_date - start_date).days + 1)
        if (start_date + timedelta(days=offset)).weekday() < 5
    )


class LeaveService:
    def __init__(self, db: Session):
        self.db = db
        self.leaves = LeaveRepository(db)
        self.notifications = NotificationRepository(db)
        self.attendance = AttendanceRepository(db)

    @staticmethod
    def _response(request: LeaveRequest) -> LeaveResponse:
        return LeaveResponse(
            **{key: value for key, value in request.__dict__.items() if not key.startswith("_")},
            employee_name=request.employee.full_name,
            employee_id=request.employee.employee_id,
            working_days=working_days(request.start_date, request.end_date),
        )

    def apply(self, user: User, payload: LeaveCreate) -> LeaveResponse:
        if self.leaves.has_overlap(user.id, payload.start_date, payload.end_date):
            raise HTTPException(status_code=409, detail="Leave dates overlap an active request")
        request = LeaveRequest(user_id=user.id, **payload.model_dump())
        self.leaves.add(request)
        self.db.commit()
        return self._response(self.leaves.get(request.id))

    def history(self, user: User) -> list[LeaveResponse]:
        return [self._response(item) for item in self.leaves.list_for_user(user.id)]

    def all_requests(self, leave_status: LeaveStatus | None) -> list[LeaveResponse]:
        return [self._response(item) for item in self.leaves.list_all(leave_status)]

    def decide(
        self, request_id: UUID, reviewer: User, decision: LeaveStatus, payload: LeaveDecision
    ) -> LeaveResponse:
        request = self.leaves.get(request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Leave request not found")
        if request.status != LeaveStatus.PENDING:
            raise HTTPException(status_code=409, detail="Leave request has already been reviewed")
        if request.user_id == reviewer.id:
            raise HTTPException(status_code=400, detail="You cannot review your own leave request")

        request.status = decision
        request.reviewer_id = reviewer.id
        request.reviewer_comment = payload.comment
        request.reviewed_at = datetime.now()

        if decision == LeaveStatus.APPROVED:
            day = request.start_date
            while day <= request.end_date:
                if day.weekday() < 5:
                    attendance = self.attendance.get_by_user_and_date(request.user_id, day)
                    if attendance and (attendance.check_in or attendance.check_out):
                        raise HTTPException(
                            status_code=409,
                            detail=(
                                "Attendance already contains work activity for "
                                f"{day.isoformat()}"
                            ),
                        )
                    if not attendance:
                        attendance = Attendance(user_id=request.user_id, attendance_date=day)
                        self.db.add(attendance)
                    attendance.attendance_status = AttendanceStatus.LEAVE
                    attendance.remarks = f"{request.leave_type.value} leave"
                    attendance.working_hours = 0
                    attendance.overtime_hours = 0
                day += timedelta(days=1)

        self.notifications.add(
            Notification(
                user_id=request.user_id,
                title=f"Leave request {decision.value.lower()}",
                message=(
                    f"Your {request.leave_type.value.lower()} leave from "
                    f"{request.start_date:%d %b %Y} to {request.end_date:%d %b %Y} was "
                    f"{decision.value.lower()}. Comment: {payload.comment}"
                ),
                notification_type=NotificationType.LEAVE,
            )
        )
        self.db.commit()
        return self._response(self.leaves.get(request.id))


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.notifications = NotificationRepository(db)

    def list_for_user(self, user: User) -> list[NotificationResponse]:
        items = self.notifications.list_for_user(user.id)
        return [NotificationResponse.model_validate(item) for item in items]

    def mark_read(self, notification_id: UUID, user: User) -> NotificationResponse:
        notification = self.notifications.get_for_user(notification_id, user.id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
            )
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return NotificationResponse.model_validate(notification)
