# ruff: noqa: B008
from uuid import UUID
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, PermissionChecker
from app.models.user import User
from app.schemas.settings import (
    CompanySettingsResponse, CompanySettingsUpdate,
    LeavePolicySettingsResponse, LeavePolicySettingsUpdate,
    WorkingHoursSettingsResponse, WorkingHoursSettingsUpdate,
    HolidayResponse, HolidayCreate,
    RolePermissionResponse, RolePermissionUpdate
)
from app.services.settings import SettingsService
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/settings", tags=["Settings & Policies"])

# Checkers
manage_settings = PermissionChecker("can_manage_settings")


# Company Settings
@router.get("/company", response_model=CompanySettingsResponse)
def get_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SettingsService(db).get_company_settings()


@router.put("/company", response_model=CompanySettingsResponse)
def update_company(
    payload: CompanySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    return SettingsService(db).update_company_settings(payload)


# Leave Policy Settings
@router.get("/leave-policy", response_model=LeavePolicySettingsResponse)
def get_leave_policy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SettingsService(db).get_leave_policy()


@router.put("/leave-policy", response_model=LeavePolicySettingsResponse)
def update_leave_policy(
    payload: LeavePolicySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    return SettingsService(db).update_leave_policy(payload)


# Working Hours Settings
@router.get("/working-hours", response_model=WorkingHoursSettingsResponse)
def get_working_hours(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SettingsService(db).get_working_hours()


@router.put("/working-hours", response_model=WorkingHoursSettingsResponse)
def update_working_hours(
    payload: WorkingHoursSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    return SettingsService(db).update_working_hours(payload)


# Holiday Calendar
@router.get("/holidays", response_model=list[HolidayResponse])
def list_holidays(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return SettingsService(db).list_holidays()


@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def add_holiday(
    payload: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    return SettingsService(db).add_holiday(payload)


@router.delete("/holidays/{holiday_id}", response_model=MessageResponse)
def remove_holiday(
    holiday_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    SettingsService(db).remove_holiday(holiday_id)
    return MessageResponse(message="Holiday removed successfully")


# Role & Permissions Settings
@router.get("/role-permissions", response_model=list[RolePermissionResponse])
def get_all_role_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    return SettingsService(db).list_role_permissions()


@router.put("/role-permissions/{role}", response_model=RolePermissionResponse)
def update_role_permissions(
    role: str,
    payload: RolePermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manage_settings)
):
    return SettingsService(db).update_role_permissions(role, payload)
