import json
from typing import Any, Dict, List, Optional
from sqlalchemy import ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.models.base import Base, TimestampMixin

# Robust Vector column abstraction that supports native pgvector in PostgreSQL
# and fallback to text/json in SQLite / other dialects.
try:
    from pgvector.sqlalchemy import Vector
    _HAS_PGVECTOR = True
except ImportError:
    Vector = None
    _HAS_PGVECTOR = False


class VectorColumn(TypeDecorator):
    """Custom SQLAlchemy type decorator for 384-dimensional dense vectors.
    
    Uses native pgvector Vector(384) on PostgreSQL, and JSON-encoded array on other dialects.
    """
    impl = Text
    cache_ok = True

    def __init__(self, dimension: int = 384, **kwargs) -> None:
        super().__init__(**kwargs)
        self.dimension = dimension

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and _HAS_PGVECTOR:
            return dialect.type_descriptor(Vector(self.dimension))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name != "postgresql" or not _HAS_PGVECTOR:
            if isinstance(value, (list, tuple)):
                return json.dumps(list(value))
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name != "postgresql" or not _HAS_PGVECTOR:
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return value
        elif hasattr(value, "tolist"):
            return value.tolist()
        return value


class DocumentChunk(Base, TimestampMixin):
    """Represents a page-aware semantic text chunk from a legal judgment."""
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(
        String(255),
        primary_key=True,
    )
    document_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    page_number: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        index=True,
    )
    page_range: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    embedding: Mapped[List[float]] = mapped_column(
        VectorColumn(384),
        nullable=False,
    )

    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="chunks",
    )

    __table_args__ = (
        Index("ix_chunks_doc_chunk", "document_id", "chunk_index"),
        Index("ix_chunks_doc_page", "document_id", "page_number"),
    )
