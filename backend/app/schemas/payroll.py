from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

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
    basic_salary: float | None = None
    allowances: float | None = None
    bonuses: float | None = None
    deductions: float | None = None
    tax: float | None = None
    status: PayslipStatus | None = None


class PayslipResponse(PayslipBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    employee_id: str
    employee_name: str
    net_salary: float
    status: PayslipStatus
    created_at: datetime

class PaginatedPayslipResponse(BaseModel):
    items: list[PayslipResponse]
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
