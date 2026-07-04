from fastapi import APIRouter

from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.employee import router as employee_router
from app.api.v1.routes.attendance import router as attendance_router
from app.api.v1.routes.leave import router as leave_router
from app.api.v1.routes.payroll import router as payroll_router
from app.api.v1.routes.reports import router as reports_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(employee_router)
api_router.include_router(attendance_router)
api_router.include_router(leave_router)
api_router.include_router(payroll_router)
api_router.include_router(reports_router)


