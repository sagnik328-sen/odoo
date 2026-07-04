from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.payroll import Payslip, PayslipStatus
import uuid

def seed_payroll():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
        if not users:
            print("No employee users found to attach payrolls to.")
            return

        print(f"Found {len(users)} employees. Seeding payroll details...")
        
        # Generate payslips for the last two months for each employee
        periods = [("May", 2026), ("June", 2026)]
        
        slips_added = 0
        for user in users:
            # Check if this user already has payslips to avoid duplicate entries
            existing = db.query(Payslip).filter(Payslip.user_id == user.id).first()
            if existing:
                print(f"User {user.full_name} already has payslips. Skipping.")
                continue
            
            basic_salary = 6000.0 if user.full_name == "Atanu Das" else 4800.0
            allowances = 800.0
            bonuses = 400.0
            deductions = 200.0
            tax = 500.0
            net_salary = basic_salary + allowances + bonuses - deductions - tax

            for month, year in periods:
                slip = Payslip(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    month=month,
                    year=year,
                    basic_salary=basic_salary,
                    allowances=allowances,
                    bonuses=bonuses,
                    deductions=deductions,
                    tax=tax,
                    net_salary=net_salary,
                    status="PAID"
                )
                db.add(slip)
                slips_added += 1

        db.commit()
        print(f"Successfully seeded {slips_added} dummy payslips!")
        print("Payslips count in DB inside script:", db.query(Payslip).count())
    except Exception as e:
        db.rollback()
        print(f"Error seeding payroll: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_payroll()
