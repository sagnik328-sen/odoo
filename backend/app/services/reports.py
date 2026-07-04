from calendar import month_name
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import EmployeeProfile
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.payroll import Payslip
from app.models.user import User
from app.schemas.reports import (
    AttendanceAnalyticsData,
    AttendanceReportFilters,
    AttendanceReportItem,
    AttendanceReportResponse,
    DashboardSummary,
    EmployeeAnalyticsData,
    EmployeeReportFilters,
    EmployeeReportItem,
    EmployeeReportResponse,
    LeaveAnalyticsData,
    LeaveReportFilters,
    LeaveReportItem,
    LeaveReportResponse,
    PayrollAnalyticsData,
    PayrollReportFilters,
    PayrollReportItem,
    PayrollReportResponse,
)


def month_start(value: date, offset: int = 0) -> date:
    month_index = value.year * 12 + value.month - 1 + offset
    return date(month_index // 12, month_index % 12 + 1, 1)


class ReportsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> DashboardSummary:
        today = date.today()
        total = self.db.scalar(select(func.count(User.id))) or 0
        active = self.db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
        present = self.db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.attendance_date == today,
                Attendance.attendance_status.in_(
                    [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]
                ),
            )
        ) or 0
        absent = self.db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.attendance_date == today,
                Attendance.attendance_status == AttendanceStatus.ABSENT,
            )
        ) or 0
        on_leave = self.db.scalar(
            select(func.count(LeaveRequest.id)).where(
                LeaveRequest.status == LeaveStatus.APPROVED,
                LeaveRequest.start_date <= today,
                LeaveRequest.end_date >= today,
            )
        ) or 0
        pending = self.db.scalar(
            select(func.count(LeaveRequest.id)).where(
                LeaveRequest.status == LeaveStatus.PENDING
            )
        ) or 0
        payroll = self.db.scalar(
            select(func.sum(Payslip.net_salary)).where(
                Payslip.year == today.year, Payslip.month == month_name[today.month]
            )
        ) or 0.0
        tracked = present + absent + on_leave
        percentage = round((present / tracked * 100), 2) if tracked else 0.0
        return DashboardSummary(
            total_employees=total,
            active_employees=active,
            present_today=present,
            absent_today=absent,
            on_leave_today=on_leave,
            total_payroll_current_month=float(payroll),
            average_attendance_percentage=percentage,
            pending_leave_requests=pending,
        )

    def get_attendance_report(
        self,
        filters: AttendanceReportFilters,
        employee_id: UUID | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> AttendanceReportResponse:
        statement = (
            select(Attendance, User, EmployeeProfile)
            .join(User, Attendance.user_id == User.id)
            .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.id)
        )
        target_id = employee_id or filters.employee_id
        if target_id:
            statement = statement.where(Attendance.user_id == target_id)
        if filters.department:
            statement = statement.where(EmployeeProfile.department == filters.department)
        if filters.status:
            statement = statement.where(Attendance.attendance_status == filters.status)
        if filters.start_date:
            statement = statement.where(Attendance.attendance_date >= filters.start_date)
        if filters.end_date:
            statement = statement.where(Attendance.attendance_date <= filters.end_date)
        if filters.month:
            statement = statement.where(extract("month", Attendance.attendance_date) == filters.month)
        if filters.year:
            statement = statement.where(extract("year", Attendance.attendance_date) == filters.year)
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = self.db.execute(
            statement.order_by(Attendance.attendance_date.desc()).offset(skip).limit(limit)
        ).all()
        items = [
            AttendanceReportItem(
                employee_id=user.id,
                employee_name=user.full_name,
                department=profile.department if profile else None,
                attendance_date=attendance.attendance_date,
                check_in=attendance.check_in,
                check_out=attendance.check_out,
                working_hours=attendance.working_hours,
                status=attendance.attendance_status.value,
            )
            for attendance, user, profile in rows
        ]
        return AttendanceReportResponse(items=items, total=total, filters=filters)

    def get_leave_report(
        self,
        filters: LeaveReportFilters,
        employee_id: UUID | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> LeaveReportResponse:
        statement = (
            select(LeaveRequest, User, EmployeeProfile)
            .join(User, LeaveRequest.user_id == User.id)
            .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.id)
        )
        target_id = employee_id or filters.employee_id
        if target_id:
            statement = statement.where(LeaveRequest.user_id == target_id)
        if filters.department:
            statement = statement.where(EmployeeProfile.department == filters.department)
        if filters.leave_type:
            statement = statement.where(LeaveRequest.leave_type == filters.leave_type)
        if filters.status:
            statement = statement.where(LeaveRequest.status == filters.status)
        if filters.start_date:
            statement = statement.where(LeaveRequest.end_date >= filters.start_date)
        if filters.end_date:
            statement = statement.where(LeaveRequest.start_date <= filters.end_date)
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = self.db.execute(
            statement.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit)
        ).all()
        items = [
            LeaveReportItem(
                employee_id=user.id,
                employee_name=user.full_name,
                department=profile.department if profile else None,
                leave_type=leave.leave_type.value,
                start_date=leave.start_date,
                end_date=leave.end_date,
                status=leave.status.value,
                days=(leave.end_date - leave.start_date).days + 1,
            )
            for leave, user, profile in rows
        ]
        return LeaveReportResponse(items=items, total=total, filters=filters)

    def get_payroll_report(
        self,
        filters: PayrollReportFilters,
        employee_id: UUID | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> PayrollReportResponse:
        statement = (
            select(Payslip, User, EmployeeProfile)
            .join(User, Payslip.user_id == User.id)
            .outerjoin(EmployeeProfile, EmployeeProfile.user_id == User.id)
        )
        target_id = employee_id or filters.employee_id
        if target_id:
            statement = statement.where(Payslip.user_id == target_id)
        if filters.department:
            statement = statement.where(EmployeeProfile.department == filters.department)
        if filters.month:
            statement = statement.where(Payslip.month == month_name[filters.month])
        if filters.year:
            statement = statement.where(Payslip.year == filters.year)
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = self.db.execute(
            statement.order_by(Payslip.year.desc(), Payslip.created_at.desc()).offset(skip).limit(limit)
        ).all()
        items = [
            PayrollReportItem(
                employee_id=user.id,
                employee_name=user.full_name,
                department=profile.department if profile else None,
                month=payslip.month,
                year=payslip.year,
                basic_salary=payslip.basic_salary,
                bonuses=payslip.bonuses,
                deductions=payslip.deductions,
                tax=payslip.tax,
                net_salary=payslip.net_salary,
            )
            for payslip, user, profile in rows
        ]
        return PayrollReportResponse(items=items, total=total, filters=filters)

    def get_employee_report(
        self, filters: EmployeeReportFilters, skip: int = 0, limit: int = 100
    ) -> EmployeeReportResponse:
        statement = select(User, EmployeeProfile).outerjoin(
            EmployeeProfile, EmployeeProfile.user_id == User.id
        )
        if filters.department:
            statement = statement.where(EmployeeProfile.department == filters.department)
        if filters.designation:
            statement = statement.where(EmployeeProfile.designation == filters.designation)
        if filters.is_active is not None:
            statement = statement.where(User.is_active.is_(filters.is_active))
        total = self.db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = self.db.execute(
            statement.order_by(User.full_name).offset(skip).limit(limit)
        ).all()
        items = [
            EmployeeReportItem(
                employee_id=user.id,
                employee_code=user.employee_id,
                full_name=user.full_name,
                email=user.email,
                department=profile.department if profile else None,
                designation=profile.designation if profile else None,
                joining_date=profile.joining_date if profile else None,
                is_active=user.is_active,
            )
            for user, profile in rows
        ]
        return EmployeeReportResponse(items=items, total=total, filters=filters)

    def get_attendance_analytics(self) -> AttendanceAnalyticsData:
        months = [month_start(date.today(), -offset) for offset in range(11, -1, -1)]
        monthly = [
            {
                "month": value.strftime("%b %Y"),
                "count": self.db.scalar(
                    select(func.count(Attendance.id)).where(
                        Attendance.attendance_date >= value,
                        Attendance.attendance_date < month_start(value, 1),
                    )
                ) or 0,
            }
            for value in months
        ]
        weekly = [
            {
                "day": value.strftime("%a"),
                "count": self.db.scalar(
                    select(func.count(Attendance.id)).where(
                        Attendance.attendance_date == value
                    )
                ) or 0,
            }
            for value in [date.today() - timedelta(days=offset) for offset in range(6, -1, -1)]
        ]
        grouped = self.db.execute(
            select(Attendance.attendance_status, func.count(Attendance.id)).group_by(
                Attendance.attendance_status
            )
        ).all()
        return AttendanceAnalyticsData(
            monthly_attendance=monthly,
            weekly_attendance=weekly,
            status_distribution=[{"status": key.value, "count": count} for key, count in grouped],
        )

    def get_leave_analytics(self) -> LeaveAnalyticsData:
        by_type = self.db.execute(
            select(LeaveRequest.leave_type, func.count(LeaveRequest.id)).group_by(
                LeaveRequest.leave_type
            )
        ).all()
        by_status = self.db.execute(
            select(LeaveRequest.status, func.count(LeaveRequest.id)).group_by(LeaveRequest.status)
        ).all()
        months = [month_start(date.today(), -offset) for offset in range(5, -1, -1)]
        monthly = [
            {
                "month": value.strftime("%b %Y"),
                "count": self.db.scalar(
                    select(func.count(LeaveRequest.id)).where(
                        LeaveRequest.start_date >= value,
                        LeaveRequest.start_date < month_start(value, 1),
                    )
                ) or 0,
            }
            for value in months
        ]
        return LeaveAnalyticsData(
            leave_trends=[{"status": key.value, "count": count} for key, count in by_status],
            leave_type_distribution=[{"type": key.value, "count": count} for key, count in by_type],
            monthly_leave=monthly,
        )

    def get_payroll_analytics(self) -> PayrollAnalyticsData:
        trends = self.db.execute(
            select(Payslip.year, Payslip.month, func.sum(Payslip.net_salary))
            .group_by(Payslip.year, Payslip.month)
            .order_by(Payslip.year, Payslip.month)
        ).all()
        departments = self.db.execute(
            select(EmployeeProfile.department, func.sum(Payslip.net_salary))
            .join(User, Payslip.user_id == User.id)
            .join(EmployeeProfile, EmployeeProfile.user_id == User.id)
            .group_by(EmployeeProfile.department)
        ).all()
        return PayrollAnalyticsData(
            payroll_trends=[{"year": year, "month": month, "total": float(total)} for year, month, total in trends],
            salary_distribution=[],
            department_payroll=[{"department": department or "Unassigned", "total": float(total)} for department, total in departments],
        )

    def get_employee_analytics(self) -> EmployeeAnalyticsData:
        departments = self.db.execute(
            select(EmployeeProfile.department, func.count(EmployeeProfile.id)).group_by(
                EmployeeProfile.department
            )
        ).all()
        months = [month_start(date.today(), -offset) for offset in range(11, -1, -1)]
        growth = [
            {
                "month": value.strftime("%b %Y"),
                "count": self.db.scalar(
                    select(func.count(User.id)).where(User.created_at < month_start(value, 1))
                ) or 0,
            }
            for value in months
        ]
        return EmployeeAnalyticsData(
            department_distribution=[
                {"department": department or "Unassigned", "count": count}
                for department, count in departments
            ],
            employee_growth=growth,
            gender_distribution=[],
        )
