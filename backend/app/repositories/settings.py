from uuid import UUID
from datetime import date
from typing import Optional, Sequence
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.settings import CompanySettings, LeavePolicySettings, WorkingHoursSettings, Holiday, RolePermission
from app.models.user import UserRole


class SettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    # Company Settings
    def get_company_settings(self) -> CompanySettings:
        result = self.db.execute(select(CompanySettings).where(CompanySettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            settings = CompanySettings(id=1, company_name="PeopleFlow Inc.")
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def update_company_settings(self, settings_in) -> CompanySettings:
        settings = self.get_company_settings()
        for field, value in settings_in.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings

    # Leave Policy
    def get_leave_policy(self) -> LeavePolicySettings:
        result = self.db.execute(select(LeavePolicySettings).where(LeavePolicySettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            settings = LeavePolicySettings(
                id=1,
                annual_allowance=25,
                max_consecutive_days=14,
                approval_required=True,
                carry_over_days=5
            )
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def update_leave_policy(self, policy_in) -> LeavePolicySettings:
        settings = self.get_leave_policy()
        for field, value in policy_in.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings

    # Working Hours
    def get_working_hours(self) -> WorkingHoursSettings:
        result = self.db.execute(select(WorkingHoursSettings).where(WorkingHoursSettings.id == 1))
        settings = result.scalar_one_or_none()
        if not settings:
            settings = WorkingHoursSettings(
                id=1,
                start_time="09:00",
                end_time="17:00",
                work_days="Monday,Tuesday,Wednesday,Thursday,Friday"
            )
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings

    def update_working_hours(self, hours_in) -> WorkingHoursSettings:
        settings = self.get_working_hours()
        for field, value in hours_in.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)
        self.db.commit()
        self.db.refresh(settings)
        return settings

    # Holidays
    def list_holidays(self) -> Sequence[Holiday]:
        result = self.db.execute(select(Holiday).order_by(Holiday.date))
        return result.scalars().all()

    def get_holiday_by_id(self, holiday_id: UUID) -> Optional[Holiday]:
        result = self.db.execute(select(Holiday).where(Holiday.id == holiday_id))
        return result.scalar_one_or_none()

    def get_holiday_by_date(self, holiday_date: date) -> Optional[Holiday]:
        result = self.db.execute(select(Holiday).where(Holiday.date == holiday_date))
        return result.scalar_one_or_none()

    def create_holiday(self, name: str, holiday_date: date) -> Holiday:
        holiday = Holiday(name=name, date=holiday_date)
        self.db.add(holiday)
        self.db.commit()
        self.db.refresh(holiday)
        return holiday

    def delete_holiday(self, holiday: Holiday) -> None:
        self.db.delete(holiday)
        self.db.commit()

    # Role Permissions
    def list_role_permissions(self) -> Sequence[RolePermission]:
        # Ensure default permissions are seeded
        self.seed_default_role_permissions()
        result = self.db.execute(select(RolePermission))
        return result.scalars().all()

    def get_role_permissions(self, role: str) -> RolePermission:
        self.seed_default_role_permissions()
        result = self.db.execute(select(RolePermission).where(RolePermission.role == role))
        perm = result.scalar_one_or_none()
        if not perm:
            # Fallback if somehow not found
            perm = RolePermission(
                role=role,
                can_manage_employees=False,
                can_manage_leave=False,
                can_manage_payroll=False,
                can_view_reports=False,
                can_manage_settings=False
            )
            self.db.add(perm)
            self.db.commit()
            self.db.refresh(perm)
        return perm

    def update_role_permissions(self, role: str, perm_in) -> RolePermission:
        perm = self.get_role_permissions(role)
        for field, value in perm_in.model_dump(exclude_unset=True).items():
            setattr(perm, field, value)
        self.db.commit()
        self.db.refresh(perm)
        return perm

    def seed_default_role_permissions(self) -> None:
        roles_to_seed = {
            UserRole.ADMIN.value: {
                "can_manage_employees": True,
                "can_manage_leave": True,
                "can_manage_payroll": True,
                "can_view_reports": True,
                "can_manage_settings": True
            },
            UserRole.HR.value: {
                "can_manage_employees": True,
                "can_manage_leave": True,
                "can_manage_payroll": True,
                "can_view_reports": True,
                "can_manage_settings": False
            },
            UserRole.EMPLOYEE.value: {
                "can_manage_employees": False,
                "can_manage_leave": False,
                "can_manage_payroll": False,
                "can_view_reports": False,
                "can_manage_settings": False
            }
        }
        modified = False
        for role_name, perms in roles_to_seed.items():
            result = self.db.execute(select(RolePermission).where(RolePermission.role == role_name))
            if not result.scalar_one_or_none():
                db_perm = RolePermission(role=role_name, **perms)
                self.db.add(db_perm)
                modified = True
        if modified:
            self.db.commit()
