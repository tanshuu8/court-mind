"""Groq provider implementation using the official Groq SDK.

Features:
- Asynchronous chat completion via AsyncGroq (or AsyncOpenAI compatible interface)
- Configurable model, temperature, timeout, and max output tokens
- Strict system instruction and user prompt separation
- Robust error handling for rate limits (HTTP 429), auth (401/403), and timeouts
- Redaction of API keys and credentials from all log and error outputs
"""
import asyncio
import logging
import random
import re
from typing import Any, Dict, List, Optional

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

logger = logging.getLogger("courtmind.groq_provider")


class GroqProvider(BaseLLMProvider):
    """Groq generation provider utilizing official AsyncGroq SDK."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "qwen/qwen3.8-27b",
        temperature: float = 0.1,
        timeout: float = 60.0,
        max_retries: int = 2,
        max_output_tokens: int = 2048,
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name or "qwen/qwen3.8-27b"
        self.temperature = float(temperature)
        self.timeout = float(timeout)
        self.max_retries = max(0, int(max_retries))
        # Clamp to 600 to comply with Groq free-tier 1000 OTPM rate limits across consecutive requests
        self.max_output_tokens = min(int(max_output_tokens), 600)

        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        """Instantiates or returns cached AsyncGroq or AsyncOpenAI client."""
        if not self.api_key or not self.api_key.strip():
            raise LLMConfigurationError(
                message="GROQ_API_KEY is not configured or is empty. Please set GROQ_API_KEY in the environment.",
                provider="groq",
            )

        if self._client is None:
            clean_key = self.api_key.strip()
            # Try official groq SDK first
            try:
                from groq import AsyncGroq
                self._client = AsyncGroq(api_key=clean_key, timeout=self.timeout)
            except ImportError:
                # Fallback to AsyncOpenAI with Groq base_url
                try:
                    from openai import AsyncOpenAI
                    self._client = AsyncOpenAI(
                        api_key=clean_key,
                        base_url="https://api.groq.com/openai/v1",
                        timeout=self.timeout,
                    )
                except Exception as exc:
                    raise LLMConfigurationError(
                        message=f"Neither 'groq' nor 'openai' SDK is installed: {self._sanitize_error(str(exc))}",
                        provider="groq",
                        original_error=exc,
                    ) from exc
            except Exception as exc:
                raise LLMConfigurationError(
                    message=f"Failed to initialize Groq client: {self._sanitize_error(str(exc))}",
                    provider="groq",
                    original_error=exc,
                ) from exc

        return self._client

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Generates grounded legal completion from system instruction and user prompt."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return await self._execute_chat_completion(messages=messages)

    async def generate_general_reference(self, query: str) -> str:
        """Generates general legal reference text for statutory and doctrinal queries (Mode B)."""
        system_instruction = (
            "You are CourtMind's General Legal Reference Assistant. "
            "Provide clear, accurate, and structured explanations of Indian statutory provisions, "
            "legal doctrines, and landmark precedents. Always state statutory sections, operative elements, "
            "and landmark case citations where applicable. Maintain a professional, objective tone."
        )
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": query},
        ]
        return await self._execute_chat_completion(messages=messages)

    async def _execute_chat_completion(self, messages: List[Dict[str, str]]) -> str:
        """Executes chat completion with retry, timeout, and structured error handling."""
        client = self._get_client()

        last_error: Optional[Exception] = None
        attempt = 0
        total_attempts = self.max_retries + 1

        while attempt < total_attempts:
            attempt += 1
            try:
                logger.debug(
                    "Executing Groq generation (model=%s, attempt=%d/%d, timeout=%.1fs)",
                    self.model_name,
                    attempt,
                    total_attempts,
                    self.timeout,
                )

                coro = client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_output_tokens,
                )

                response = await asyncio.wait_for(coro, timeout=self.timeout)

                if not response or not response.choices:
                    raise LLMGenerationError(
                        message="Groq returned empty response choices.",
                        provider="groq",
                    )

                choice = response.choices[0]
                text = (choice.message.content or "").strip()

                # If model is reasoning-only and placed output in reasoning
                if not text and hasattr(choice.message, "reasoning") and choice.message.reasoning:
                    text = choice.message.reasoning.strip()

                if not text:
                    raise LLMGenerationError(
                        message="Groq returned empty completion text.",
                        provider="groq",
                    )

                return text

            except asyncio.TimeoutError as exc:
                last_error = exc
                logger.warning("Groq request timed out (timeout=%.1fs, attempt=%d/%d)", self.timeout, attempt, total_attempts)
                if attempt >= total_attempts:
                    raise LLMTimeoutError(
                        message=f"Groq request timed out after {self.timeout}s.",
                        provider="groq",
                        status_code=408,
                        original_error=exc,
                    ) from exc
                await asyncio.sleep(0.5 * attempt)
                continue

            except LLMGenerationError:
                raise

            except Exception as exc:
                last_error = exc
                status_code = self._extract_status_code(exc)
                sanitized_msg = self._sanitize_error(str(exc))

                # Authentication / Permission (401, 403) -> Fatal, no retry
                if status_code in (401, 403) or "invalid_api_key" in sanitized_msg.lower() or "unauthorized" in sanitized_msg.lower():
                    logger.error("Groq authentication failure: %s", sanitized_msg)
                    raise LLMAuthenticationError(
                        message=f"Groq authentication failed: {sanitized_msg}",
                        provider="groq",
                        status_code=status_code,
                        original_error=exc,
                    ) from exc

                # Invalid Request / Model Not Found (400, 404) -> Fatal, no retry
                if status_code in (400, 404) or "model_not_found" in sanitized_msg.lower():
                    logger.error("Groq invalid request: %s", sanitized_msg)
                    raise LLMInvalidRequestError(
                        message=f"Groq invalid request: {sanitized_msg}",
                        provider="groq",
                        status_code=status_code,
                        original_error=exc,
                    ) from exc

                # Rate Limit / Quota Exceeded (429)
                if status_code == 429 or "rate_limit_exceeded" in sanitized_msg.lower():
                    # Check if retry header or daily limit is indicated
                    logger.warning("Groq rate limit encountered: %s", sanitized_msg)
                    raise LLMRateLimitError(
                        message=f"Groq rate limit exceeded: {sanitized_msg}",
                        provider="groq",
                        status_code=429,
                        original_error=exc,
                    ) from exc

                # Transient Server Errors (500, 502, 503, 504) -> Retriable
                if status_code in (500, 502, 503, 504) or "service_unavailable" in sanitized_msg.lower():
                    if attempt < total_attempts:
                        backoff = 0.5 * (2 ** (attempt - 1)) + random.uniform(0.1, 0.3)
                        logger.warning("Groq transient error (%s). Retrying in %.2fs...", sanitized_msg, backoff)
                        await asyncio.sleep(backoff)
                        continue
                    raise LLMUnavailableError(
                        message=f"Groq service unavailable: {sanitized_msg}",
                        provider="groq",
                        status_code=status_code,
                        original_error=exc,
                    ) from exc

                # Other generic errors
                raise LLMGenerationError(
                    message=f"Groq generation error: {sanitized_msg}",
                    provider="groq",
                    status_code=status_code,
                    original_error=exc,
                ) from exc

        raise LLMGenerationError(
            message=f"Groq generation failed after {total_attempts} attempts: {self._sanitize_error(str(last_error))}",
            provider="groq",
            original_error=last_error,
        )

    def _extract_status_code(self, exc: Exception) -> Optional[int]:
        """Extracts HTTP status code from exception."""
        code = getattr(exc, "status_code", None) or getattr(exc, "code", None)
        if isinstance(code, int):
            return code
        match = re.search(r"\b(4\d\d|5\d\d)\b", str(exc))
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return None

    def _sanitize_error(self, message: str) -> str:
        """Strips API keys and secrets from error messages."""
        if not message:
            return ""
        if self.api_key and len(self.api_key) > 6:
            message = message.replace(self.api_key, "[REDACTED_API_KEY]")
        # Redact gsk_... keys
        message = re.sub(r"gsk_[0-9A-Za-z]{30,}", "[REDACTED_GROQ_KEY]", message)
        # Redact AIza... keys
        message = re.sub(r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_GEMINI_KEY]", message)
        return message
