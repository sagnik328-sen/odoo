from datetime import date, datetime, timedelta
from uuid import UUID
from typing import Optional, List

from fastapi import HTTPException, status

from app.models.attendance import Attendance, AttendanceCorrection, AttendanceStatus, ApprovalStatus
from app.models.user import User
from app.repositories.attendance import AttendanceRepository
from app.schemas.attendance import (
    AttendanceResponse, AttendanceUpdate, AttendanceCorrectionCreate,
    AttendanceCorrectionResponse
)


class AttendanceService:
    def __init__(self, db):
        self.db = db
        self.repo = AttendanceRepository(db)

    def _calculate_working_hours(self, check_in: datetime, check_out: datetime) -> float:
        if not check_in or not check_out:
            return 0.0
        delta = check_out - check_in
        total_hours = delta.total_seconds() / 3600
        return round(total_hours, 2)

    def _determine_attendance_status(self, working_hours: float) -> AttendanceStatus:
        if working_hours == 0:
            return AttendanceStatus.ABSENT
        elif working_hours < 4:
            return AttendanceStatus.HALF_DAY
        else:
            return AttendanceStatus.PRESENT

    def check_in(self, user: User) -> AttendanceResponse:
        today = date.today()
        existing_attendance = self.repo.get_by_user_and_date(user.id, today)
        
        if existing_attendance:
            if existing_attendance.check_in:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already checked in today"
                )
            attendance = existing_attendance
        else:
            attendance = Attendance(
                user_id=user.id,
                attendance_date=today
            )
        
        attendance.check_in = datetime.now()
        attendance.attendance_status = AttendanceStatus.PRESENT
        
        if existing_attendance:
            attendance = self.repo.update(attendance)
        else:
            attendance = self.repo.create(attendance)
        
        return AttendanceResponse.model_validate(attendance)

    def check_out(self, user: User) -> AttendanceResponse:
        today = date.today()
        attendance = self.repo.get_by_user_and_date(user.id, today)
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No check-in record found for today"
            )
        
        if not attendance.check_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please check in first"
            )
        
        if attendance.check_out:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already checked out today"
            )
        
        attendance.check_out = datetime.now()
        attendance.working_hours = self._calculate_working_hours(attendance.check_in, attendance.check_out)
        attendance.attendance_status = self._determine_attendance_status(attendance.working_hours)
        
        attendance = self.repo.update(attendance)
        return AttendanceResponse.model_validate(attendance)

    def get_today_attendance(self, user: User) -> Optional[AttendanceResponse]:
        attendance = self.repo.get_user_attendance_today(user.id)
        if not attendance:
            return None
        return AttendanceResponse.model_validate(attendance)

    def get_week_attendance(self, user: User) -> List[AttendanceResponse]:
        attendances = self.repo.get_user_attendance_week(user.id)
        return [AttendanceResponse.model_validate(a) for a in attendances]

    def get_month_attendance(self, user: User, year: int, month: int) -> List[AttendanceResponse]:
        attendances = self.repo.get_user_attendance_month(user.id, year, month)
        return [AttendanceResponse.model_validate(a) for a in attendances]

    def get_attendance_history(
        self, user: User, start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> List[AttendanceResponse]:
        attendances = self.repo.get_user_attendance_history(user.id, start_date, end_date)
        return [AttendanceResponse.model_validate(a) for a in attendances]

    def get_all_attendance(
        self,
        current_user: User,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[AttendanceStatus] = None
    ) -> List[AttendanceResponse]:
        attendances = self.repo.get_all_attendance(start_date, end_date, status)
        return [AttendanceResponse.model_validate(a) for a in attendances]

    def update_attendance(
        self, attendance_id: UUID, attendance_data: AttendanceUpdate, current_user: User
    ) -> AttendanceResponse:
        attendance = self.repo.get_by_id(attendance_id)
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance not found"
            )
        
        if attendance_data.check_in is not None:
            attendance.check_in = attendance_data.check_in
        if attendance_data.check_out is not None:
            attendance.check_out = attendance_data.check_out
        if attendance_data.attendance_status:
            attendance.attendance_status = attendance_data.attendance_status
        if attendance_data.remarks is not None:
            attendance.remarks = attendance_data.remarks
        
        # Recalculate working hours if check-in/out changed
        if attendance.check_in and attendance.check_out:
            attendance.working_hours = self._calculate_working_hours(attendance.check_in, attendance.check_out)
            if not attendance_data.attendance_status:
                attendance.attendance_status = self._determine_attendance_status(attendance.working_hours)
        
        attendance = self.repo.update(attendance)
        return AttendanceResponse.model_validate(attendance)

    def request_correction(
        self, correction_data: AttendanceCorrectionCreate, current_user: User
    ) -> AttendanceCorrectionResponse:
        attendance = self.repo.get_by_id(correction_data.attendance_id)
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance not found"
            )
        
        correction = AttendanceCorrection(
            attendance_id=correction_data.attendance_id,
            user_id=attendance.user_id,
            requested_by=current_user.id,
            old_check_in=attendance.check_in,
            old_check_out=attendance.check_out,
            new_check_in=correction_data.new_check_in,
            new_check_out=correction_data.new_check_out,
            reason=correction_data.reason
        )
        
        correction = self.repo.create_correction(correction)
        return AttendanceCorrectionResponse.model_validate(correction)

    def approve_correction(
        self, correction_id: UUID, approved: bool, current_user: User
    ) -> AttendanceCorrectionResponse:
        correction = self.repo.get_correction_by_id(correction_id)
        if not correction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Correction not found"
            )
        
        if correction.approval_status != ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Correction already processed"
            )
        
        if approved:
            correction.approval_status = ApprovalStatus.APPROVED
            # Update attendance record
            attendance = self.repo.get_by_id(correction.attendance_id)
            if attendance:
                if correction.new_check_in is not None:
                    attendance.check_in = correction.new_check_in
                if correction.new_check_out is not None:
                    attendance.check_out = correction.new_check_out
                if attendance.check_in and attendance.check_out:
                    attendance.working_hours = self._calculate_working_hours(
                        attendance.check_in, attendance.check_out
                    )
                    attendance.attendance_status = self._determine_attendance_status(
                        attendance.working_hours
                    )
                self.repo.update(attendance)
        else:
            correction.approval_status = ApprovalStatus.REJECTED
        
        correction.approved_by = current_user.id
        correction = self.repo.update_correction(correction)
        
        return AttendanceCorrectionResponse.model_validate(correction)
