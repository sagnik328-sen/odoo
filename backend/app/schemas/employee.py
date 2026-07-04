from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class EmployeeDocumentResponse(BaseModel):
    id: UUID
    name: str
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class EmployeeProfileResponse(BaseModel):
    id: UUID
    phone: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[UUID] = None
    manager_name: Optional[str] = None
    joining_date: Optional[datetime] = None
    base_salary: float = 0.0
    allowances: float = 0.0
    bonuses: float = 0.0
    deductions: float = 0.0
    tax: float = 0.0
    profile_picture: Optional[str] = None
    documents: List[EmployeeDocumentResponse] = []

    class Config:
        from_attributes = True


class EmployeeDetailResponse(BaseModel):
    id: UUID
    employee_id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    profile: Optional[EmployeeProfileResponse] = None

    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    password: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[UUID] = None
    joining_date: Optional[datetime] = None
    base_salary: float = 0.0
    allowances: float = 0.0
    bonuses: float = 0.0
    deductions: float = 0.0
    tax: float = 0.0


class EmployeeUpdate(BaseModel):
    # Personal details (editable by employee)
    phone: Optional[str] = None
    address: Optional[str] = None

    # Job & Org details (editable by HR/Admin)
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[UUID] = None
    joining_date: Optional[datetime] = None
    base_salary: Optional[float] = None
    allowances: Optional[float] = None
    bonuses: Optional[float] = None
    deductions: Optional[float] = None
    tax: Optional[float] = None


class PaginatedEmployeeResponse(BaseModel):
    items: List[EmployeeDetailResponse]
    total: int
    page: int
    size: int
    pages: int
