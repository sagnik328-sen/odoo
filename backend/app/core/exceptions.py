from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"message": exc.message, "type": exc.__class__.__name__}},
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "request_validation_failed method=%s path=%s request_id=%s errors=%s",
        request.method,
        request.url.path,
        request_id,
        exc.errors(),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "detail": exc.errors(),
            "error": {"message": "Request validation failed", "type": "ValidationError"},
            "request_id": request_id,
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled_exception",
        extra={
            "method": request.method,
            "path": request.url.path,
            "request_id": getattr(request.state, "request_id", None),
        },
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {"message": "An unexpected error occurred", "type": "InternalError"},
            "request_id": getattr(request.state, "request_id", None),
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
