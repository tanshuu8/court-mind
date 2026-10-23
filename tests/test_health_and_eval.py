import pytest
from httpx import AsyncClient, ASGITransport
from pathlib import Path

from app.main import app
from rag.evaluation.dataset import EVALUATION_DATASET

PROJECT_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify /api/v1/rag/health returns 200 with vector store and disk storage status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/rag/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "vector_store" in data
        assert "document_registry" in data
        assert "disk_storage" in data
        assert isinstance(data["vector_store"]["chunks"], int)
        assert data["disk_storage"]["ok"] is True


def test_evaluation_dataset_structure():
    """Verify evaluation dataset contains 30 items with all required fields."""
    assert len(EVALUATION_DATASET) == 30
    for item in EVALUATION_DATASET:
        assert "id" in item
        assert "question" in item
        assert "mode" in item
        assert item["mode"] in {"document", "general"}
        assert "expected_behavior" in item
        assert item["expected_behavior"] in {"answer", "refuse"}
        assert "key_entities" in item
        assert len(item["key_entities"]) > 0
        assert "category" in item
