import sys
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        # Check if an admin exists
        admin = db.query(User).filter(User.email == "admin@peopleflow.com").first()
        if admin:
            print(f"Admin already exists: {admin.email} (Employee ID: {admin.employee_id})")
            return
        
        # Create a default admin
        email = "admin@peopleflow.com"
        employee_id = "ADMIN001"
        password = "AdminPassword123!"
        hashed_password = get_password_hash(password)
        
        new_admin = User(
            employee_id=employee_id,
            full_name="System Administrator",
            email=email,
            hashed_password=hashed_password,
            role=UserRole.ADMIN,
            is_active=True,
            is_email_verified=True
        )
        db.add(new_admin)
        db.commit()
        print(f"Successfully seeded default admin account!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Employee ID: {employee_id}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
