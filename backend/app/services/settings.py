from uuid import UUID
from datetime import date
from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.settings import SettingsRepository
from app.models.settings import CompanySettings, LeavePolicySettings, WorkingHoursSettings, Holiday, RolePermission
from app.schemas.settings import HolidayCreate


class SettingsService:
    def __init__(self, db: Session):
        self.repo = SettingsRepository(db)

    # Company Settings
    def get_company_settings(self) -> CompanySettings:
        return self.repo.get_company_settings()

    def update_company_settings(self, settings_in) -> CompanySettings:
        return self.repo.update_company_settings(settings_in)

    # Leave Policy
    def get_leave_policy(self) -> LeavePolicySettings:
        return self.repo.get_leave_policy()

    def update_leave_policy(self, policy_in) -> LeavePolicySettings:
        return self.repo.update_leave_policy(policy_in)

    # Working Hours
    def get_working_hours(self) -> WorkingHoursSettings:
        return self.repo.get_working_hours()

    def update_working_hours(self, hours_in) -> WorkingHoursSettings:
        return self.repo.update_working_hours(hours_in)

    # Holidays
    def list_holidays(self) -> Sequence[Holiday]:
        return self.repo.list_holidays()

    def add_holiday(self, holiday_in: HolidayCreate) -> Holiday:
        existing = self.repo.get_holiday_by_date(holiday_in.date)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A holiday is already configured for this date."
            )
        return self.repo.create_holiday(holiday_in.name, holiday_in.date)

    def remove_holiday(self, holiday_id: UUID) -> None:
        holiday = self.repo.get_holiday_by_id(holiday_id)
        if not holiday:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Holiday not found."
            )
        self.repo.delete_holiday(holiday)

    # Role Permissions
    def list_role_permissions(self) -> Sequence[RolePermission]:
        return self.repo.list_role_permissions()

    def get_role_permissions(self, role: str) -> RolePermission:
        return self.repo.get_role_permissions(role)

    def update_role_permissions(self, role: str, perm_in) -> RolePermission:
        return self.repo.update_role_permissions(role, perm_in)
