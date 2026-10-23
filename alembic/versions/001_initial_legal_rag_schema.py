"""Initial Legal RAG Schema with pgvector support

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

try:
    from pgvector.sqlalchemy import Vector
    _HAS_PGVECTOR = True
except ImportError:
    Vector = None
    _HAS_PGVECTOR = False

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension if on PostgreSQL
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("auth_provider_sub", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_auth_provider_sub", "users", ["auth_provider_sub"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 3. Create documents table
    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("owner_id", sa.String(length=64), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("mime_type", sa.String(length=100), nullable=False, server_default="application/pdf"),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("court", sa.String(length=255), nullable=True),
        sa.Column("case_number", sa.String(length=255), nullable=True),
        sa.Column("judgment_date", sa.String(length=100), nullable=True),
        sa.Column("year", sa.String(length=20), nullable=True),
        sa.Column("bench", sa.String(length=500), nullable=True),
        sa.Column("page_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("error_details", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_path"),
    )
    op.create_index("ix_documents_owner_id", "documents", ["owner_id"])
    op.create_index("ix_documents_title", "documents", ["title"])
    op.create_index("ix_documents_court", "documents", ["court"])
    op.create_index("ix_documents_case_number", "documents", ["case_number"])
    op.create_index("ix_documents_year", "documents", ["year"])
    op.create_index("ix_documents_status", "documents", ["status"])

    # 4. Create document_chunks table
    embedding_type = Vector(384) if (is_postgres and _HAS_PGVECTOR) else sa.Text()

    op.create_table(
        "document_chunks",
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("document_id", sa.String(length=255), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("page_range", sa.String(length=50), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("embedding", embedding_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_document_chunks_document_id", "document_chunks", ["document_id"])
    op.create_index("ix_document_chunks_chunk_index", "document_chunks", ["chunk_index"])
    op.create_index("ix_document_chunks_page_number", "document_chunks", ["page_number"])
    op.create_index("ix_chunks_doc_chunk", "document_chunks", ["document_id", "chunk_index"])
    op.create_index("ix_chunks_doc_page", "document_chunks", ["document_id", "page_number"])

    if is_postgres and _HAS_PGVECTOR:
        # HNSW cosine index for pgvector
        op.execute("""
            CREATE INDEX IF NOT EXISTS ix_chunks_embedding_hnsw
            ON document_chunks USING hnsw (embedding vector_cosine_ops);
        """)

    # 5. Create ingestion_jobs table
    op.create_table(
        "ingestion_jobs",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("document_id", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="started"),
        sa.Column("error_details", sa.Text(), nullable=True),
        sa.Column("total_chunks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ingestion_jobs_document_id", "ingestion_jobs", ["document_id"])
    op.create_index("ix_ingestion_jobs_status", "ingestion_jobs", ["status"])


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    op.drop_table("ingestion_jobs")
    if is_postgres and _HAS_PGVECTOR:
        op.execute("DROP INDEX IF EXISTS ix_chunks_embedding_hnsw;")
    op.drop_table("document_chunks")
    op.drop_table("documents")
    op.drop_table("users")
    if is_postgres:
        op.execute("DROP EXTENSION IF EXISTS vector;")
