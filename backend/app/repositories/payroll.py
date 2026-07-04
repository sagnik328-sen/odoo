from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.payroll import Payslip


class PayrollRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, payslip_id: UUID) -> Payslip | None:
        return self.db.execute(
            select(Payslip)
            .options(joinedload(Payslip.user))
            .where(Payslip.id == payslip_id)
        ).scalar_one_or_none()

    def get_by_user_month_year(self, user_id: UUID, month: str, year: int) -> Payslip | None:
        return self.db.execute(
            select(Payslip)
            .where(
                Payslip.user_id == user_id,
                Payslip.month == month,
                Payslip.year == year
            )
        ).scalar_one_or_none()

    def list_payslips(
        self,
        user_id: UUID | None = None,
        month: str | None = None,
        year: int | None = None,
        page: int = 1,
        size: int = 10
    ) -> tuple[list[Payslip], int]:
        query = select(Payslip).options(joinedload(Payslip.user))

        if user_id:
            query = query.where(Payslip.user_id == user_id)
        if month:
            query = query.where(Payslip.month == month)
        if year:
            query = query.where(Payslip.year == year)

        # Count query
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar_one()

        # Paginate & execute
        offset = (page - 1) * size
        query = query.order_by(Payslip.year.desc(), Payslip.month.desc()).offset(offset).limit(size)
        items = self.db.execute(query).scalars().all()

        return list(items), total

    def create(self, payslip: Payslip) -> Payslip:
        self.db.add(payslip)
        self.db.commit()
        self.db.refresh(payslip)
        return payslip

    def update(self, payslip: Payslip) -> Payslip:
        self.db.commit()
        self.db.refresh(payslip)
        return payslip

    def delete(self, payslip: Payslip) -> None:
        self.db.delete(payslip)
        self.db.commit()

    def get_stats(self) -> dict:
        result = self.db.execute(
            select(
                func.sum(Payslip.net_salary).label("total_disbursed"),
                func.sum(Payslip.basic_salary).label("total_basic"),
                func.sum(Payslip.allowances).label("total_allowances"),
                func.sum(Payslip.bonuses).label("total_bonuses"),
                func.sum(Payslip.deductions).label("total_deductions"),
                func.sum(Payslip.tax).label("total_tax"),
                func.count(func.distinct(Payslip.user_id)).label("employee_count")
            )
        ).first()
        
        return {
            "total_disbursed": float(result.total_disbursed or 0.0),
            "total_basic": float(result.total_basic or 0.0),
            "total_allowances": float(result.total_allowances or 0.0),
            "total_bonuses": float(result.total_bonuses or 0.0),
            "total_deductions": float(result.total_deductions or 0.0),
            "total_tax": float(result.total_tax or 0.0),
            "employee_count": int(result.employee_count or 0)
        }
