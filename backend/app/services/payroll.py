import io
from uuid import UUID

from fastapi import HTTPException, status
from reportlab.lib import colors

# ReportLab PDF imports
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.models.payroll import Payslip, PayslipStatus
from app.repositories.employee import EmployeeRepository
from app.repositories.payroll import PayrollRepository
from app.repositories.user import UserRepository


class PayrollService:
    def __init__(self, db: Session):
        self.db = db
        self.payroll_repo = PayrollRepository(db)
        self.employee_repo = EmployeeRepository(db)
        self.user_repo = UserRepository(db)

    def calculate_net_salary(self, basic: float, allowances: float, bonuses: float, deductions: float, tax: float) -> float:
        net = (basic + allowances + bonuses) - (deductions + tax)
        return max(0.0, round(net, 2))

    def generate_payslip(
        self,
        user_id: UUID,
        month: str,
        year: int,
        basic_salary: float,
        allowances: float,
        bonuses: float,
        deductions: float,
        tax: float
    ) -> Payslip:
        # Check if user exists
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Check duplicate
        existing = self.payroll_repo.get_by_user_month_year(user_id, month, year)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payslip already generated for this user for {month} {year}"
            )

        net_salary = self.calculate_net_salary(basic_salary, allowances, bonuses, deductions, tax)

        new_payslip = Payslip(
            user_id=user_id,
            month=month,
            year=year,
            basic_salary=basic_salary,
            allowances=allowances,
            bonuses=bonuses,
            deductions=deductions,
            tax=tax,
            net_salary=net_salary,
            status=PayslipStatus.PAID
        )

        created = self.payroll_repo.create(new_payslip)

        # Create notification for payroll availability
        from app.models.leave import Notification, NotificationType
        payroll_notification = Notification(
            user_id=user_id,
            title="Payroll published",
            message=f"Your payslip for {month} {year} is now available. Net take-home pay: ${net_salary:,.2f}",
            notification_type=NotificationType.PAYROLL
        )
        self.db.add(payroll_notification)
        self.db.commit()

        return created

    def get_payslip(self, payslip_id: UUID) -> Payslip | None:
        return self.payroll_repo.get_by_id(payslip_id)

    def list_payslips(
        self,
        user_id: UUID | None = None,
        month: str | None = None,
        year: int | None = None,
        assigned_hr_id: UUID | None = None,
        page: int = 1,
        size: int = 10
    ) -> tuple[list[Payslip], int]:
        return self.payroll_repo.list_payslips(user_id, month, year, assigned_hr_id, page, size)

    def update_payslip(
        self,
        payslip_id: UUID,
        basic_salary: float | None = None,
        allowances: float | None = None,
        bonuses: float | None = None,
        deductions: float | None = None,
        tax: float | None = None,
        status_val: PayslipStatus | None = None
    ) -> Payslip:
        payslip = self.payroll_repo.get_by_id(payslip_id)
        if not payslip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payslip not found"
            )

        if basic_salary is not None:
            payslip.basic_salary = basic_salary
        if allowances is not None:
            payslip.allowances = allowances
        if bonuses is not None:
            payslip.bonuses = bonuses
        if deductions is not None:
            payslip.deductions = deductions
        if tax is not None:
            payslip.tax = tax
        if status_val is not None:
            payslip.status = status_val

        payslip.net_salary = self.calculate_net_salary(
            payslip.basic_salary,
            payslip.allowances,
            payslip.bonuses,
            payslip.deductions,
            payslip.tax
        )

        return self.payroll_repo.update(payslip)

    def delete_payslip(self, payslip_id: UUID) -> None:
        payslip = self.payroll_repo.get_by_id(payslip_id)
        if not payslip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payslip not found"
            )
        self.payroll_repo.delete(payslip)

    def get_stats(self) -> dict:
        return self.payroll_repo.get_stats()

    def generate_payslip_pdf(self, payslip: Payslip) -> bytes:
        buffer = io.BytesIO()
        
        # Create doc template
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'), # Slate 800
            alignment=1 # Center
        )
        
        subtitle_style = ParagraphStyle(
            'DocSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748B'), # Slate 500
            alignment=1 # Center
        )
        
        h2_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=16,
            spaceAfter=8
        )
        
        body_style = ParagraphStyle(
            'BodyText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )
        
        bold_style = ParagraphStyle(
            'BodyTextBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )
        
        elements = []
        
        # Title Header
        elements.append(Paragraph("PEOPLEFLOW HRMS", title_style))
        elements.append(Paragraph("Official Paystub & Salary Statement", subtitle_style))
        elements.append(Spacer(1, 24))
        
        # Info block
        emp = payslip.user
        profile = emp.profile if emp else None
        
        meta_data = [
            [
                Paragraph("<b>Employee Name:</b>", body_style), Paragraph(emp.full_name if emp else "N/A", body_style),
                Paragraph("<b>Pay Period:</b>", body_style), Paragraph(f"{payslip.month} {payslip.year}", body_style)
            ],
            [
                Paragraph("<b>Employee ID:</b>", body_style), Paragraph(emp.employee_id if emp else "N/A", body_style),
                Paragraph("<b>Designation:</b>", body_style), Paragraph(profile.designation if profile else "N/A", body_style)
            ],
            [
                Paragraph("<b>Department:</b>", body_style), Paragraph(profile.department if profile else "N/A", body_style),
                Paragraph("<b>Issue Date:</b>", body_style), Paragraph(payslip.created_at.strftime("%Y-%m-%d"), body_style)
            ],
            [
                Paragraph("<b>Email:</b>", body_style), Paragraph(emp.email if emp else "N/A", body_style),
                Paragraph("<b>Payment Status:</b>", body_style), Paragraph(f"<font color='#059669'><b>{payslip.status.upper()}</b></font>", body_style)
            ]
        ]
        
        meta_table = Table(meta_data, colWidths=[110, 150, 110, 150])
        meta_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 24))
        
        # Financial Details
        elements.append(Paragraph("Salary Calculations Breakdown", h2_style))
        
        financial_data = [
            [Paragraph("<b>Description</b>", bold_style), Paragraph("<b>Earnings (Credit)</b>", bold_style), Paragraph("<b>Deductions (Debit)</b>", bold_style)],
            [Paragraph("Basic Salary", body_style), Paragraph(f"${payslip.basic_salary:,.2f}", body_style), Paragraph("-", body_style)],
            [Paragraph("Allowances", body_style), Paragraph(f"${payslip.allowances:,.2f}", body_style), Paragraph("-", body_style)],
            [Paragraph("Bonuses", body_style), Paragraph(f"${payslip.bonuses:,.2f}", body_style), Paragraph("-", body_style)],
            [Paragraph("Tax Deductions", body_style), Paragraph("-", body_style), Paragraph(f"${payslip.tax:,.2f}", body_style)],
            [Paragraph("Other Deductions", body_style), Paragraph("-", body_style), Paragraph(f"${payslip.deductions:,.2f}", body_style)],
            [
                Paragraph("<b>Total Calculations</b>", bold_style),
                Paragraph(f"<b>${(payslip.basic_salary + payslip.allowances + payslip.bonuses):,.2f}</b>", bold_style),
                Paragraph(f"<b>${(payslip.deductions + payslip.tax):,.2f}</b>", bold_style)
            ]
        ]
        
        financial_table = Table(financial_data, colWidths=[240, 140, 140])
        financial_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9')),
            ('LINEBELOW', (0,0), (-1,0), 1.5, colors.HexColor('#CBD5E1')),
            ('LINEABOVE', (0,-1), (-1,-1), 1.5, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F8FAFC')),
        ]))
        elements.append(financial_table)
        elements.append(Spacer(1, 24))
        
        # Net Take Home
        net_pay_data = [
            [
                Paragraph("<font size='12' color='#475569'><b>NET SALARY DISBURSED (TAKE HOME):</b></font>", bold_style),
                Paragraph(f"<font size='14' color='#4F46E5'><b>${payslip.net_salary:,.2f}</b></font>", bold_style)
            ]
        ]
        net_pay_table = Table(net_pay_data, colWidths=[320, 200])
        net_pay_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2F6')),
            ('TOPPADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('LEFTPADDING', (0,0), (-1,-1), 16),
            ('RIGHTPADDING', (0,0), (-1,-1), 16),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(net_pay_table)
        elements.append(Spacer(1, 40))
        
        # Signature block
        sig_data = [
            [Paragraph("Prepared By: Human Resources Department", body_style), Paragraph("Authorized Signature: __________________", body_style)]
        ]
        sig_table = Table(sig_data, colWidths=[270, 250])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        elements.append(sig_table)
        
        # Build PDF
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
