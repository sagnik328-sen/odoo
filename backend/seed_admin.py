import sys
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.employee import EmployeeProfile
from app.utils.security import get_password_hash

def seed_users():
    db = SessionLocal()
    try:
        # 1. Check if an admin exists
        admin = db.query(User).filter(User.email == "admin@peopleflow.com").first()
        if not admin:
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
            db.flush()
            
            admin_profile = EmployeeProfile(
                user_id=new_admin.id,
                phone="+1 555-0100",
                address="123 System Root Way, Springfield",
                department="Operations",
                designation="System Administrator",
                base_salary=10000.0,
                allowances=1000.0
            )
            db.add(admin_profile)
            print("Successfully seeded default admin account!")
        else:
            print(f"Admin already exists: {admin.email}")

        # 2. Check if an HR exists
        hr_user = db.query(User).filter(User.email == "hr@peopleflow.com").first()
        if not hr_user:
            email = "hr@peopleflow.com"
            employee_id = "HR001"
            password = "HRPassword123!"
            hashed_password = get_password_hash(password)
            
            new_hr = User(
                employee_id=employee_id,
                full_name="Jane Cooper",
                email=email,
                hashed_password=hashed_password,
                role=UserRole.HR,
                is_active=True,
                is_email_verified=True
            )
            db.add(new_hr)
            db.flush()
            
            hr_profile = EmployeeProfile(
                user_id=new_hr.id,
                phone="+1 555-0101",
                address="456 HR Boulevard, Springfield",
                department="Human Resources",
                designation="HR Manager",
                base_salary=7500.0,
                allowances=500.0
            )
            db.add(hr_profile)
            print("Successfully seeded default HR account!")
        else:
            print(f"HR already exists: {hr_user.email}")
            new_hr = hr_user

        # 3. Check if an Employee exists
        emp_user = db.query(User).filter(User.email == "employee@peopleflow.com").first()
        if not emp_user:
            email = "employee@peopleflow.com"
            employee_id = "EMP001"
            password = "EmployeePassword123!"
            hashed_password = get_password_hash(password)
            
            new_emp = User(
                employee_id=employee_id,
                full_name="John Doe",
                email=email,
                hashed_password=hashed_password,
                role=UserRole.EMPLOYEE,
                is_active=True,
                is_email_verified=True
            )
            db.add(new_emp)
            db.flush()
            
            emp_profile = EmployeeProfile(
                user_id=new_emp.id,
                phone="+1 555-0102",
                address="789 Dev Avenue, Springfield",
                department="Engineering",
                designation="Software Developer",
                manager_id=new_hr.id,
                hr_id=new_hr.id,
                base_salary=6000.0,
                allowances=400.0
            )
            db.add(emp_profile)
            print("Successfully seeded default Employee account and assigned to HR Jane Cooper!")
        else:
            print(f"Employee already exists: {emp_user.email}")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding user data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
