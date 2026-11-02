"""Structured exception hierarchy for LLM generation operations.

All exceptions inherit from LLMGenerationError to provide uniform,
structured error handling across providers without exposing secrets.
"""
from typing import Optional


class LLMGenerationError(Exception):
    """Base exception for all Large Language Model generation errors."""

    def __init__(
        self,
        message: str,
        provider: str = "gemini",
        status_code: Optional[int] = None,
        original_error: Optional[Exception] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.status_code = status_code
        self.original_error = original_error

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(provider={self.provider!r}, status_code={self.status_code}, message={self.message!r})"


class LLMConfigurationError(LLMGenerationError):
    """Raised when LLM configuration or credentials are missing or invalid."""


class LLMAuthenticationError(LLMGenerationError):
    """Raised on authentication or permission failure (e.g. invalid key, HTTP 401/403)."""


class LLMRateLimitError(LLMGenerationError):
    """Raised when provider rate limits (HTTP 429) or quotas are exceeded."""


class LLMTimeoutError(LLMGenerationError):
    """Raised when an LLM request exceeds the configured timeout."""


class LLMUnavailableError(LLMGenerationError):
    """Raised when remote LLM service is unavailable (HTTP 500, 503, network drop)."""


class LLMInvalidRequestError(LLMGenerationError):
    """Raised on invalid request parameters (HTTP 400, unsupported model)."""

