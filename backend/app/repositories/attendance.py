from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.attendance import Attendance, AttendanceCorrection, AttendanceStatus


class AttendanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_date(self, user_id: UUID, attendance_date: date) -> Attendance | None:
        stmt = select(Attendance).where(
            and_(
                Attendance.user_id == user_id,
                Attendance.attendance_date == attendance_date
            )
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def create(self, attendance: Attendance) -> Attendance:
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def update(self, attendance: Attendance) -> Attendance:
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def get_by_id(self, attendance_id: UUID) -> Attendance | None:
        stmt = select(Attendance).where(Attendance.id == attendance_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_user_attendance_today(self, user_id: UUID) -> Attendance | None:
        today = date.today()
        return self.get_by_user_and_date(user_id, today)

    def get_user_attendance_week(self, user_id: UUID) -> list[Attendance]:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        stmt = select(Attendance).where(
            and_(
                Attendance.user_id == user_id,
                Attendance.attendance_date >= start_of_week,
                Attendance.attendance_date <= end_of_week
            )
        )
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_user_attendance_month(self, user_id: UUID, year: int, month: int) -> list[Attendance]:
        start_of_month = date(year, month, 1)
        if month == 12:
            end_of_month = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_of_month = date(year, month + 1, 1) - timedelta(days=1)
        stmt = select(Attendance).where(
            and_(
                Attendance.user_id == user_id,
                Attendance.attendance_date >= start_of_month,
                Attendance.attendance_date <= end_of_month
            )
        )
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_user_attendance_history(
        self, user_id: UUID, start_date: date | None = None, end_date: date | None = None
    ) -> list[Attendance]:
        stmt = select(Attendance).where(Attendance.user_id == user_id)
        if start_date:
            stmt = stmt.where(Attendance.attendance_date >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.attendance_date <= end_date)
        stmt = stmt.order_by(Attendance.attendance_date.desc())
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_all_attendance(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        status: AttendanceStatus | None = None,
        employee_name: str | None = None,
        department: str | None = None
    ) -> list[Attendance]:
        # Note: For department and employee name, we'd need to join with user and employee profile,
        # but for simplicity we'll focus on core functionality first
        stmt = select(Attendance)
        if start_date:
            stmt = stmt.where(Attendance.attendance_date >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.attendance_date <= end_date)
        if status:
            stmt = stmt.where(Attendance.attendance_status == status)
        stmt = stmt.order_by(Attendance.attendance_date.desc())
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def create_correction(self, correction: AttendanceCorrection) -> AttendanceCorrection:
        self.db.add(correction)
        self.db.commit()
        self.db.refresh(correction)
        return correction

    def get_correction_by_id(self, correction_id: UUID) -> AttendanceCorrection | None:
        stmt = select(AttendanceCorrection).where(AttendanceCorrection.id == correction_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def update_correction(self, correction: AttendanceCorrection) -> AttendanceCorrection:
        self.db.commit()
        self.db.refresh(correction)
        return correction
