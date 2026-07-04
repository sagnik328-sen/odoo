import uuid

from fastapi.testclient import TestClient

from app.database.session import get_db
from app.main import app
from app.models.leave import Notification
from app.models.payroll import Payslip
from app.models.user import User, UserRole
from app.utils.security import get_password_hash

client = TestClient(app)


def create_user(role: UserRole) -> tuple[User, str]:
    database = next(get_db())
    suffix = uuid.uuid4().hex[:8]
    password = "ReleaseTest123!"
    user = User(
        employee_id=f"REL{suffix.upper()}",
        full_name=f"Release {role.value.title()}",
        email=f"release_{role.value}_{suffix}@example.com",
        hashed_password=get_password_hash(password),
        role=role,
        is_active=True,
        is_email_verified=True,
    )
    database.add(user)
    database.commit()
    database.refresh(user)
    database.expunge(user)
    database.close()
    return user, password


def login(user: User, password: str) -> dict:
    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": password}
    )
    assert response.status_code == 200
    return response.json()


def cleanup_users(*users: User) -> None:
    ids = [user.id for user in users]
    database = next(get_db())
    database.query(Notification).filter(Notification.user_id.in_(ids)).delete(
        synchronize_session=False
    )
    database.query(Payslip).filter(Payslip.user_id.in_(ids)).delete(
        synchronize_session=False
    )
    database.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    database.commit()
    database.close()


def test_authentication_logout_revokes_access_token():
    user, password = create_user(UserRole.EMPLOYEE)
    try:
        tokens = login(user, password)
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        assert client.get("/api/v1/auth/me", headers=headers).status_code == 200
        assert client.post("/api/v1/auth/logout", headers=headers).status_code == 200
        assert client.get("/api/v1/auth/me", headers=headers).status_code == 401

        refreshed = client.post(
            "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
        )
        assert refreshed.status_code == 200
        replay = client.post(
            "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
        )
        assert replay.status_code == 401
    finally:
        cleanup_users(user)


def test_payroll_and_reports_work_together_with_role_protection():
    employee, employee_password = create_user(UserRole.EMPLOYEE)
    hr, hr_password = create_user(UserRole.HR)
    try:
        employee_tokens = login(employee, employee_password)
        hr_tokens = login(hr, hr_password)
        employee_headers = {"Authorization": f"Bearer {employee_tokens['access_token']}"}
        hr_headers = {"Authorization": f"Bearer {hr_tokens['access_token']}"}

        generated = client.post(
            "/api/v1/payroll/generate",
            headers=hr_headers,
            json={
                "user_id": str(employee.id),
                "month": "August",
                "year": 2026,
                "basic_salary": 5000,
                "allowances": 500,
                "bonuses": 250,
                "deductions": 100,
                "tax": 400,
            },
        )
        assert generated.status_code == 201
        assert generated.json()["net_salary"] == 5250

        own_payroll = client.get("/api/v1/payroll/me", headers=employee_headers)
        assert own_payroll.status_code == 200
        assert own_payroll.json()["total"] == 1

        dashboard = client.get("/api/v1/reports/dashboard", headers=hr_headers)
        assert dashboard.status_code == 200
        assert dashboard.json()["total_employees"] >= 2

        payroll_report = client.get(
            "/api/v1/reports/payroll?month=8&year=2026", headers=hr_headers
        )
        assert payroll_report.status_code == 200
        assert any(item["employee_id"] == str(employee.id) for item in payroll_report.json()["items"])

        payroll_export = client.get("/api/v1/reports/export/payroll/csv", headers=hr_headers)
        assert payroll_export.status_code == 200
        assert "text/csv" in payroll_export.headers["content-type"]
        assert "Release Employee" in payroll_export.text

        forbidden = client.get("/api/v1/reports/employees", headers=employee_headers)
        assert forbidden.status_code == 403
    finally:
        cleanup_users(employee, hr)


def test_openapi_validation_and_observability_contracts():
    health = client.get("/api/v1/health", headers={"X-Request-ID": "release-check"})
    assert health.status_code == 200
    assert health.headers["X-Request-ID"] == "release-check"
    assert float(health.headers["X-Response-Time-Ms"]) >= 0

    invalid = client.post("/api/v1/auth/login", json={"email": "not-an-email"})
    assert invalid.status_code == 422
    assert invalid.json()["request_id"]

    schema = client.get("/api/v1/openapi.json")
    assert schema.status_code == 200
    assert len(schema.json()["paths"]) >= 50
    assert "bearerAuth" in str(schema.json()["components"]).lower() or "HTTPBearer" in str(
        schema.json()["components"]
    )
