from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class EmployeeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    file_path: str
    uploaded_at: datetime

class EmployeeProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str | None = None
    address: str | None = None
    department: str | None = None
    designation: str | None = None
    manager_id: UUID | None = None
    manager_name: str | None = None
    hr_id: UUID | None = None
    hr_name: str | None = None
    joining_date: datetime | None = None
    base_salary: float = 0.0
    allowances: float = 0.0
    bonuses: float = 0.0
    deductions: float = 0.0
    tax: float = 0.0
    profile_picture: str | None = None
    documents: list[EmployeeDocumentResponse] = []

class EmployeeDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    employee_id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    profile: EmployeeProfileResponse | None = None

class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    password: str | None = None
    phone: str | None = None
    address: str | None = None
    department: str | None = None
    designation: str | None = None
    manager_id: UUID | None = None
    hr_id: UUID | None = None
    joining_date: datetime | None = None
    base_salary: float = 0.0
    allowances: float = 0.0
    bonuses: float = 0.0
    deductions: float = 0.0
    tax: float = 0.0


class EmployeeUpdate(BaseModel):
    # Personal details (editable by employee)
    phone: str | None = None
    address: str | None = None

    # Job & Org details (editable by HR/Admin)
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    department: str | None = None
    designation: str | None = None
    manager_id: UUID | None = None
    hr_id: UUID | None = None
    joining_date: datetime | None = None
    base_salary: float | None = None
    allowances: float | None = None
    bonuses: float | None = None
    deductions: float | None = None
    tax: float | None = None


class PaginatedEmployeeResponse(BaseModel):
    items: list[EmployeeDetailResponse]
    total: int
    page: int
    size: int
    pages: int
