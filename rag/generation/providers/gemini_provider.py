"""Google Gemini provider implementation using the official google-genai SDK.

Features:
- Asynchronous generation via client.aio.models.generate_content
- Configurable model, temperature, timeout, and max output tokens
- Strict system instruction and user prompt separation
- Robust retry with exponential backoff for transient failures (429, 503, timeouts)
- Explicit failure reporting (never returns silent fallbacks)
- Redaction of credentials from all log and error outputs
"""
import asyncio
import logging
import random
import re
from typing import Any, Dict, Optional

from rag.generation.exceptions import (
    LLMAuthenticationError,
    LLMConfigurationError,
    LLMGenerationError,
    LLMInvalidRequestError,
    LLMRateLimitError,
    LLMTimeoutError,
    LLMUnavailableError,
)
from rag.generation.providers.base import BaseLLMProvider

logger = logging.getLogger("courtmind.gemini_provider")


class GeminiProvider(BaseLLMProvider):
    """Google Gemini generation provider utilizing the official google-genai SDK."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-3.5-flash",
        temperature: float = 0.1,
        timeout: float = 60.0,
        max_retries: int = 3,
        max_output_tokens: int = 2048,
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name or "gemini-3.5-flash"
        self.temperature = float(temperature)
        self.timeout = float(timeout)
        self.max_retries = max(0, int(max_retries))
        self.max_output_tokens = int(max_output_tokens)

        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        """Instantiates or returns cached google.genai.Client."""
        if not self.api_key or not self.api_key.strip():
            raise LLMConfigurationError(
                message="GEMINI_API_KEY is not configured or is empty. Please set GEMINI_API_KEY in the environment.",
                provider="gemini",
            )

        if self._client is None:
            try:
                from google import genai

                self._client = genai.Client(api_key=self.api_key.strip())
            except ImportError as exc:
                raise LLMConfigurationError(
                    message="Official Google Gen AI SDK ('google-genai') is not installed.",
                    provider="gemini",
                    original_error=exc,
                ) from exc
            except Exception as exc:
                raise LLMConfigurationError(
                    message=f"Failed to initialize Gemini Client: {self._sanitize_error(str(exc))}",
                    provider="gemini",
                    original_error=exc,
                ) from exc

        return self._client

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Generates grounded completion from system instruction and user prompt."""
        return await self._execute_generation(system_prompt=system_prompt, contents=user_prompt)

    async def generate_general_reference(self, query: str) -> str:
        """Generates general legal reference text for statutory and doctrinal queries."""
        system_instruction = (
            "You are CourtMind's General Legal Reference Assistant. "
            "Provide clear, accurate, and structured explanations of Indian statutory provisions, "
            "legal doctrines, and landmark precedents. Always state statutory sections, operative elements, "
            "and landmark case citations where applicable."
        )
        return await self._execute_generation(system_prompt=system_instruction, contents=query)

    async def _execute_generation(self, system_prompt: str, contents: str) -> str:
        """Executes generation with retry, timeout, and structured error mapping."""
        client = self._get_client()

        from google.genai import types

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
        )

        last_error: Optional[Exception] = None
        attempt = 0
        total_attempts = self.max_retries + 1

        while attempt < total_attempts:
            attempt += 1
            try:
                logger.debug(
                    "Executing Gemini generation (model=%s, attempt=%d/%d, timeout=%.1fs)",
                    self.model_name,
                    attempt,
                    total_attempts,
                    self.timeout,
                )

                coro = client.aio.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config,
                )
                response = await asyncio.wait_for(coro, timeout=self.timeout)

                if response is None or getattr(response, "text", None) is None:
                    # Check finish reason or empty output
                    finish_reason = "unknown"
                    try:
                        candidates = getattr(response, "candidates", None)
                        if candidates and len(candidates) > 0:
                            finish_reason = str(getattr(candidates[0], "finish_reason", "empty"))
                    except Exception:
                        pass
                    raise LLMGenerationError(
                        message=f"Gemini returned an empty response (finish_reason: {finish_reason}).",
                        provider="gemini",
                    )

                text = response.text.strip()
                if not text:
                    raise LLMGenerationError(
                        message="Gemini returned empty text response.",
                        provider="gemini",
                    )
                return text

            except asyncio.TimeoutError as exc:
                last_error = exc
                sanitized_msg = f"Gemini request timed out after {self.timeout}s on attempt {attempt}/{total_attempts}."
                logger.warning(sanitized_msg)
                if attempt >= total_attempts:
                    raise LLMTimeoutError(
                        message=sanitized_msg,
                        provider="gemini",
                        original_error=exc,
                    ) from exc

            except LLMGenerationError:
                # Direct LLMGenerationError, re-raise without swallowing
                raise

            except Exception as exc:
                last_error = exc
                status_code = self._extract_status_code(exc)
                sanitized_msg = self._sanitize_error(str(exc))

                # Authentication / Permission (401, 403) -> No retry
                if status_code in (401, 403) or "API_KEY_INVALID" in sanitized_msg or "PERMISSION_DENIED" in sanitized_msg:
                    logger.error("Gemini authentication failure: %s", sanitized_msg)
                    raise LLMAuthenticationError(
                        message=f"Gemini authentication failed: {sanitized_msg}",
                        provider="gemini",
                        status_code=status_code,
                        original_error=exc,
                    ) from exc

                # Bad Request (400) -> No retry
                if status_code == 400 or "INVALID_ARGUMENT" in sanitized_msg:
                    logger.error("Gemini invalid request: %s", sanitized_msg)
                    raise LLMInvalidRequestError(
                        message=f"Gemini invalid request: {sanitized_msg}",
                        provider="gemini",
                        status_code=status_code,
                        original_error=exc,
                    ) from exc

                # Check for daily quota exhaustion (do NOT retry if daily limit exceeded)
                is_daily_quota = (
                    "per day limit exceeded" in sanitized_msg.lower()
                    or "daily" in sanitized_msg.lower()
                    or "free_tier_requests" in sanitized_msg.lower()
                    or "retry in" in sanitized_msg.lower()
                )
                if is_daily_quota:
                    logger.error("Gemini daily quota exhausted. Aborting immediate retries.")
                    raise LLMRateLimitError(
                        message=f"Gemini daily quota exceeded: {sanitized_msg}",
                        provider="gemini",
                        status_code=429,
                        original_error=exc,
                    ) from exc

                # Transient errors: Rate Limit (429) or Service Unavailable (500, 502, 503, 504)
                is_transient = (
                    status_code in (429, 500, 502, 503, 504)
                    or "RESOURCE_EXHAUSTED" in sanitized_msg
                    or "UNAVAILABLE" in sanitized_msg
                    or "high demand" in sanitized_msg.lower()
                    or "connection" in sanitized_msg.lower()
                )

                if is_transient and attempt < total_attempts:
                    backoff = (0.5 * (2 ** (attempt - 1))) + (random.uniform(0.1, 0.5))
                    logger.warning(
                        "Gemini transient failure (code=%s, attempt=%d/%d): %s. Retrying in %.2fs...",
                        status_code,
                        attempt,
                        total_attempts,
                        sanitized_msg,
                        backoff,
                    )
                    await asyncio.sleep(backoff)
                    continue

                # Exhausted retries or non-retriable failure
                if status_code == 429 or "RESOURCE_EXHAUSTED" in sanitized_msg:
                    raise LLMRateLimitError(
                        message=f"Gemini rate limit or quota exceeded: {sanitized_msg}",
                        provider="gemini",
                        status_code=429,
                        original_error=exc,
                    ) from exc

                if status_code in (500, 502, 503, 504) or "UNAVAILABLE" in sanitized_msg:
                    raise LLMUnavailableError(
                        message=f"Gemini service unavailable (code {status_code}): {sanitized_msg}",
                        provider="gemini",
                        status_code=status_code,
                        original_error=exc,
                    ) from exc

                # Fallback generic error
                raise LLMGenerationError(
                    message=f"Gemini generation error: {sanitized_msg}",
                    provider="gemini",
                    status_code=status_code,
                    original_error=exc,
                ) from exc

        # If loop exits without returning or raising
        raise LLMGenerationError(
            message=f"Gemini generation failed after {total_attempts} attempts: {self._sanitize_error(str(last_error))}",
            provider="gemini",
            original_error=last_error,
        )

    def _extract_status_code(self, exc: Exception) -> Optional[int]:
        """Extracts HTTP status code from Google GenAI SDK or HTTP exceptions."""
        code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
        if isinstance(code, int):
            return code
        # Search string for pattern '404', '429', '503', etc.
        match = re.search(r"\b(4\d\d|5\d\d)\b", str(exc))
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return None

    def _sanitize_error(self, message: str) -> str:
        """Strips potential API keys and credential strings from error messages."""
        if not message:
            return ""
        if self.api_key and len(self.api_key) > 6:
            message = message.replace(self.api_key, "[REDACTED_API_KEY]")
        # Redact generic AIzaSy... keys
        message = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_API_KEY]", message)
        return message

