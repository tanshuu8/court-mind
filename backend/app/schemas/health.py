from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(default="ok", description="Current health status of the backend")
    service: str = Field(default="court-mind-backend", description="Service identifier")
