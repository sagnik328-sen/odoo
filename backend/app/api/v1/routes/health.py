from fastapi import APIRouter, status

from app.schemas.health import HealthResponse
from app.services.health import HealthService

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Check API health",
)
def health_check() -> HealthResponse:
    return HealthService.get_status()

