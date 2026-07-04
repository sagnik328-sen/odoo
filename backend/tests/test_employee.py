import io
import uuid

from fastapi.testclient import TestClient

from app.database.session import get_db
from app.main import app
from app.models.employee import EmployeeProfile
from app.models.user import User, UserRole
from app.utils.security import get_password_hash

client = TestClient(app)


def test_unauthenticated_cannot_access_directory():
    response = client.get("/api/v1/employees")
    assert response.status_code == 401


def test_employee_cannot_access_directory():
    # Create a test employee
    db = next(get_db())
    emp_email = f"test_emp_{uuid.uuid4().hex[:6]}@example.com"
    emp_id = f"EMP{uuid.uuid4().hex[:4].upper()}"
    user = User(
        employee_id=emp_id,
        full_name="Test Employee",
        email=emp_email,
        hashed_password=get_password_hash("TestPassword123!"),
        role=UserRole.EMPLOYEE,
        is_active=True,
        is_email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        # Login
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": emp_email, "password": "TestPassword123!"}
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Try to get list
        list_res = client.get(
            "/api/v1/employees",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_res.status_code == 403
    finally:
        db.delete(user)
        db.commit()


def test_hr_admin_crud_flow():
    db = next(get_db())
    
    # Create HR User for authenticating CRUD actions
    hr_email = f"test_hr_{uuid.uuid4().hex[:6]}@example.com"
    hr_emp_id = f"EMP{uuid.uuid4().hex[:4].upper()}"
    hr_user = User(
        employee_id=hr_emp_id,
        full_name="Test HR User",
        email=hr_email,
        hashed_password=get_password_hash("TestPassword123!"),
        role=UserRole.HR,
        is_active=True,
        is_email_verified=True
    )
    db.add(hr_user)
    db.commit()
    db.refresh(hr_user)

    other_hr = User(
        employee_id=f"EMP{uuid.uuid4().hex[:4].upper()}",
        full_name="Other HR User",
        email=f"other_hr_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        role=UserRole.HR,
        is_active=True,
        is_email_verified=True,
    )
    db.add(other_hr)
    db.commit()
    db.refresh(other_hr)

    other_employee = User(
        employee_id=f"EMP{uuid.uuid4().hex[:4].upper()}",
        full_name="Other HR Employee",
        email=f"other_emp_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        role=UserRole.EMPLOYEE,
        is_active=True,
        is_email_verified=True,
    )
    db.add(other_employee)
    db.commit()
    db.refresh(other_employee)
    db.add(EmployeeProfile(user_id=other_employee.id, hr_id=other_hr.id))
    db.commit()

    created_employee_user_id = None

    try:
        # Login HR
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": hr_email, "password": "TestPassword123!"}
        )
        assert login_res.status_code == 200
        hr_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {hr_token}"}

        # Employees assigned to another HR are neither listed nor directly accessible.
        scoped_list_res = client.get("/api/v1/employees?size=100", headers=headers)
        assert scoped_list_res.status_code == 200
        assert all(item["id"] != str(other_employee.id) for item in scoped_list_res.json()["items"])
        forbidden_res = client.get(f"/api/v1/employees/{other_employee.id}", headers=headers)
        assert forbidden_res.status_code == 403

        # 1. Onboard / Create Employee
        new_emp_email = f"new_emp_{uuid.uuid4().hex[:6]}@example.com"
        new_emp_id = f"EMP{uuid.uuid4().hex[:4].upper()}"
        onboard_payload = {
            "employee_id": new_emp_id,
            "full_name": "Onboarded Employee",
            "email": new_emp_email,
            "role": "employee",
            "phone": "1234567890",
            "address": "123 Main St",
            "department": "Engineering",
            "designation": "Software Developer",
            "base_salary": 5000.0,
            "allowances": 500.0,
            "deductions": 200.0
        }
        create_res = client.post(
            "/api/v1/employees",
            json=onboard_payload,
            headers=headers
        )
        assert create_res.status_code == 201
        data = create_res.json()
        assert data["full_name"] == "Onboarded Employee"
        assert data["profile"]["hr_id"] == str(hr_user.id)
        assert data["profile"]["department"] == "Engineering"
        assert data["profile"]["base_salary"] == 5000.0
        created_employee_user_id = data["id"]

        # 2. Get Employee details
        get_res = client.get(
            f"/api/v1/employees/{created_employee_user_id}",
            headers=headers
        )
        assert get_res.status_code == 200
        assert get_res.json()["profile"]["address"] == "123 Main St"

        # 3. Update Employee details (as HR)
        update_payload = {
            "phone": "9876543210",
            "address": "456 Oak Ave",
            "department": "Product",
            "base_salary": 6000.0
        }
        update_res = client.put(
            f"/api/v1/employees/{created_employee_user_id}",
            json=update_payload,
            headers=headers
        )
        assert update_res.status_code == 200
        assert update_res.json()["profile"]["phone"] == "9876543210"
        assert update_res.json()["profile"]["department"] == "Product"
        assert update_res.json()["profile"]["base_salary"] == 6000.0

        # 4. Search and list employees
        list_res = client.get(
            "/api/v1/employees?search=Onboarded&department=Product",
            headers=headers
        )
        assert list_res.status_code == 200
        list_data = list_res.json()
        assert list_data["total"] >= 1
        assert any(item["id"] == created_employee_user_id for item in list_data["items"])

        # 5. Upload Profile Picture (Avatar)
        avatar_file = ("avatar.png", io.BytesIO(b"dummy_image_data"), "image/png")
        avatar_res = client.post(
            f"/api/v1/employees/{created_employee_user_id}/upload-avatar",
            files={"file": avatar_file},
            headers=headers
        )
        assert avatar_res.status_code == 200
        assert "profile_picture" in avatar_res.json()

        # 6. Upload Document
        doc_file = ("resume.pdf", io.BytesIO(b"dummy_pdf_data"), "application/pdf")
        doc_res = client.post(
            f"/api/v1/employees/{created_employee_user_id}/upload-document",
            data={"name": "Resume"},
            files={"file": doc_file},
            headers=headers
        )
        assert doc_res.status_code == 200
        doc_id = doc_res.json()["document_id"]
        assert doc_res.json()["name"] == "Resume"

        # 7. Delete Document
        del_doc_res = client.delete(
            f"/api/v1/employees/{created_employee_user_id}/documents/{doc_id}",
            headers=headers
        )
        assert del_doc_res.status_code == 200

        # 8. Delete Employee
        delete_res = client.delete(
            f"/api/v1/employees/{created_employee_user_id}",
            headers=headers
        )
        assert delete_res.status_code == 200
        created_employee_user_id = None  # deleted successfully

    finally:
        db.expire_all()
        other_employee_in_db = db.query(User).filter(User.id == other_employee.id).first()
        if other_employee_in_db:
            db.delete(other_employee_in_db)
        other_hr_in_db = db.query(User).filter(User.id == other_hr.id).first()
        if other_hr_in_db:
            db.delete(other_hr_in_db)
        # Cleanup
        db.delete(hr_user)
        if created_employee_user_id:
            emp = db.query(User).filter(User.id == uuid.UUID(created_employee_user_id)).first()
            if emp:
                db.delete(emp)
        db.commit()
