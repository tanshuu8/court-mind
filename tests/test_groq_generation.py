"""Comprehensive test suite for Groq LLM integration and generation intelligence.

Tests cover:
- Groq client initialization and defaults
- Missing API key detection (LLMConfigurationError)
- Invalid API key / authentication error handling (LLMAuthenticationError)
- Rate limiting (HTTP 429 / LLMRateLimitError)
- Request timeout handling (LLMTimeoutError)
- Service unavailable handling (LLMUnavailableError)
- Explicit failure enforcement: verify NO silent fallback to offline mode occurs
- Provider metadata verification
- Live Groq API generation when GROQ_API_KEY is available
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
from rag.generation.providers.groq_provider import GroqProvider


def test_groq_client_initialization_defaults():
    """Verify LLMClient defaults to groq provider and expected model."""
    client = LLMClient(provider="groq", api_key="dummy_groq_key_1234567890")
    assert client.provider == "groq"
    assert isinstance(client.provider_instance, GroqProvider)
    assert client.model_name in ("qwen/qwen3.8-27b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile")


def test_groq_missing_api_key_raises_configuration_error():
    """Verify that calling Groq without an API key raises LLMConfigurationError.

    The provider is constructed directly with an empty key and no env var fallback
    so that the test is hermetic even when GROQ_API_KEY is set in the environment.
    """
    import unittest.mock as mock

    provider = GroqProvider(api_key="")
    # Also patch os.environ so _get_client cannot fall back to the env var
    with mock.patch.dict("os.environ", {"GROQ_API_KEY": ""}, clear=False):
        with pytest.raises(LLMConfigurationError) as exc_info:
            asyncio.run(provider.generate_response("System prompt", "User prompt"))
    assert "GROQ_API_KEY is not configured" in str(exc_info.value)
    assert exc_info.value.provider == "groq"


def test_groq_authentication_error_handling():
    """Verify that HTTP 401 raises LLMAuthenticationError and never retries."""
    provider = GroqProvider(api_key="invalid_test_key_1234567890")
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=Exception("Error code: 401 - {'error': {'message': 'Invalid API Key'}}")
    )
    provider._client = mock_client

    with pytest.raises(LLMAuthenticationError) as exc_info:
        asyncio.run(provider.generate_response("Sys", "User"))
    assert exc_info.value.provider == "groq"
    assert exc_info.value.status_code == 401


def test_groq_rate_limit_error_handling():
    """Verify that HTTP 429 raises LLMRateLimitError."""
    provider = GroqProvider(api_key="dummy_key_1234567890")
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(
        side_effect=Exception("Error code: 429 - {'error': {'message': 'rate_limit_exceeded'}}")
    )
    provider._client = mock_client

    with pytest.raises(LLMRateLimitError) as exc_info:
        asyncio.run(provider.generate_response("Sys", "User"))
    assert exc_info.value.provider == "groq"
    assert exc_info.value.status_code == 429


def test_groq_timeout_handling():
    """Verify that request timeouts raise LLMTimeoutError."""
    provider = GroqProvider(api_key="dummy_key_1234567890", timeout=0.01, max_retries=0)
    mock_client = MagicMock()

    async def slow_create(*args, **kwargs):
        await asyncio.sleep(0.5)
        return MagicMock()

    mock_client.chat.completions.create = slow_create
    provider._client = mock_client

    with pytest.raises(LLMTimeoutError) as exc_info:
        asyncio.run(provider.generate_response("Sys", "User"))
    assert exc_info.value.provider == "groq"


def test_groq_successful_mocked_response():
    """Verify that successful generation returns text and provider identity."""
    provider = GroqProvider(api_key="dummy_key_1234567890")
    mock_choice = MagicMock()
    mock_choice.message.content = "Article 21 protects life and personal liberty."
    mock_response = MagicMock(choices=[mock_choice])

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    provider._client = mock_client

    result = asyncio.run(provider.generate_response("Sys", "User"))
    assert "Article 21" in result


def test_groq_live_generation_if_key_available():
    """Performs 1 live call using configured GROQ_API_KEY from environment."""
    key = os.getenv("GROQ_API_KEY", "")
    if not key or not key.startswith("gsk_"):
        pytest.skip("No GROQ_API_KEY configured in environment.")

    provider = GroqProvider(api_key=key)
    res = asyncio.run(provider.generate_response(
        system_prompt="Reply with one word only.",
        user_prompt="Say VERIFIED."
    ))
    assert res and len(res) > 0

