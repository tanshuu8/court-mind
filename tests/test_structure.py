import sys
from pathlib import Path

# Add backend, ml, and rag to path for tests
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.extend([
    str(ROOT_DIR / "backend"),
    str(ROOT_DIR),
])


def test_packages_importable():
    """Verify that backend, ml, and rag packages are properly organized and importable."""
    import app.main
    import ml.preprocessing
    import ml.features
    import ml.models
    import ml.evaluation
    import rag.ingestion
    import rag.chunking
    import rag.embeddings
    import rag.retrieval
    import rag.generation
    import rag.evaluation

    assert app.main.app is not None
    assert ml.__version__ == "0.1.0"
    assert rag.__version__ == "0.1.0"
