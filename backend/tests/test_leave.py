import uuid
from datetime import date

from fastapi.testclient import TestClient

from app.database.session import get_db
from app.main import app
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, Notification
from app.models.user import User, UserRole
from app.utils.security import get_password_hash

client = TestClient(app)


def create_user(role: UserRole) -> tuple[User, str]:
    db = next(get_db())
    suffix = uuid.uuid4().hex[:8]
    password = "LeaveTest123!"
    user = User(
        employee_id=f"LV{suffix.upper()}",
        full_name=f"Leave {role.value.title()}",
        email=f"leave_{role.value}_{suffix}@example.com",
        hashed_password=get_password_hash(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user, password


def auth_headers(user: User, password: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_leave_approval_updates_attendance_and_notifies_employee():
    employee, employee_password = create_user(UserRole.EMPLOYEE)
    hr, hr_password = create_user(UserRole.HR)
    employee_headers = auth_headers(employee, employee_password)
    hr_headers = auth_headers(hr, hr_password)

    try:
        apply_response = client.post(
            "/api/v1/leaves/apply",
            headers=employee_headers,
            json={
                "leave_type": "Paid",
                "start_date": "2026-07-06",
                "end_date": "2026-07-08",
                "remarks": "Family commitment",
            },
        )
        assert apply_response.status_code == 201
        request_id = apply_response.json()["id"]
        assert apply_response.json()["working_days"] == 3
        assert apply_response.json()["status"] == "Pending"

        overlap_response = client.post(
            "/api/v1/leaves/apply",
            headers=employee_headers,
            json={
                "leave_type": "Casual",
                "start_date": "2026-07-08",
                "end_date": "2026-07-09",
                "remarks": "Overlapping request",
            },
        )
        assert overlap_response.status_code == 409

        approve_response = client.put(
            f"/api/v1/leaves/{request_id}/approve",
            headers=hr_headers,
            json={"comment": "Approved. Enjoy your time off."},
        )
        assert approve_response.status_code == 200
        assert approve_response.json()["status"] == "Approved"

        db = next(get_db())
        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == employee.id,
                Attendance.attendance_date.between(date(2026, 7, 6), date(2026, 7, 8)),
            )
            .all()
        )
        assert len(attendance) == 3
        assert all(item.attendance_status == AttendanceStatus.LEAVE for item in attendance)
        db.close()

        notifications_response = client.get("/api/v1/notifications", headers=employee_headers)
        assert notifications_response.status_code == 200
        notification = notifications_response.json()[0]
        assert notification["notification_type"] == "Leave"
        assert notification["is_read"] is False

        read_response = client.put(
            f"/api/v1/notifications/{notification['id']}/read", headers=employee_headers
        )
        assert read_response.status_code == 200
        assert read_response.json()["is_read"] is True
    finally:
        db = next(get_db())
        db.query(Notification).filter(Notification.user_id == employee.id).delete()
        db.query(Attendance).filter(Attendance.user_id == employee.id).delete()
        db.query(LeaveRequest).filter(LeaveRequest.user_id == employee.id).delete()
        db.query(User).filter(User.id.in_([employee.id, hr.id])).delete(
            synchronize_session=False
        )
        db.commit()
        db.close()

