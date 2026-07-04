from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.user import User
from app.models.attendance import Attendance
from app.schemas.reports import (
    DashboardSummary,
    AttendanceReportFilters,
    AttendanceReportItem,
    AttendanceReportResponse,
    LeaveReportFilters,
    LeaveReportItem,
    LeaveReportResponse,
    PayrollReportFilters,
    PayrollReportItem,
    PayrollReportResponse,
    EmployeeReportFilters,
    EmployeeReportItem,
    EmployeeReportResponse,
    AttendanceAnalyticsData,
    LeaveAnalyticsData,
    PayrollAnalyticsData,
    EmployeeAnalyticsData,
)


class ReportsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> DashboardSummary:
        today = date.today()
        
        # Total employees
        total_employees = self.db.query(func.count(User.id)).filter(User.role.in_(["employee", "hr", "admin"])).scalar() or 0
        
        # Active employees (all are active for now)
        active_employees = total_employees
        
        # Present today
        present_today = self.db.query(func.count(Attendance.id)).filter(
            and_(
                Attendance.attendance_date == today,
                Attendance.status.in_(["present", "half_day"])
            )
        ).scalar() or 0
        
        # Absent today
        absent_today = self.db.query(func.count(Attendance.id)).filter(
            and_(
                Attendance.attendance_date == today,
                Attendance.status == "absent"
            )
        ).scalar() or 0
        
        # On leave today (placeholder)
        on_leave_today = 0
        
        # Total payroll current month (placeholder)
        total_payroll_current_month = 0.0
        
        # Average attendance percentage (placeholder)
        average_attendance_percentage = 85.0
        
        # Pending leave requests (placeholder)
        pending_leave_requests = 0
        
        return DashboardSummary(
            total_employees=total_employees,
            active_employees=active_employees,
            present_today=present_today,
            absent_today=absent_today,
            on_leave_today=on_leave_today,
            total_payroll_current_month=total_payroll_current_month,
            average_attendance_percentage=average_attendance_percentage,
            pending_leave_requests=pending_leave_requests,
        )

    def get_attendance_report(
        self,
        filters: AttendanceReportFilters,
        employee_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> AttendanceReportResponse:
        query = self.db.query(Attendance, User).join(User, Attendance.employee_id == User.id)
        
        # Apply filters
        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        if filters.employee_id:
            query = query.filter(Attendance.employee_id == filters.employee_id)
        if filters.department:
            query = query.filter(User.department == filters.department)
        if filters.status:
            query = query.filter(Attendance.status == filters.status)
        if filters.start_date:
            query = query.filter(Attendance.attendance_date >= filters.start_date)
        if filters.end_date:
            query = query.filter(Attendance.attendance_date <= filters.end_date)
        if filters.month and filters.year:
            query = query.filter(
                and_(
                    func.strftime("%Y", Attendance.attendance_date) == str(filters.year),
                    func.strftime("%m", Attendance.attendance_date) == str(filters.month).zfill(2),
                )
            )
        
        # Get total count
        total = query.count()
        
        # Get paginated items
        results = query.offset(skip).limit(limit).all()
        
        items = []
        for attendance, user in results:
            items.append(AttendanceReportItem(
                employee_id=user.id,
                employee_name=user.full_name,
                department=getattr(user, "department", None),
                attendance_date=attendance.attendance_date,
                check_in=attendance.check_in,
                check_out=attendance.check_out,
                working_hours=attendance.working_hours,
                status=attendance.status,
            ))
        
        return AttendanceReportResponse(
            items=items,
            total=total,
            filters=filters,
        )

    def get_leave_report(
        self,
        filters: LeaveReportFilters,
        employee_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> LeaveReportResponse:
        # Placeholder for leave reports (requires leave table)
        return LeaveReportResponse(
            items=[],
            total=0,
            filters=filters,
        )

    def get_payroll_report(
        self,
        filters: PayrollReportFilters,
        employee_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> PayrollReportResponse:
        # Placeholder for payroll reports (requires payroll table)
        return PayrollReportResponse(
            items=[],
            total=0,
            filters=filters,
        )

    def get_employee_report(
        self,
        filters: EmployeeReportFilters,
        skip: int = 0,
        limit: int = 100,
    ) -> EmployeeReportResponse:
        query = self.db.query(User).filter(User.role.in_(["employee", "hr", "admin"]))
        
        # Apply filters
        if filters.department:
            query = query.filter(User.department == filters.department)
        if filters.designation:
            query = query.filter(User.designation == filters.designation)
        if filters.is_active is not None:
            # Placeholder for is_active field
            pass
        
        # Get total count
        total = query.count()
        
        # Get paginated items
        users = query.offset(skip).limit(limit).all()
        
        items = []
        for user in users:
            items.append(EmployeeReportItem(
                employee_id=user.id,
                full_name=user.full_name,
                email=user.email,
                department=getattr(user, "department", None),
                designation=getattr(user, "designation", None),
                joining_date=getattr(user, "joining_date", None),
                is_active=True,
            ))
        
        return EmployeeReportResponse(
            items=items,
            total=total,
            filters=filters,
        )

    def get_attendance_analytics(self) -> AttendanceAnalyticsData:
        # Monthly attendance (last 12 months)
        monthly_attendance = []
        for i in range(11, -1, -1):
            month_date = date.today().replace(day=1) - timedelta(days=30 * i)
            month_str = month_date.strftime("%b %Y")
            count = self.db.query(func.count(Attendance.id)).filter(
                and_(
                    func.strftime("%Y", Attendance.attendance_date) == str(month_date.year),
                    func.strftime("%m", Attendance.attendance_date) == str(month_date.month).zfill(2),
                )
            ).scalar() or 0
            monthly_attendance.append({"month": month_str, "count": count})
        
        # Weekly attendance (last 7 days)
        weekly_attendance = []
        for i in range(6, -1, -1):
            day_date = date.today() - timedelta(days=i)
            day_str = day_date.strftime("%a")
            count = self.db.query(func.count(Attendance.id)).filter(
                Attendance.attendance_date == day_date
            ).scalar() or 0
            weekly_attendance.append({"day": day_str, "count": count})
        
        # Status distribution
        status_distribution = []
        statuses = ["present", "absent", "half_day", "leave", "holiday"]
        for status in statuses:
            count = self.db.query(func.count(Attendance.id)).filter(
                Attendance.status == status
            ).scalar() or 0
            status_distribution.append({"status": status, "count": count})
        
        return AttendanceAnalyticsData(
            monthly_attendance=monthly_attendance,
            weekly_attendance=weekly_attendance,
            status_distribution=status_distribution,
        )

    def get_leave_analytics(self) -> LeaveAnalyticsData:
        # Placeholder for leave analytics
        return LeaveAnalyticsData(
            leave_trends=[],
            leave_type_distribution=[],
            monthly_leave=[],
        )

    def get_payroll_analytics(self) -> PayrollAnalyticsData:
        # Placeholder for payroll analytics
        return PayrollAnalyticsData(
            payroll_trends=[],
            salary_distribution=[],
            department_payroll=[],
        )

    def get_employee_analytics(self) -> EmployeeAnalyticsData:
        # Department distribution
        department_distribution = []
        departments = self.db.query(User.department).filter(
            and_(
                User.role.in_(["employee", "hr", "admin"]),
                User.department.isnot(None)
            )
        ).group_by(User.department).all()
        for (dept,) in departments:
            count = self.db.query(func.count(User.id)).filter(
                User.department == dept
            ).scalar() or 0
            department_distribution.append({"department": dept, "count": count})
        
        # Employee growth (last 12 months)
        employee_growth = []
        for i in range(11, -1, -1):
            month_date = date.today().replace(day=1) - timedelta(days=30 * i)
            month_str = month_date.strftime("%b %Y")
            count = self.db.query(func.count(User.id)).filter(
                and_(
                    User.role.in_(["employee", "hr", "admin"]),
                    User.created_at <= month_date + timedelta(days=30),
                )
            ).scalar() or 0
            employee_growth.append({"month": month_str, "count": count})
        
        # Gender distribution (placeholder)
        gender_distribution = [
            {"gender": "Male", "count": 0},
            {"gender": "Female", "count": 0},
        ]
        
        return EmployeeAnalyticsData(
            department_distribution=department_distribution,
            employee_growth=employee_growth,
            gender_distribution=gender_distribution,
        )
