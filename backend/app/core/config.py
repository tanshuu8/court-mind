from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings using Pydantic BaseSettings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Project Metadata
    PROJECT_NAME: str = "CourtMind Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # CORS Origins
    FRONTEND_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("FRONTEND_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://courtmind_user:courtmind_password@localhost:5432/courtmind_db"
    VECTOR_DATABASE_URL: str = "postgresql://courtmind_user:courtmind_password@localhost:5432/courtmind_db"

    # LLM & Embedding Settings (Placeholders for upcoming phases)
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL_NAME: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384


settings = Settings()
