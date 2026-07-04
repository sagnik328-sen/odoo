from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    total_employees: int = Field(description="Total number of user accounts")
    active_employees: int = Field(description="Number of active users")
    present_today: int = Field(description="Employees present or half-day today")
    absent_today: int = Field(description="Employees absent today")
    on_leave_today: int = Field(description="Employees on approved leave today")
    total_payroll_current_month: float = Field(description="Current-month net payroll")
    average_attendance_percentage: float = Field(description="Present share of attendance")
    pending_leave_requests: int = Field(description="Pending leave requests")


class AttendanceReportFilters(BaseModel):
    employee_id: UUID | None = None
    department: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    month: int | None = None
    year: int | None = None


class AttendanceReportItem(BaseModel):
    employee_id: UUID
    employee_name: str
    department: str | None
    attendance_date: date
    check_in: datetime | None
    check_out: datetime | None
    working_hours: float
    status: str


class AttendanceReportResponse(BaseModel):
    items: list[AttendanceReportItem]
    total: int
    filters: AttendanceReportFilters


class LeaveReportFilters(BaseModel):
    employee_id: UUID | None = None
    leave_type: str | None = None
    department: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class LeaveReportItem(BaseModel):
    employee_id: UUID
    employee_name: str
    department: str | None
    leave_type: str
    start_date: date
    end_date: date
    status: str
    days: int


class LeaveReportResponse(BaseModel):
    items: list[LeaveReportItem]
    total: int
    filters: LeaveReportFilters


class PayrollReportFilters(BaseModel):
    employee_id: UUID | None = None
    department: str | None = None
    month: int | None = None
    year: int | None = None


class PayrollReportItem(BaseModel):
    employee_id: UUID
    employee_name: str
    department: str | None
    month: str
    year: int
    basic_salary: float
    bonuses: float
    deductions: float
    tax: float
    net_salary: float


class PayrollReportResponse(BaseModel):
    items: list[PayrollReportItem]
    total: int
    filters: PayrollReportFilters


class EmployeeReportFilters(BaseModel):
    department: str | None = None
    designation: str | None = None
    is_active: bool | None = None


class EmployeeReportItem(BaseModel):
    employee_id: UUID
    employee_code: str
    full_name: str
    email: str
    department: str | None
    designation: str | None
    joining_date: datetime | None
    is_active: bool


class EmployeeReportResponse(BaseModel):
    items: list[EmployeeReportItem]
    total: int
    filters: EmployeeReportFilters


class AttendanceAnalyticsData(BaseModel):
    monthly_attendance: list[dict[str, Any]]
    weekly_attendance: list[dict[str, Any]]
    status_distribution: list[dict[str, Any]]


class LeaveAnalyticsData(BaseModel):
    leave_trends: list[dict[str, Any]]
    leave_type_distribution: list[dict[str, Any]]
    monthly_leave: list[dict[str, Any]]


class PayrollAnalyticsData(BaseModel):
    payroll_trends: list[dict[str, Any]]
    salary_distribution: list[dict[str, Any]]
    department_payroll: list[dict[str, Any]]


class EmployeeAnalyticsData(BaseModel):
    department_distribution: list[dict[str, Any]]
    employee_growth: list[dict[str, Any]]
    gender_distribution: list[dict[str, Any]]
