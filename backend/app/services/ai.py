import json
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User, UserRole
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.attendance import Attendance
from app.models.payroll import Payslip

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, db: Session):
        self.db = db

    def get_chat_response(self, current_user: User, user_message: str) -> str:
        """
        Gathers database context based on role-wise permissions, structures a prompt,
        and requests a response from the Google Gemini API (or triggers local fallback).
        """
        role = current_user.role
        context_data = {}

        try:
            # 1. Gather Context depending on user role
            if role == UserRole.EMPLOYEE:
                # Basic profile
                profile_info = {
                    "full_name": current_user.full_name,
                    "email": current_user.email,
                    "employee_id": current_user.employee_id,
                    "department": "Operations",
                    "designation": "Employee",
                    "joining_date": "N/A"
                }
                
                if current_user.profile:
                    p = current_user.profile
                    profile_info.update({
                        "department": p.department or "Operations",
                        "designation": p.designation or "Employee",
                        "joining_date": str(p.joining_date) if p.joining_date else "N/A",
                        "phone": p.phone or "N/A",
                        "address": p.address or "N/A"
                    })
                context_data["profile"] = profile_info

                # Leaves
                leaves_q = self.db.scalars(
                    select(LeaveRequest).where(LeaveRequest.user_id == current_user.id)
                ).all()
                context_data["leaves"] = [
                    {
                        "leave_type": l.leave_type.value if hasattr(l.leave_type, "value") else str(l.leave_type),
                        "start_date": str(l.start_date),
                        "end_date": str(l.end_date),
                        "status": l.status.value if hasattr(l.status, "value") else str(l.status),
                        "remarks": l.remarks or ""
                    }
                    for l in leaves_q
                ]

                # Attendance
                attendance_q = self.db.scalars(
                    select(Attendance)
                    .where(Attendance.user_id == current_user.id)
                    .order_by(Attendance.attendance_date.desc())
                    .limit(10)
                ).all()
                context_data["attendance"] = [
                    {
                        "date": str(a.attendance_date),
                        "check_in": str(a.check_in) if a.check_in else "N/A",
                        "check_out": str(a.check_out) if a.check_out else "N/A",
                        "working_hours": round(a.working_hours, 2) if a.working_hours else 0.0,
                        "status": a.status or "Present"
                    }
                    for a in attendance_q
                ]

                # Payslips
                payroll_q = self.db.scalars(
                    select(Payslip)
                    .where(Payslip.user_id == current_user.id)
                    .order_by(Payslip.year.desc(), Payslip.month.desc())
                    .limit(5)
                ).all()
                context_data["payroll"] = [
                    {
                        "month": p.month,
                        "year": p.year,
                        "basic_salary": float(p.basic_salary),
                        "allowances": float(p.allowances),
                        "bonuses": float(p.bonuses),
                        "deductions": float(p.deductions),
                        "tax": float(p.tax),
                        "net_salary": float(p.net_salary),
                        "status": p.status or "Generated"
                    }
                    for p in payroll_q
                ]

            else: # HR or ADMIN
                # Overall system stats
                all_users = self.db.scalars(select(User)).all()
                pending_leaves = self.db.scalars(
                    select(LeaveRequest).where(LeaveRequest.status == LeaveStatus.PENDING)
                ).all()
                
                context_data["stats"] = {
                    "total_employees": len([u for u in all_users if u.role == UserRole.EMPLOYEE]),
                    "total_hr": len([u for u in all_users if u.role == UserRole.HR]),
                    "total_admins": len([u for u in all_users if u.role == UserRole.ADMIN]),
                    "pending_leave_count": len(pending_leaves),
                }

                context_data["pending_leaves"] = [
                    {
                        "id": str(l.id),
                        "employee_name": l.user.full_name if l.user else "Unknown",
                        "leave_type": l.leave_type.value if hasattr(l.leave_type, "value") else str(l.leave_type),
                        "start_date": str(l.start_date),
                        "end_date": str(l.end_date),
                        "remarks": l.remarks or ""
                    }
                    for l in pending_leaves
                ]

                # Summary of recent check-ins
                recent_att = self.db.scalars(
                    select(Attendance)
                    .order_by(Attendance.attendance_date.desc())
                    .limit(10)
                ).all()
                context_data["recent_attendance"] = [
                    {
                        "employee_name": a.user.full_name if a.user else "Unknown",
                        "date": str(a.attendance_date),
                        "status": a.status or "Present"
                    }
                    for a in recent_att
                ]

                # Admin-specific full database analytics (Payroll analysis, growth, department distributions)
                if role == UserRole.ADMIN:
                    all_slips = self.db.scalars(select(Payslip)).all()
                    total_payroll = sum(float(p.net_salary) for p in all_slips)
                    avg_payroll = total_payroll / len(all_slips) if all_slips else 0.0
                    context_data["payroll_analysis"] = {
                        "total_payslips_generated": len(all_slips),
                        "total_payroll_expenditure": total_payroll,
                        "average_net_salary": avg_payroll,
                        "all_payslips": [
                            {
                                "employee_name": p.user.full_name if p.user else "Unknown",
                                "month": p.month,
                                "year": p.year,
                                "net_salary": float(p.net_salary)
                            }
                            for p in all_slips
                        ]
                    }

                    # Employee profile list for growth and department performance
                    from app.models.employee import EmployeeProfile
                    profiles = self.db.scalars(select(EmployeeProfile)).all()
                    context_data["employee_directory"] = [
                        {
                            "name": p.user.full_name if p.user else "Unknown",
                            "department": p.department or "Operations",
                            "designation": p.designation or "Employee",
                            "joining_date": str(p.joining_date) if p.joining_date else "N/A"
                        }
                        for p in profiles
                    ]

        except Exception as e:
            logger.error("Error gathering DB context for AI assistant: %s", str(e), exc_info=True)
            context_data["error"] = "Could not aggregate complete details due to an internal error."

        # 2. Formulate Prompt instructions
        if role == UserRole.EMPLOYEE:
            instructions = (
                "You are a helpful, conversational HR Assistant for PeopleFlow. "
                "Below is the JSON structured data of the logged-in employee. "
                "Answer the employee's questions based ONLY on this context. "
                "If the user asks about other employees, salary details of others, "
                "or general administration settings, refuse to answer politely, "
                "explaining that your security clearance restricts you to their personal profile only.\n"
                f"Context data:\n{json.dumps(context_data, indent=2)}"
            )
        elif role == UserRole.HR:
            instructions = (
                "You are a helpful Management HR Assistant for PeopleFlow. "
                "Below is the JSON structured company-wide summary data. "
                "Answer the HR query using this context. You have permission to share employee statistics, "
                "pending leave reviews, department metrics, and attendance summaries. "
                "Do not disclose database keys or security tokens.\n"
                f"Context data:\n{json.dumps(context_data, indent=2)}"
            )
        else: # ADMIN
            instructions = (
                "You are the Executive/Admin Assistant for PeopleFlow HRMS. "
                "Below is the complete structured HRMS dataset including profile listings, detailed payroll analysis, and department distribution. "
                "You have full administrator access to all data. "
                "Use this to answer queries about Company HR summaries, Payroll analysis, Attendance analytics, "
                "Employee growth, Department performance, Executive reports, and Overall business insights. "
                "Answer clearly, analytically, and professionally.\n"
                f"Context data:\n{json.dumps(context_data, indent=2)}"
            )

        # 3. Request from Gemini API or fallback
        if not settings.gemini_api_key:
            return self._fallback_local_response(current_user, user_message, context_data)

        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"System Guidelines:\n{instructions}\n\nUser Question: {user_message}"
                            }
                        ]
                    }
                ]
            }
            res = httpx.post(url, json=payload, timeout=20.0)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            else:
                logger.error("Gemini API call failed with status: %s, Response: %s", res.status_code, res.text)
                return self._fallback_local_response(current_user, user_message, context_data, error_detail="Gemini API Error")
        except Exception as e:
            logger.error("Error calling Gemini API: %s", str(e), exc_info=True)
            return self._fallback_local_response(current_user, user_message, context_data, error_detail=str(e))

    def _fallback_local_response(self, user: User, message: str, context: dict, error_detail: str = "") -> str:
        """
        Local parser to generate accurate responses from local SQLite records when
        no Gemini API key is configured or API errors occur.
        """
        msg_lower = message.lower()
        role = user.role
        
        header = ""
        if error_detail:
            header = f"*(Fallback active due to: {error_detail})*\n\n"
        else:
            header = "*(AI Assistant fallback mode - running locally off SQLite)*\n\n"

        if role == UserRole.EMPLOYEE:
            profile = context.get("profile", {})
            leaves = context.get("leaves", [])
            attendance = context.get("attendance", [])
            payroll = context.get("payroll", [])

            if "leave" in msg_lower or "vacation" in msg_lower or "time off" in msg_lower:
                approved_leaves = len([l for l in leaves if l["status"] == "Approved"])
                pending_leaves = len([l for l in leaves if l["status"] == "Pending"])
                response_str = f"Hi {user.full_name}, you have **{len(leaves)}** leave requests logged in the database:\n"
                response_str += f"- Approved: {approved_leaves}\n- Pending: {pending_leaves}\n\n"
                if leaves:
                    response_str += "Here is your request history:\n"
                    for l in leaves[:3]:
                        response_str += f"- **{l['leave_type']}** from {l['start_date']} to {l['end_date']} (*{l['status']}*)\n"
                return header + response_str

            elif "salary" in msg_lower or "payroll" in msg_lower or "pay" in msg_lower:
                if payroll:
                    latest = payroll[0]
                    return header + (
                        f"Your latest payslip details for **{latest['month']} {latest['year']}**:\n"
                        f"- Basic Salary: **${latest['basic_salary']:.2f}**\n"
                        f"- Allowances: **${latest['allowances']:.2f}**\n"
                        f"- Net Salary Received: **${latest['net_salary']:.2f}**\n"
                        f"- Payslip Status: *{latest['status']}*"
                    )
                else:
                    return header + f"Hello {user.full_name}, no payslip records were found for you in the database."

            elif "attendance" in msg_lower or "check" in msg_lower or "hours" in msg_lower or "clock" in msg_lower:
                if attendance:
                    latest = attendance[0]
                    total_hours = sum(a["working_hours"] for a in attendance)
                    return header + (
                        f"Here is a summary of your recent check-ins:\n"
                        f"- Latest log: **{latest['date']}** (In: {latest['check_in']} | Out: {latest['check_out']} | Hours: {latest['working_hours']} hrs)\n"
                        f"- Total working hours across last {len(attendance)} logs: **{total_hours:.2f} hrs**"
                    )
                else:
                    return header + "You don't have any check-in logs recorded in the system yet. Please check in on the dashboard!"

            else:
                dept = profile.get("department", "Operations")
                desg = profile.get("designation", "Employee")
                return header + (
                    f"Hello {user.full_name}!\n\n"
                    f"I am your PeopleFlow Assistant. I have loaded your database profile:\n"
                    f"- Designation: **{desg}**\n"
                    f"- Department: **{dept}**\n"
                    f"- Employee ID: **{profile.get('employee_id')}**\n\n"
                    f"Ask me about your **leaves**, **attendance summary**, or **salary details**!"
                )
        else: # HR or ADMIN
            stats = context.get("stats", {})
            pending_leaves = context.get("pending_leaves", [])
            recent_att = context.get("recent_attendance", [])

            if role == UserRole.ADMIN:
                payroll_analysis = context.get("payroll_analysis", {})
                emp_dir = context.get("employee_directory", [])

                if "payroll" in msg_lower or "salary" in msg_lower or "expenditure" in msg_lower or "insights" in msg_lower:
                    if payroll_analysis:
                        return header + (
                            f"### Payroll Analysis & Business Insights\n"
                            f"- Total Payslips Generated: **{payroll_analysis.get('total_payslips_generated', 0)}**\n"
                            f"- Total Net Payroll Expenditure: **${payroll_analysis.get('total_payroll_expenditure', 0.0):,.2f}**\n"
                            f"- Average Net Salary: **${payroll_analysis.get('average_net_salary', 0.0):,.2f}**\n\n"
                            f"These figures represent the aggregate operational salary profiles across all departments."
                        )
                    else:
                        return header + "Executive Report: No active payroll cost indicators found in database."

                elif "growth" in msg_lower or "department" in msg_lower or "performance" in msg_lower:
                    dept_map = {}
                    for emp in emp_dir:
                        d = emp.get("department", "Operations")
                        dept_map[d] = dept_map.get(d, 0) + 1
                    
                    response_str = f"### Employee Growth & Department Performance\n"
                    response_str += f"- Total Active Personnel Profiles: **{len(emp_dir)}**\n\n"
                    response_str += "Departmental headcounts:\n"
                    for d, count in dept_map.items():
                        response_str += f"- **{d}**: {count} employees\n"
                    return header + response_str

            # General checks for both HR and Admin
            if "leave" in msg_lower or "request" in msg_lower:
                response_str = f"System Report: There are currently **{stats.get('pending_leave_count', 0)}** pending leave requests requiring review:\n\n"
                if pending_leaves:
                    for l in pending_leaves[:5]:
                        response_str += f"- **{l['employee_name']}**: {l['leave_type']} ({l['start_date']} to {l['end_date']}) - Request ID: {l['id'][:8]}...\n"
                else:
                    response_str += "All leave requests have been processed! No pending reviews."
                return header + response_str

            elif "attendance" in msg_lower or "active" in msg_lower or "who" in msg_lower:
                response_str = "Recent attendance summaries recorded:\n"
                if recent_att:
                    for r in recent_att[:5]:
                        response_str += f"- {r['employee_name']} on {r['date']}: (*{r['status']}*)\n"
                else:
                    response_str += "No attendance logs found in database."
                return header + response_str

            else:
                if role == UserRole.ADMIN:
                    return header + (
                        f"Hello {user.full_name} (Executive Admin Mode).\n\n"
                        f"Current HR System metrics:\n"
                        f"- Active Employees: **{stats.get('total_employees', 0)}**\n"
                        f"- HR Officers: **{stats.get('total_hr', 0)}**\n"
                        f"- System Administrators: **{stats.get('total_admins', 0)}**\n"
                        f"- Pending Leave Requests: **{stats.get('pending_leave_count', 0)}**\n\n"
                        f"You can ask about **Company HR summary**, **payroll analysis**, **attendance analytics**, **employee growth**, or **department performance**!"
                    )
                else:
                    return header + (
                        f"Hello {user.full_name} (Management Mode).\n\n"
                        f"Current HR System metrics:\n"
                        f"- Active Employees: **{stats.get('total_employees', 0)}**\n"
                        f"- HR Officers: **{stats.get('total_hr', 0)}**\n"
                        f"- System Administrators: **{stats.get('total_admins', 0)}**\n"
                        f"- Pending Leave Requests: **{stats.get('pending_leave_count', 0)}**\n\n"
                        f"You can query employee attendance, check pending leave items, or ask for statistics."
                    )
