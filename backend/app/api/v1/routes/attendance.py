from datetime import date
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, RoleChecker
from app.models.user import User, UserRole
from app.database.session import get_db
from app.schemas.attendance import (
    AttendanceResponse, AttendanceUpdate,
    AttendanceCorrectionCreate, AttendanceCorrectionResponse
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


@router.get("/me/today", response_model=Optional[AttendanceResponse])
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
    start_date: Optional[date] = Query(None, description="Start date for history (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for history (YYYY-MM-DD)"),
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
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
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
