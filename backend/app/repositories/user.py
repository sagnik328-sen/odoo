from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[User]:
        result = self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    def get_by_employee_id(self, employee_id: str) -> Optional[User]:
        result = self.db.execute(select(User).where(User.employee_id == employee_id))
        return result.scalar_one_or_none()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user
