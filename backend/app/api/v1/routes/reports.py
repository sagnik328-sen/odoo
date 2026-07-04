from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User
from app.schemas.reports import (
    DashboardSummary,
    AttendanceReportFilters,
    AttendanceReportResponse,
    LeaveReportFilters,
    LeaveReportResponse,
    PayrollReportFilters,
    PayrollReportResponse,
    EmployeeReportFilters,
    EmployeeReportResponse,
    AttendanceAnalyticsData,
    LeaveAnalyticsData,
    PayrollAnalyticsData,
    EmployeeAnalyticsData,
)
from app.services.reports import ReportsService
from app.utils.exports.csv import export_to_csv
from app.utils.exports.excel import export_to_excel
from app.utils.exports.pdf import export_to_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_reports_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportsService(db)
    return service.get_dashboard_summary()


@router.get("/attendance", response_model=AttendanceReportResponse)
def get_attendance_report(
    employee_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportsService(db)
    filters = AttendanceReportFilters(
        employee_id=employee_id,
        department=department,
        status=status,
        start_date=start_date,
        end_date=end_date,
        month=month,
        year=year,
    )
    
    # Employees can only access their own reports
    user_employee_id = current_user.id if current_user.role == "employee" else None
    
    return service.get_attendance_report(
        filters=filters,
        employee_id=user_employee_id,
        skip=skip,
        limit=limit,
    )


@router.get("/leave", response_model=LeaveReportResponse)
def get_leave_report(
    employee_id: Optional[int] = Query(None),
    leave_type: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportsService(db)
    filters = LeaveReportFilters(
        employee_id=employee_id,
        leave_type=leave_type,
        department=department,
        status=status,
        start_date=start_date,
        end_date=end_date,
    )
    
    # Employees can only access their own reports
    user_employee_id = current_user.id if current_user.role == "employee" else None
    
    return service.get_leave_report(
        filters=filters,
        employee_id=user_employee_id,
        skip=skip,
        limit=limit,
    )


@router.get("/payroll", response_model=PayrollReportResponse)
def get_payroll_report(
    employee_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportsService(db)
    filters = PayrollReportFilters(
        employee_id=employee_id,
        department=department,
        month=month,
        year=year,
    )
    
    # Employees can only access their own reports
    user_employee_id = current_user.id if current_user.role == "employee" else None
    
    return service.get_payroll_report(
        filters=filters,
        employee_id=user_employee_id,
        skip=skip,
        limit=limit,
    )


@router.get("/employees", response_model=EmployeeReportResponse)
def get_employee_report(
    department: Optional[str] = Query(None),
    designation: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    service = ReportsService(db)
    filters = EmployeeReportFilters(
        department=department,
        designation=designation,
        is_active=is_active,
    )
    
    return service.get_employee_report(
        filters=filters,
        skip=skip,
        limit=limit,
    )


# Analytics endpoints
@router.get("/analytics/attendance", response_model=AttendanceAnalyticsData)
def get_attendance_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    service = ReportsService(db)
    return service.get_attendance_analytics()


@router.get("/analytics/leave", response_model=LeaveAnalyticsData)
def get_leave_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    service = ReportsService(db)
    return service.get_leave_analytics()


@router.get("/analytics/payroll", response_model=PayrollAnalyticsData)
def get_payroll_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    service = ReportsService(db)
    return service.get_payroll_analytics()


@router.get("/analytics/employees", response_model=EmployeeAnalyticsData)
def get_employee_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    service = ReportsService(db)
    return service.get_employee_analytics()


# Export endpoints
@router.get("/export/attendance/{format}")
def export_attendance_report(
    format: str,
    employee_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2030),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    if format not in ["csv", "excel", "pdf"]:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats: csv, excel, pdf")
    
    service = ReportsService(db)
    filters = AttendanceReportFilters(
        employee_id=employee_id,
        department=department,
        status=status,
        start_date=start_date,
        end_date=end_date,
        month=month,
        year=year,
    )
    
    report = service.get_attendance_report(filters=filters, skip=0, limit=10000)
    data = [item.dict() for item in report.items]
    
    report_title = "Attendance Report"
    generated_by = current_user.full_name
    filters_dict = filters.dict(exclude_none=True)
    
    if format == "csv":
        output = export_to_csv(data, report_title, generated_by, filters_dict)
        media_type = "text/csv"
        filename = "attendance_report.csv"
    elif format == "excel":
        output = export_to_excel(data, report_title, generated_by, filters_dict)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "attendance_report.xlsx"
    else:  # pdf
        output = export_to_pdf(data, report_title, generated_by, filters_dict)
        media_type = "application/pdf"
        filename = "attendance_report.pdf"
    
    return StreamingResponse(
        output,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/leave/{format}")
def export_leave_report(
    format: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    # Placeholder for leave export
    raise HTTPException(status_code=501, detail="Leave reports export not implemented yet")


@router.get("/export/payroll/{format}")
def export_payroll_report(
    format: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    # Placeholder for payroll export
    raise HTTPException(status_code=501, detail="Payroll reports export not implemented yet")


@router.get("/export/employees/{format}")
def export_employee_report(
    format: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["hr", "admin"])),
):
    if format not in ["csv", "excel", "pdf"]:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats: csv, excel, pdf")
    
    service = ReportsService(db)
    report = service.get_employee_report(filters=EmployeeReportFilters(), skip=0, limit=10000)
    data = [item.dict() for item in report.items]
    
    report_title = "Employee Report"
    generated_by = current_user.full_name
    
    if format == "csv":
        output = export_to_csv(data, report_title, generated_by)
        media_type = "text/csv"
        filename = "employee_report.csv"
    elif format == "excel":
        output = export_to_excel(data, report_title, generated_by)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "employee_report.xlsx"
    else:  # pdf
        output = export_to_pdf(data, report_title, generated_by)
        media_type = "application/pdf"
        filename = "employee_report.pdf"
    
    return StreamingResponse(
        output,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
