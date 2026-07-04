from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.employee import EmployeeDocument, EmployeeProfile
from app.models.user import User


class EmployeeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_profile_by_user_id(self, user_id: UUID) -> EmployeeProfile | None:
        result = self.db.execute(
            select(EmployeeProfile)
            .options(joinedload(EmployeeProfile.documents))
            .where(EmployeeProfile.user_id == user_id)
        )
        return result.unique().scalar_one_or_none()

    def create_profile(self, profile: EmployeeProfile) -> EmployeeProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def update_profile(self, profile: EmployeeProfile) -> EmployeeProfile:
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_document(self, doc_id: UUID) -> EmployeeDocument | None:
        result = self.db.execute(select(EmployeeDocument).where(EmployeeDocument.id == doc_id))
        return result.scalar_one_or_none()

    def create_document(self, doc: EmployeeDocument) -> EmployeeDocument:
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def delete_document(self, doc: EmployeeDocument) -> None:
        self.db.delete(doc)
        self.db.commit()

    def list_employees(
        self,
        search: str | None = None,
        department: str | None = None,
        designation: str | None = None,
        role: str | None = None,
        page: int = 1,
        size: int = 10
    ) -> tuple[list[User], int]:
        query = select(User).outerjoin(EmployeeProfile, User.id == EmployeeProfile.user_id).options(joinedload(User.profile))
        count_query = select(func.count(User.id)).outerjoin(EmployeeProfile, User.id == EmployeeProfile.user_id)

        filters = []
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    User.full_name.like(search_pattern),
                    User.email.like(search_pattern),
                    User.employee_id.like(search_pattern),
                    EmployeeProfile.department.like(search_pattern),
                    EmployeeProfile.designation.like(search_pattern)
                )
            )
        if department:
            filters.append(EmployeeProfile.department == department)
        if designation:
            filters.append(EmployeeProfile.designation == designation)
        if role:
            filters.append(User.role == role)

        if filters:
            query = query.where(*filters)
            count_query = count_query.where(*filters)

        total = self.db.execute(count_query).scalar_one()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        result = self.db.execute(query)
        items = result.scalars().unique().all()

        return items, total
