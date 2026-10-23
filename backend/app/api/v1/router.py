from fastapi import APIRouter
from app.api.v1.endpoints import health, rag

api_router = APIRouter()

# Core system endpoints
api_router.include_router(health.router, tags=["System"])
api_router.include_router(rag.router, prefix="/rag", tags=["Legal RAG"])
