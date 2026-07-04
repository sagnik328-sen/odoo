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
    password = "AiTestPassword123!"
    user = User(
        employee_id=f"AI{suffix.upper()}",
        full_name=f"AI {role.value.title()}",
        email=f"ai_{role.value}_{suffix}@example.com",
        hashed_password=get_password_hash(password),
        role=role,
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user, password

def test_unauthenticated_chat():
    response = client.post("/api/v1/ai/chat", json={"message": "hello"})
    assert response.status_code == 401

def test_employee_ai_chat():
    user, password = create_user(UserRole.EMPLOYEE)
    db = next(get_db())
    
    try:
        # Authenticate
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": password}
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Ask about profile/general welcome
        chat_res = client.post(
            "/api/v1/ai/chat",
            json={"message": "What is my profile details?"},
            headers=headers
        )
        assert chat_res.status_code == 200
        text = chat_res.json()["response"]
        assert "AI Assistant fallback mode" in text or "System Administrator" in text or "Employee" in text
        assert user.full_name in text

        # Ask about leaves
        chat_res_leaves = client.post(
            "/api/v1/ai/chat",
            json={"message": "How many leaves do I have?"},
            headers=headers
        )
        assert chat_res_leaves.status_code == 200
        assert "leave" in chat_res_leaves.json()["response"].lower()

    finally:
        # Cleanup
        db_user = db.query(User).filter(User.id == user.id).first()
        if db_user:
            db.delete(db_user)
            db.commit()
        db.close()

def test_hr_ai_chat():
    user, password = create_user(UserRole.HR)
    db = next(get_db())
    
    try:
        # Authenticate
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": password}
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Ask in management mode
        chat_res = client.post(
            "/api/v1/ai/chat",
            json={"message": "Give me system stats and pending leaves"},
            headers=headers
        )
        assert chat_res.status_code == 200
        text = chat_res.json()["response"]
        assert any(k in text for k in ["Management Mode", "Employees", "HR", "statistics", "leaves", "leave", "System Report"])

    finally:
        # Cleanup
        db_user = db.query(User).filter(User.id == user.id).first()
        if db_user:
            db.delete(db_user)
            db.commit()
        db.close()
