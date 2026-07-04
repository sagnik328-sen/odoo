# ruff: noqa: B008

from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, Response, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import RoleChecker, get_current_user
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.payroll import Payslip
from app.schemas.payroll import (
    PayslipCreate, PayslipUpdate, PayslipResponse, PaginatedPayslipResponse, PayrollStats
)
from app.services.payroll import PayrollService

router = APIRouter(tags=["Payroll Management"])
admin_hr = RoleChecker([UserRole.ADMIN, UserRole.HR])


def map_payslip_to_response(p: Payslip) -> PayslipResponse:
    return PayslipResponse(
        id=p.id,
        user_id=p.user_id,
        employee_id=p.user.employee_id if p.user else "N/A",
        employee_name=p.user.full_name if p.user else "N/A",
        month=p.month,
        year=p.year,
        basic_salary=p.basic_salary,
        allowances=p.allowances,
        bonuses=p.bonuses,
        deductions=p.deductions,
        tax=p.tax,
        net_salary=p.net_salary,
        status=p.status,
        created_at=p.created_at
    )


@router.post("/payroll/generate", response_model=PayslipResponse, status_code=status.HTTP_201_CREATED)
def generate_payslip(
    payload: PayslipCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_hr)
):
    service = PayrollService(db)
    payslip = service.generate_payslip(
        user_id=payload.user_id,
        month=payload.month,
        year=payload.year,
        basic_salary=payload.basic_salary,
        allowances=payload.allowances,
        bonuses=payload.bonuses,
        deductions=payload.deductions,
        tax=payload.tax
    )
    return map_payslip_to_response(payslip)


@router.get("/payroll/me", response_model=PaginatedPayslipResponse)
def get_my_payslips(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = PayrollService(db)
    items, total = service.list_payslips(user_id=current_user.id, page=page, size=size)
    
    formatted_items = [map_payslip_to_response(item) for item in items]
    pages = (total + size - 1) // size if total > 0 else 1
    
    return PaginatedPayslipResponse(
        items=formatted_items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/payroll/history", response_model=PaginatedPayslipResponse)
def get_payroll_history(
    user_id: UUID | None = None,
    month: str | None = None,
    year: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(admin_hr)
):
    service = PayrollService(db)
    items, total = service.list_payslips(user_id=user_id, month=month, year=year, page=page, size=size)
    
    formatted_items = [map_payslip_to_response(item) for item in items]
    pages = (total + size - 1) // size if total > 0 else 1
    
    return PaginatedPayslipResponse(
        items=formatted_items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/payroll/stats", response_model=PayrollStats)
def get_payroll_stats(
    db: Session = Depends(get_db),
    _: User = Depends(admin_hr)
):
    service = PayrollService(db)
    return PayrollStats(**service.get_stats())


@router.get("/payroll/{payslip_id}/pdf")
def get_payslip_pdf(
    payslip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = PayrollService(db)
    payslip = service.get_payslip(payslip_id)
    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payslip not found"
        )
        
    # Check permissions (Self or HR/Admin)
    if current_user.id != payslip.user_id and current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this payslip PDF"
        )
        
    pdf_bytes = service.generate_payslip_pdf(payslip)
    
    filename = f"payslip_{payslip.month.lower()}_{payslip.year}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.put("/payroll/{payslip_id}", response_model=PayslipResponse)
def update_payslip(
    payslip_id: UUID,
    payload: PayslipUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_hr)
):
    service = PayrollService(db)
    payslip = service.update_payslip(
        payslip_id=payslip_id,
        basic_salary=payload.basic_salary,
        allowances=payload.allowances,
        bonuses=payload.bonuses,
        deductions=payload.deductions,
        tax=payload.tax,
        status_val=payload.status
    )
    return map_payslip_to_response(payslip)


@router.delete("/payroll/{payslip_id}", status_code=status.HTTP_200_OK)
def delete_payslip(
    payslip_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(admin_hr)
):
    service = PayrollService(db)
    service.delete_payslip(payslip_id)
    return {"message": "Payslip record deleted successfully"}
