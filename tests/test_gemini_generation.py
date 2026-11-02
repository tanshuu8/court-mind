"""Comprehensive test suite for Gemini LLM integration and generation intelligence.

Tests cover:
- Mocked successful Gemini generation (document Q&A and general reference)
- Missing API key detection (LLMConfigurationError)
- Invalid API key / authentication error handling (LLMAuthenticationError without retry)
- Rate limiting (HTTP 429 / LLMRateLimitError with exponential backoff)
- Request timeout handling (LLMTimeoutError)
- Transient failure retry & recovery (HTTP 503 retry succeeds)
- Exhausted retries failure (LLMUnavailableError)
- Explicit failure enforcement: verify NO silent fallback to offline mode occurs
- Configuration propagation from settings to LLMClient
- Preservation of existing pre-LLM refusal and topic-coherence guards
- Live Gemini API call execution when GEMINI_API_KEY is available
"""
import asyncio
import os
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from rag.generation.exceptions import (
    LLMAuthenticationError,
    LLMConfigurationError,
    LLMGenerationError,
    LLMInvalidRequestError,
    LLMRateLimitError,
    LLMTimeoutError,
    LLMUnavailableError,
)
from rag.generation.llm_client import LLMClient
from rag.generation.providers.gemini_provider import GeminiProvider
from rag.generation.providers.offline_provider import OfflineProvider
from rag.generation.pipeline import LegalRAGPipeline


# ---------------------------------------------------------------------------
# 1. Configuration & Instantiation Tests
# ---------------------------------------------------------------------------

def test_gemini_client_initialization_defaults():
    """Verify LLMClient defaults to gemini provider and default Flash model."""
    client = LLMClient(provider="gemini", api_key="dummy_key_1234567890")
    assert client.provider == "gemini"
    assert isinstance(client.provider_instance, GeminiProvider)
    assert client.model_name in ("gemini-3.5-flash", "gemini-2.5-flash")


def test_gemini_missing_api_key_raises_configuration_error():
    """Verify that calling Gemini without an API key raises LLMConfigurationError."""
    # Force empty API key
    client = LLMClient(provider="gemini", api_key="")
    with pytest.raises(LLMConfigurationError) as exc_info:
        asyncio.run(client.generate_response("System prompt", "User prompt"))
    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)
    assert exc_info.value.provider == "gemini"


def test_offline_provider_explicit_mode():
    """Verify that offline mode is only active when explicitly requested."""
    client = LLMClient(provider="offline")
    assert client.provider == "offline"
    assert isinstance(client.provider_instance, OfflineProvider)
    resp = asyncio.run(client.generate_response(
        "You are CourtMind's legal assistant.",
        "Question: what is this case about\n\n[Source 1: Title: Bachan Singh, Document ID: 1980 AIR 267, Court: Supreme Court, Year: 1979, Page: 1, Chunk: 0]\nSome excerpt."
    ))
    assert len(resp) > 10


def test_config_settings_propagation():
    """Verify Settings in backend/app/core/config.py configure Gemini as primary."""
    from backend.app.core.config import settings
    assert settings.LLM_PROVIDER == "gemini"
    assert "flash" in settings.LLM_MODEL_NAME.lower()
    assert settings.LLM_TIMEOUT > 0
    assert settings.LLM_MAX_RETRIES >= 1


# ---------------------------------------------------------------------------
# 2. Mocked Gemini Generation Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_mocked_gemini_successful_generation():
    """Verify GeminiProvider calls client.aio.models.generate_content and returns output."""
    provider = GeminiProvider(api_key="test_key_dummy_12345", model_name="gemini-3.5-flash")

    mock_response = MagicMock()
    mock_response.text = "This is a grounded answer from Gemini."

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    with patch.object(provider, "_get_client", return_value=mock_client):
        result = await provider.generate_response(
            system_prompt="You are a legal assistant.",
            user_prompt="Context: Page 1.\nQuestion: What was held?",
        )
        assert result == "This is a grounded answer from Gemini."
        mock_client.aio.models.generate_content.assert_awaited_once()


@pytest.mark.asyncio
async def test_mocked_gemini_general_reference():
    """Verify generate_general_reference formats system instruction and calls Gemini."""
    provider = GeminiProvider(api_key="test_key_dummy_12345", model_name="gemini-3.5-flash")

    mock_response = MagicMock()
    mock_response.text = "Section 302 IPC defines punishment for murder."

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    with patch.object(provider, "_get_client", return_value=mock_client):
        result = await provider.generate_general_reference("Explain Section 302 IPC")
        assert "Section 302" in result


# ---------------------------------------------------------------------------
# 3. Explicit Failure & Error Handling Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_gemini_authentication_error_no_retry():
    """Verify HTTP 401/403 or invalid API key immediately raises LLMAuthenticationError without retrying."""
    provider = GeminiProvider(api_key="invalid_test_key", max_retries=3)

    mock_error = Exception("401 API_KEY_INVALID: The provided API key is invalid.")
    setattr(mock_error, "code", 401)

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=mock_error)

    with patch.object(provider, "_get_client", return_value=mock_client):
        with pytest.raises(LLMAuthenticationError) as exc_info:
            await provider.generate_response("System prompt", "User prompt")

        assert exc_info.value.status_code == 401
        assert "authentication failed" in str(exc_info.value).lower()
        # Ensure it was called only once (no retry for auth failure)
        assert mock_client.aio.models.generate_content.await_count == 1


@pytest.mark.asyncio
async def test_gemini_rate_limit_retry_and_exhaustion():
    """Verify HTTP 429 retries with backoff and raises LLMRateLimitError when exhausted."""
    provider = GeminiProvider(api_key="test_key", max_retries=2)

    mock_error = Exception("429 RESOURCE_EXHAUSTED: Quota exceeded.")
    setattr(mock_error, "code", 429)

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=mock_error)

    with patch.object(provider, "_get_client", return_value=mock_client):
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            with pytest.raises(LLMRateLimitError) as exc_info:
                await provider.generate_response("System prompt", "User prompt")

            assert exc_info.value.status_code == 429
            # 1 initial attempt + 2 retries = 3 calls
            assert mock_client.aio.models.generate_content.await_count == 3
            assert mock_sleep.await_count == 2


@pytest.mark.asyncio
async def test_gemini_timeout_handling():
    """Verify timeout triggers retry and raises LLMTimeoutError on exhaustion."""
    provider = GeminiProvider(api_key="test_key", timeout=0.1, max_retries=1)

    mock_client = MagicMock()
    # Simulate hanging coroutine
    async def slow_generate(*args, **kwargs):
        await asyncio.sleep(1.0)
    mock_client.aio.models.generate_content = slow_generate

    with patch.object(provider, "_get_client", return_value=mock_client):
        with pytest.raises(LLMTimeoutError) as exc_info:
            await provider.generate_response("System prompt", "User prompt")

        assert "timed out" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_gemini_transient_failure_recovery():
    """Verify that a transient 503 UNAVAILABLE failure recovers on retry."""
    provider = GeminiProvider(api_key="test_key", max_retries=2)

    mock_error = Exception("503 UNAVAILABLE: Temporary high demand.")
    setattr(mock_error, "code", 503)

    mock_response = MagicMock()
    mock_response.text = "Recovered response after transient spike."

    mock_client = MagicMock()
    # First attempt fails with 503, second attempt succeeds
    mock_client.aio.models.generate_content = AsyncMock(side_effect=[mock_error, mock_response])

    with patch.object(provider, "_get_client", return_value=mock_client):
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await provider.generate_response("System prompt", "User prompt")

            assert result == "Recovered response after transient spike."
            assert mock_client.aio.models.generate_content.await_count == 2
            assert mock_sleep.await_count == 1


@pytest.mark.asyncio
async def test_gemini_exhausted_retries_raises_unavailable():
    """Verify continuous 503 failure raises LLMUnavailableError after max retries."""
    provider = GeminiProvider(api_key="test_key", max_retries=2)

    mock_error = Exception("503 UNAVAILABLE: Overloaded.")
    setattr(mock_error, "code", 503)

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=mock_error)

    with patch.object(provider, "_get_client", return_value=mock_client):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(LLMUnavailableError) as exc_info:
                await provider.generate_response("System prompt", "User prompt")

            assert exc_info.value.status_code == 503


# ---------------------------------------------------------------------------
# 4. Strict Non-Fallback Verification (Explicit Failure)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_no_silent_offline_fallback_on_gemini_error():
    """CRITICAL: Ensure that when provider is 'gemini' and an error occurs,
    the pipeline returns explicit failure status and NEVER returns an offline mock answer."""
    client = LLMClient(provider="gemini", api_key="dummy_key_123")

    mock_provider = MagicMock()
    mock_provider.generate_response = AsyncMock(
        side_effect=LLMRateLimitError("Quota exceeded 429", provider="gemini", status_code=429)
    )
    client.provider_instance = mock_provider

    rag = LegalRAGPipeline(llm_client=client)

    # Mock retrieval to return valid chunks so it passes pre-LLM guards
    valid_chunk = {
        "doc_id": "TEST-DOC",
        "chunk_id": "chk_1",
        "chunk_index": 0,
        "page_number": 1,
        "text": "The Supreme Court examined Article 21 and the right to personal liberty in detail.",
        "similarity_score": 0.85,
        "metadata": {"title": "Test Judgment", "court": "Supreme Court", "year": "2024"},
    }
    rag.retriever.search_similar = AsyncMock(return_value=[valid_chunk])
    rag.embedder.embed_query = MagicMock(return_value=[0.1] * 384)

    result = await rag.answer_question(
        query="What did the Supreme Court hold regarding personal liberty?",
        case_id="TEST-DOC",
    )

    # MUST NOT be success, MUST NOT contain synthesized legal text
    assert result["status"] == "error"
    assert result["is_grounded"] is False
    assert result["citations"] == []
    assert "LLM generation failed" in result["answer"]
    assert "LLMRateLimitError" in result["disclaimer"]
    # Verify no mock facts leaked
    assert "Union of India" not in result["answer"]
    assert "Bachan Singh" not in result["answer"]


# ---------------------------------------------------------------------------
# 5. Preservation of Refusal Safeguards
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_pre_llm_refusal_preservation():
    """Verify existing topic-coherence and domain-intent guards refuse BEFORE calling LLM."""
    client = LLMClient(provider="gemini", api_key="dummy_key_123")
    mock_provider = MagicMock()
    # If LLM is invoked, fail the test
    mock_provider.generate_response = AsyncMock(side_effect=AssertionError("LLM should not be called on mismatched queries!"))
    client.provider_instance = mock_provider

    rag = LegalRAGPipeline(llm_client=client)

    # EVAL-06: Capital punishment asked against Land Acquisition document
    land_chunk = {
        "doc_id": "CIVIL APPEAL NO. 1615 OF 2023",
        "chunk_id": "chk_land_1",
        "chunk_index": 0,
        "page_number": 1,
        "text": "Possession of the agricultural land was taken on 22.09.1997 under Section 16 of Land Acquisition Act.",
        "similarity_score": 0.75,
        "metadata": {"title": "Union of India v. Rajesh Kumar (2023)", "court": "Supreme Court", "year": "2023"},
    }
    rag.retriever.search_similar = AsyncMock(return_value=[land_chunk])
    rag.embedder.embed_query = MagicMock(return_value=[0.1] * 384)

    result = await rag.answer_question(
        query="What is the capital punishment procedure described in this land acquisition judgment?",
        case_id="CIVIL APPEAL NO. 1615 OF 2023",
    )

    # Must be caught by intent mismatch guard without calling Gemini
    assert result["status"] == "insufficient_evidence"
    assert result["is_grounded"] is False
    assert "civil land acquisition judgment" in result["answer"]
    assert mock_provider.generate_response.await_count == 0


# ---------------------------------------------------------------------------
# 6. Live Gemini API Verification (if key configured)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_live_gemini_api_call_if_configured():
    """Runs a live Gemini call only if GEMINI_API_KEY is available in the environment."""
    from backend.app.core.config import settings
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")

    if not api_key or not api_key.strip():
        pytest.skip("Skipping live Gemini test: GEMINI_API_KEY not configured.")

    client = LLMClient(
        provider="gemini",
        model_name=settings.LLM_MODEL_NAME,
        api_key=api_key,
        temperature=0.1,
        timeout=30.0,
    )

    response = await client.generate_response(
        system_prompt="You are a helpful assistant. Reply with one word only.",
        user_prompt="Say 'VERIFIED'.",
    )

    assert response is not None
    assert len(response.strip()) > 0
    assert "VERIFIED" in response.upper()

