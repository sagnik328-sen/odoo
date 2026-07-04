from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    total_employees: int = Field(..., description="Total number of employees")
    active_employees: int = Field(..., description="Number of active employees")
    present_today: int = Field(..., description="Number of employees present today")
    absent_today: int = Field(..., description="Number of employees absent today")
    on_leave_today: int = Field(..., description="Number of employees on leave today")
    total_payroll_current_month: float = Field(..., description="Total payroll for current month")
    average_attendance_percentage: float = Field(..., description="Average attendance percentage")
    pending_leave_requests: int = Field(..., description="Number of pending leave requests")


class AttendanceReportFilters(BaseModel):
    employee_id: Optional[int] = None
    department: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    month: Optional[int] = None
    year: Optional[int] = None


class AttendanceReportItem(BaseModel):
    employee_id: int
    employee_name: str
    department: Optional[str]
    attendance_date: date
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    working_hours: Optional[float]
    status: str


class AttendanceReportResponse(BaseModel):
    items: List[AttendanceReportItem]
    total: int
    filters: AttendanceReportFilters


class LeaveReportFilters(BaseModel):
    employee_id: Optional[int] = None
    leave_type: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class LeaveReportItem(BaseModel):
    employee_id: int
    employee_name: str
    department: Optional[str]
    leave_type: str
    start_date: date
    end_date: date
    status: str
    days: float


class LeaveReportResponse(BaseModel):
    items: List[LeaveReportItem]
    total: int
    filters: LeaveReportFilters


class PayrollReportFilters(BaseModel):
    employee_id: Optional[int] = None
    department: Optional[str] = None
    month: Optional[int] = None
    year: Optional[int] = None


class PayrollReportItem(BaseModel):
    employee_id: int
    employee_name: str
    department: Optional[str]
    month: int
    year: int
    basic_salary: float
    bonuses: float
    deductions: float
    tax: float
    net_salary: float


class PayrollReportResponse(BaseModel):
    items: List[PayrollReportItem]
    total: int
    filters: PayrollReportFilters


class EmployeeReportFilters(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeReportItem(BaseModel):
    employee_id: int
    full_name: str
    email: str
    department: Optional[str]
    designation: Optional[str]
    joining_date: Optional[date]
    is_active: bool


class EmployeeReportResponse(BaseModel):
    items: List[EmployeeReportItem]
    total: int
    filters: EmployeeReportFilters


class AttendanceAnalyticsData(BaseModel):
    monthly_attendance: List[Dict[str, Any]]
    weekly_attendance: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]


class LeaveAnalyticsData(BaseModel):
    leave_trends: List[Dict[str, Any]]
    leave_type_distribution: List[Dict[str, Any]]
    monthly_leave: List[Dict[str, Any]]


class PayrollAnalyticsData(BaseModel):
    payroll_trends: List[Dict[str, Any]]
    salary_distribution: List[Dict[str, Any]]
    department_payroll: List[Dict[str, Any]]


class EmployeeAnalyticsData(BaseModel):
    department_distribution: List[Dict[str, Any]]
    employee_growth: List[Dict[str, Any]]
    gender_distribution: List[Dict[str, Any]]
