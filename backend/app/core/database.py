import logging
from typing import Any, AsyncGenerator, Dict
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("courtmind.database")

Base = declarative_base()

# Async engine for FastAPI endpoints
async_engine = None
AsyncSessionLocal = None

try:
    async_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
except Exception as exc:
    logger.warning(f"Could not initialize async database engine: {exc}")

# Sync engine for Alembic and migrations / synchronous operations
sync_engine = None
SyncSessionLocal = None

try:
    sync_url = settings.VECTOR_DATABASE_URL or settings.DATABASE_URL.replace("+asyncpg", "")
    sync_engine = create_engine(
        sync_url,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )
    SyncSessionLocal = sessionmaker(
        bind=sync_engine,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
except Exception as exc:
    logger.warning(f"Could not initialize sync database engine: {exc}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for yielding database session."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database session factory is not configured.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def check_database_connection() -> Dict[str, Any]:
    """Synchronous health check to verify database connectivity."""
    if sync_engine is None:
        return {
            "status": "unavailable",
            "connected": False,
            "error": "Sync engine not configured",
        }
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            row = result.fetchone()
            version_str = row[0] if row else "Unknown"
            return {
                "status": "healthy",
                "connected": True,
                "version": version_str,
            }
    except Exception as exc:
        return {
            "status": "unhealthy",
            "connected": False,
            "error": str(exc),
        }


def check_pgvector_extension() -> Dict[str, Any]:
    """Verifies whether the pgvector extension is available and activated."""
    if sync_engine is None:
        return {
            "installed": False,
            "version": None,
            "error": "Database engine not connected",
        }
    try:
        with sync_engine.connect() as conn:
            # Check if extension is installed in current DB
            result = conn.execute(
                text("SELECT extversion FROM pg_extension WHERE extname = 'vector';")
            )
            row = result.fetchone()
            if row:
                return {
                    "installed": True,
                    "version": row[0],
                }

            # If not yet installed, check if available to create
            avail = conn.execute(
                text("SELECT default_version FROM pg_available_extensions WHERE name = 'vector';")
            ).fetchone()
            if avail:
                return {
                    "installed": False,
                    "available_to_install": True,
                    "available_version": avail[0],
                }
            return {
                "installed": False,
                "available_to_install": False,
                "reason": "pgvector binary not installed on PostgreSQL server",
            }
    except Exception as exc:
        return {
            "installed": False,
            "error": str(exc),
        }
