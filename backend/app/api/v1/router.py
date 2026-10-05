from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()

# Core system endpoints
api_router.include_router(health.router, tags=["System"])

# Placeholders for future feature modules:
# api_router.include_router(cases.router, prefix="/cases", tags=["Case Intelligence"])
# api_router.include_router(documents.router, prefix="/documents", tags=["Legal Document Analysis"])
