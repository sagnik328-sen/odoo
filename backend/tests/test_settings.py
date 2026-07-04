import uuid
from fastapi.testclient import TestClient

from app.database.session import get_db
from app.main import app
from app.models.user import User, UserRole
from app.utils.security import get_password_hash

client = TestClient(app)


def create_user(role: UserRole) -> tuple[User, str]:
    db = next(get_db())
    suffix = uuid.uuid4().hex[:8]
    password = "SettingsTest123!"
    user = User(
        employee_id=f"ST{suffix.upper()}",
        full_name=f"Settings {role.value.title()}",
        email=f"settings_{role.value}_{suffix}@example.com",
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
    assert response.status_code == 200, f"Login failed for {user.email}: {response.json()}"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_settings_permissions():
    employee, employee_password = create_user(UserRole.EMPLOYEE)
    admin, admin_password = create_user(UserRole.ADMIN)
    
    employee_headers = auth_headers(employee, employee_password)
    admin_headers = auth_headers(admin, admin_password)

    # 1. Read company info - Employee should succeed
    response = client.get("/api/v1/settings/company", headers=employee_headers)
    assert response.status_code == 200
    assert "company_name" in response.json()

    # 2. Write company info - Employee should fail (403)
    response = client.put(
        "/api/v1/settings/company",
        headers=employee_headers,
        json={"company_name": "Hackers Inc."}
    )
    assert response.status_code == 403

    # 3. Write company info - Admin should succeed
    new_company_name = f"Company {uuid.uuid4().hex[:4]}"
    response = client.put(
        "/api/v1/settings/company",
        headers=admin_headers,
        json={
            "company_name": new_company_name,
            "address": "123 Business St",
            "phone": "555-0199",
            "email": "contact@company.com",
            "website": "www.company.com",
            "tax_id": "TX-12345"
        }
    )
    assert response.status_code == 200
    assert response.json()["company_name"] == new_company_name

    # 4. Read role permissions - Employee should fail (403)
    response = client.get("/api/v1/settings/role-permissions", headers=employee_headers)
    assert response.status_code == 403

    # 5. Read role permissions - Admin should succeed
    response = client.get("/api/v1/settings/role-permissions", headers=admin_headers)
    assert response.status_code == 200
    perms = response.json()
    assert len(perms) > 0

    # 6. Update role permissions - Admin should succeed
    response = client.put(
        "/api/v1/settings/role-permissions/employee",
        headers=admin_headers,
        json={"can_view_reports": True}
    )
    assert response.status_code == 200
    assert response.json()["can_view_reports"] is True

    # Revert role permissions to default to prevent test pollution
    client.put(
        "/api/v1/settings/role-permissions/employee",
        headers=admin_headers,
        json={"can_view_reports": False}
    )


def test_password_change_flow():
    employee, employee_password = create_user(UserRole.EMPLOYEE)
    employee_headers = auth_headers(employee, employee_password)

    new_password = "NewSecretPassword123!"

    # 1. Change password - Invalid old password should fail (400)
    response = client.post(
        "/api/v1/auth/change-password",
        headers=employee_headers,
        json={"old_password": "WrongPassword", "new_password": new_password}
    )
    assert response.status_code == 400

    # 2. Change password - Correct old password should succeed (200)
    response = client.post(
        "/api/v1/auth/change-password",
        headers=employee_headers,
        json={"old_password": employee_password, "new_password": new_password}
    )
    assert response.status_code == 200
    assert "message" in response.json()

    # 3. Verify login works with new password
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": employee.email, "password": new_password}
    )
    assert login_response.status_code == 200
