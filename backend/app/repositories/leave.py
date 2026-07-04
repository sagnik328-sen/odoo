from datetime import date
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.leave import LeaveRequest, LeaveStatus, Notification


class LeaveRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, request: LeaveRequest) -> LeaveRequest:
        self.db.add(request)
        self.db.flush()
        return request

    def get(self, request_id: UUID) -> LeaveRequest | None:
        return self.db.scalar(
            select(LeaveRequest)
            .options(joinedload(LeaveRequest.employee))
            .where(LeaveRequest.id == request_id)
        )

    def list_for_user(self, user_id: UUID) -> list[LeaveRequest]:
        return list(
            self.db.scalars(
                select(LeaveRequest)
                .options(joinedload(LeaveRequest.employee))
                .where(LeaveRequest.user_id == user_id)
                .order_by(LeaveRequest.created_at.desc())
            ).all()
        )

    def list_all(self, status: LeaveStatus | None = None) -> list[LeaveRequest]:
        statement = select(LeaveRequest).options(joinedload(LeaveRequest.employee))
        if status:
            statement = statement.where(LeaveRequest.status == status)
        return list(self.db.scalars(statement.order_by(LeaveRequest.created_at.desc())).all())

    def has_overlap(self, user_id: UUID, start_date: date, end_date: date) -> bool:
        statement = select(LeaveRequest.id).where(
            and_(
                LeaveRequest.user_id == user_id,
                LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
                or_(
                    LeaveRequest.start_date.between(start_date, end_date),
                    LeaveRequest.end_date.between(start_date, end_date),
                    and_(LeaveRequest.start_date <= start_date, LeaveRequest.end_date >= end_date),
                ),
            )
        )
        return self.db.scalar(statement) is not None


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, notification: Notification) -> None:
        self.db.add(notification)

    def list_for_user(self, user_id: UUID) -> list[Notification]:
        return list(
            self.db.scalars(
                select(Notification)
                .where(Notification.user_id == user_id)
                .order_by(Notification.created_at.desc())
            ).all()
        )

    def get_for_user(self, notification_id: UUID, user_id: UUID) -> Notification | None:
        return self.db.scalar(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )

