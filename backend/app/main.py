from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("application_started", extra={"environment": settings.environment})
    yield
    logger.info("application_stopped")


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        summary="PeopleFlow Human Resource Management API",
        description=(
            "REST API for authentication, employee profiles, attendance, leave, payroll, "
            "notifications, and workforce reports. Authenticate with a Bearer access token."
        ),
        contact={"name": "PeopleFlow Engineering"},
        license_info={"name": "Unlicensed — internal use"},
        debug=settings.debug,
        docs_url=f"{settings.api_v1_prefix}/docs",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        redoc_url=None,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.backend_cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.middleware("http")
    async def request_observability(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid4()))
        request.state.request_id = request_id
        started_at = perf_counter()
        response = await call_next(request)
        elapsed_ms = (perf_counter() - started_at) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.2f}"
        logger.info(
            "request_completed method=%s path=%s status=%s duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request_id,
        )
        return response

    uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    application.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

    return application


app = create_application()
