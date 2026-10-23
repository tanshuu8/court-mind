import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings

logger = logging.getLogger("courtmind")


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Lifespan context manager to handle startup and shutdown tasks."""
    try:
        from app.services.rag_service import preload_sample_judgments
        logger.info("Preloading legal judgments...")
        await preload_sample_judgments()
        logger.info("Preload complete.")
    except Exception as e:
        logger.warning(f"Legal judgments preload notice: {e}")
    yield


def create_application() -> FastAPI:
    """Application factory for CourtMind FastAPI service."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="CourtMind AI Backend - Court Case Delay Intelligence & Legal Document Analysis",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.FRONTEND_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers (accessible via /api and /api/v1)
    application.include_router(api_router, prefix=settings.API_V1_STR)
    if settings.API_V1_STR != "/api/v1":
        application.include_router(api_router, prefix="/api/v1")

    return application


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
