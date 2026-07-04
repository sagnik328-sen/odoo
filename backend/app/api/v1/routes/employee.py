import os
import shutil
import time
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import RoleChecker, get_current_user
from app.database.session import get_db
from app.models.employee import EmployeeDocument, EmployeeProfile
from app.models.user import User, UserRole
from app.repositories.employee import EmployeeRepository
from app.repositories.user import UserRepository
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeDetailResponse,
    EmployeeUpdate,
    PaginatedEmployeeResponse,
)
from app.utils.security import get_password_hash

router = APIRouter()


def get_employee_response(user: User, db: Session) -> User:
    """Helper to ensure a user has an EmployeeProfile and resolve manager name."""
    if not user.profile:
        emp_repo = EmployeeRepository(db)
        profile = EmployeeProfile(user_id=user.id)
        user.profile = emp_repo.create_profile(profile)

    if user.profile and user.profile.manager_id:
        user_repo = UserRepository(db)
        manager = user_repo.get_by_id(user.profile.manager_id)
        if manager:
            user.profile.manager_name = manager.full_name
        else:
            user.profile.manager_name = None
    return user


@router.get("/employees", response_model=PaginatedEmployeeResponse)
def list_employees(
    search: str | None = None,
    department: str | None = None,
    designation: str | None = None,
    role: str | None = None,
    page: int = 1,
    size: int = 10,
    current_user: User = Depends(RoleChecker([UserRole.HR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    emp_repo = EmployeeRepository(db)
    items, total = emp_repo.list_employees(
        search=search,
        department=department,
        designation=designation,
        role=role,
        page=page,
        size=size
    )

    formatted_items = [get_employee_response(item, db) for item in items]
    pages = (total + size - 1) // size if total > 0 else 1

    return PaginatedEmployeeResponse(
        items=formatted_items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/employees/{user_id}", response_model=EmployeeDetailResponse)
def get_employee(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    return get_employee_response(user, db)


@router.post("/employees", response_model=EmployeeDetailResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    current_user: User = Depends(RoleChecker([UserRole.HR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    emp_repo = EmployeeRepository(db)

    if user_repo.get_by_email(employee_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if user_repo.get_by_employee_id(employee_in.employee_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID already registered"
        )

    password = employee_in.password or "Welcome123!"
    hashed_password = get_password_hash(password)

    new_user = User(
        employee_id=employee_in.employee_id,
        full_name=employee_in.full_name,
        email=employee_in.email,
        hashed_password=hashed_password,
        role=employee_in.role,
        is_active=True,
        is_email_verified=True
    )
    created_user = user_repo.create(new_user)

    profile = EmployeeProfile(
        user_id=created_user.id,
        phone=employee_in.phone,
        address=employee_in.address,
        department=employee_in.department,
        designation=employee_in.designation,
        manager_id=employee_in.manager_id,
        joining_date=employee_in.joining_date,
        base_salary=employee_in.base_salary,
        allowances=employee_in.allowances,
        bonuses=employee_in.bonuses,
        deductions=employee_in.deductions,
        tax=employee_in.tax
    )
    emp_repo.create_profile(profile)

    db.refresh(created_user)
    return get_employee_response(created_user, db)


@router.put("/employees/{user_id}", response_model=EmployeeDetailResponse)
def update_employee(
    user_id: UUID,
    employee_in: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_self = current_user.id == user_id
    is_hr_admin = current_user.role in [UserRole.HR, UserRole.ADMIN]

    if not (is_self or is_hr_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user_repo = UserRepository(db)
    emp_repo = EmployeeRepository(db)

    target_user = user_repo.get_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    if is_hr_admin:
        if employee_in.full_name is not None:
            target_user.full_name = employee_in.full_name
        if employee_in.email is not None:
            if employee_in.email != target_user.email:
                existing = user_repo.get_by_email(employee_in.email)
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
                target_user.email = employee_in.email
        if employee_in.role is not None:
            target_user.role = employee_in.role
        user_repo.update(target_user)

    profile = emp_repo.get_profile_by_user_id(user_id)
    if not profile:
        profile = EmployeeProfile(user_id=user_id)
        profile = emp_repo.create_profile(profile)

    if employee_in.phone is not None:
        profile.phone = employee_in.phone
    if employee_in.address is not None:
        profile.address = employee_in.address

    if is_hr_admin:
        if employee_in.department is not None:
            profile.department = employee_in.department
        if employee_in.designation is not None:
            profile.designation = employee_in.designation
        if employee_in.manager_id is not None:
            profile.manager_id = employee_in.manager_id
        if employee_in.joining_date is not None:
            profile.joining_date = employee_in.joining_date
        if employee_in.base_salary is not None:
            profile.base_salary = employee_in.base_salary
        if employee_in.allowances is not None:
            profile.allowances = employee_in.allowances
        if employee_in.bonuses is not None:
            profile.bonuses = employee_in.bonuses
        if employee_in.deductions is not None:
            profile.deductions = employee_in.deductions
        if employee_in.tax is not None:
            profile.tax = employee_in.tax

    emp_repo.update_profile(profile)

    db.refresh(target_user)
    return get_employee_response(target_user, db)


@router.delete("/employees/{user_id}", status_code=status.HTTP_200_OK)
def delete_employee(
    user_id: UUID,
    current_user: User = Depends(RoleChecker([UserRole.HR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )

    emp_repo = EmployeeRepository(db)
    profile = emp_repo.get_profile_by_user_id(user_id)
    if profile:
        if profile.profile_picture:
            local_pic = profile.profile_picture.lstrip("/")
            if os.path.exists(local_pic):
                try:
                    os.remove(local_pic)
                except Exception:
                    pass
        for doc in profile.documents:
            local_doc = doc.file_path.lstrip("/")
            if os.path.exists(local_doc):
                try:
                    os.remove(local_doc)
                except Exception:
                    pass

    db.delete(user)
    db.commit()

    return {"message": "Employee deleted successfully"}


@router.post("/employees/{user_id}/upload-avatar")
def upload_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user_repo = UserRepository(db)
    emp_repo = EmployeeRepository(db)

    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    profile = emp_repo.get_profile_by_user_id(user_id)
    if not profile:
        profile = EmployeeProfile(user_id=user_id)
        profile = emp_repo.create_profile(profile)

    os.makedirs("uploads", exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    filename = f"avatar_{user_id}_{int(time.time())}{file_ext}"
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    profile.profile_picture = f"/uploads/{filename}"
    emp_repo.update_profile(profile)

    return {"message": "Avatar uploaded successfully", "profile_picture": profile.profile_picture}


@router.post("/employees/{user_id}/upload-document")
def upload_document(
    user_id: UUID,
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    user_repo = UserRepository(db)
    emp_repo = EmployeeRepository(db)

    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    profile = emp_repo.get_profile_by_user_id(user_id)
    if not profile:
        profile = EmployeeProfile(user_id=user_id)
        profile = emp_repo.create_profile(profile)

    os.makedirs("uploads", exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    filename = f"doc_{user_id}_{int(time.time())}{file_ext}"
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = EmployeeDocument(
        profile_id=profile.id,
        name=name,
        file_path=f"/uploads/{filename}"
    )
    emp_repo.create_document(doc)

    return {
        "message": "Document uploaded successfully",
        "document_id": doc.id,
        "name": doc.name,
        "file_path": doc.file_path,
        "uploaded_at": doc.uploaded_at
    }


@router.delete("/employees/{user_id}/documents/{document_id}")
def delete_document(
    user_id: UUID,
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    emp_repo = EmployeeRepository(db)
    doc = emp_repo.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    profile = emp_repo.get_profile_by_user_id(user_id)
    if not profile or doc.profile_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document does not belong to this employee"
        )

    local_path = doc.file_path.lstrip("/")
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception:
            pass

    emp_repo.delete_document(doc)

    return {"message": "Document deleted successfully"}
