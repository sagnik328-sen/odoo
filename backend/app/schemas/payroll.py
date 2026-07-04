from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel
from app.models.payroll import PayslipStatus


class PayslipBase(BaseModel):
    month: str
    year: int
    basic_salary: float
    allowances: float
    bonuses: float
    deductions: float
    tax: float


class PayslipCreate(PayslipBase):
    user_id: UUID


class PayslipUpdate(BaseModel):
    basic_salary: Optional[float] = None
    allowances: Optional[float] = None
    bonuses: Optional[float] = None
    deductions: Optional[float] = None
    tax: Optional[float] = None
    status: Optional[PayslipStatus] = None


class PayslipResponse(PayslipBase):
    id: UUID
    user_id: UUID
    employee_id: str
    employee_name: str
    net_salary: float
    status: PayslipStatus
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedPayslipResponse(BaseModel):
    items: List[PayslipResponse]
    total: int
    page: int
    size: int
    pages: int


class PayrollStats(BaseModel):
    total_disbursed: float
    total_basic: float
    total_allowances: float
    total_bonuses: float
    total_deductions: float
    total_tax: float
    employee_count: int
