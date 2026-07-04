# ruff: noqa: B008

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import RoleChecker, get_current_user
from app.database.session import get_db
from app.models.leave import LeaveStatus
from app.models.user import User, UserRole
from app.schemas.leave import LeaveCreate, LeaveDecision, LeaveResponse, NotificationResponse
from app.services.leave import LeaveService, NotificationService

router = APIRouter(tags=["Leave & Time Off"])
reviewer = RoleChecker([UserRole.ADMIN, UserRole.HR])


@router.post("/leaves/apply", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def apply_for_leave(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return LeaveService(db).apply(current_user, payload)


@router.get("/leaves/me", response_model=list[LeaveResponse])
def leave_history(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return LeaveService(db).history(current_user)


@router.get("/leaves", response_model=list[LeaveResponse])
def list_leave_requests(
    leave_status: LeaveStatus | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: User = Depends(reviewer),
):
    return LeaveService(db).all_requests(leave_status)


@router.put("/leaves/{request_id}/approve", response_model=LeaveResponse)
def approve_leave(
    request_id: UUID,
    payload: LeaveDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(reviewer),
):
    return LeaveService(db).decide(request_id, current_user, LeaveStatus.APPROVED, payload)


@router.put("/leaves/{request_id}/reject", response_model=LeaveResponse)
def reject_leave(
    request_id: UUID,
    payload: LeaveDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(reviewer),
):
    return LeaveService(db).decide(request_id, current_user, LeaveStatus.REJECTED, payload)


@router.get("/notifications", response_model=list[NotificationResponse])
def notifications(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return NotificationService(db).list_for_user(current_user)


@router.put("/notifications/read-all", response_model=list[NotificationResponse])
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return NotificationService(db).mark_all_read(current_user)


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationService(db).mark_read(notification_id, current_user)
