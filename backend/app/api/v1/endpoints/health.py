from fastapi import APIRouter
from app.schemas.health import HealthCheckResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health Check",
    description="Returns the health status of the CourtMind backend service.",
    tags=["System"],
)
async def health_check() -> HealthCheckResponse:
    """Returns basic health status for monitoring and uptime checks."""
    return HealthCheckResponse(
        status="ok",
        service="court-mind-backend",
    )
