from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import RoleChecker, get_current_user
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.attendance import (
    AttendanceCorrectionCreate,
    AttendanceCorrectionResponse,
    AttendanceResponse,
    AttendanceUpdate,
)
from app.services.attendance import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# Employee Endpoints
@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.check_in(current_user)


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.check_out(current_user)


@router.get("/me/today", response_model=AttendanceResponse | None)
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.get_today_attendance(current_user)


@router.get("/me/week", response_model=list[AttendanceResponse])
def get_week_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.get_week_attendance(current_user)


@router.get("/me/month", response_model=list[AttendanceResponse])
def get_month_attendance(
    year: int = Query(..., description="Year for which to get attendance"),
    month: int = Query(..., description="Month for which to get attendance (1-12)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.get_month_attendance(current_user, year, month)


@router.get("/me/history", response_model=list[AttendanceResponse])
def get_attendance_history(
    start_date: date | None = Query(None, description="Start date for history (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="End date for history (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.get_attendance_history(current_user, start_date, end_date)


# Admin/HR Endpoints
@router.get(
    "",
    response_model=list[AttendanceResponse],
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.HR]))]
)
def get_all_attendance(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.get_all_attendance(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        status=status
    )


@router.put(
    "/{attendance_id}",
    response_model=AttendanceResponse,
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.HR]))]
)
def update_attendance(
    attendance_id: UUID,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.update_attendance(attendance_id, attendance_data, current_user)


@router.post(
    "/correction",
    response_model=AttendanceCorrectionResponse,
    status_code=status.HTTP_201_CREATED
)
def request_correction(
    correction_data: AttendanceCorrectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.request_correction(correction_data, current_user)


@router.put(
    "/correction/{correction_id}/approve",
    response_model=AttendanceCorrectionResponse,
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.HR]))]
)
def approve_correction(
    correction_id: UUID,
    approved: bool = Query(..., description="Whether to approve the correction"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AttendanceService(db)
    return service.approve_correction(correction_id, approved, current_user)


@router.post(
    "/remind-all",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.HR]))]
)
def send_attendance_reminders(
    db: Session = Depends(get_db)
):
    from datetime import date

    from sqlalchemy import select

    from app.models.attendance import Attendance
    from app.models.leave import Notification, NotificationType
    from app.models.user import User, UserRole

    # Get all employees
    employees = db.scalars(select(User).where(User.role == UserRole.EMPLOYEE)).all()
    
    # Get today's check-ins
    today = date.today()
    check_ins = db.scalars(select(Attendance.user_id).where(Attendance.attendance_date == today)).all()
    checked_in_set = set(check_ins)

    reminded_count = 0
    for emp in employees:
        if emp.id not in checked_in_set:
            notification = Notification(
                user_id=emp.id,
                title="Attendance Check-In Reminder",
                message="You have not checked in for today yet. Please remember to clock in to log your hours.",
                notification_type=NotificationType.ATTENDANCE
            )
            db.add(notification)
            reminded_count += 1
            
    db.commit()
    return {"message": f"Successfully sent check-in reminders to {reminded_count} employees.", "count": reminded_count}
