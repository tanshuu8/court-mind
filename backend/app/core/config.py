from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_project_root = Path(__file__).resolve().parents[3]
_backend_root = Path(__file__).resolve().parents[2]
_env_candidates = (
    str(_project_root / ".env"),
    str(_backend_root / ".env"),
)


class Settings(BaseSettings):
    """Application Settings using Pydantic BaseSettings."""

    model_config = SettingsConfigDict(
        env_file=_env_candidates,
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

    # LLM Generation Settings (Groq primary, Google Gemini secondary)
    LLM_PROVIDER: str = "groq"
    LLM_MODEL_NAME: str = "qwen/qwen3.8-27b"
    GROQ_API_KEY: str = ""
    GROQ_MODEL_NAME: str = "qwen/qwen3.8-27b"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-3.5-flash"
    LLM_API_KEY: str = ""
    LLM_TEMPERATURE: float = 0.1
    LLM_TIMEOUT: float = 60.0
    LLM_MAX_RETRIES: int = 2
    LLM_MAX_OUTPUT_TOKENS: int = 600

    # Embedding Settings
    EMBEDDING_PROVIDER: str = "sentence-transformers"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # External Legal Search Provider (Mode B Optional Search)
    EXTERNAL_SEARCH_PROVIDER: str = "none"
    EXTERNAL_SEARCH_API_KEY: str = ""

    # Storage & Upload Limits
    PDF_STORAGE_DIR: str = "./data/stored_documents"
    MAX_UPLOAD_SIZE_MB: int = 50


settings = Settings()
