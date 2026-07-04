from app.core.config import settings
from app.schemas.health import HealthResponse


class HealthService:
    @staticmethod
    def get_status() -> HealthResponse:
        return HealthResponse(
            status="healthy",
            service=settings.app_name,
            version=settings.app_version,
        )

