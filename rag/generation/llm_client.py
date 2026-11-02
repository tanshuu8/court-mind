"""Client wrapper for Large Language Model generation.

Supports:
- 'groq': Groq high-speed inference (Qwen/LLaMA chat models, official AsyncGroq SDK)
- 'gemini': Google Gemini official Gen AI SDK (asynchronous, retry with backoff, explicit failure)
- 'offline': Deterministic offline synthesizer strictly for offline diagnostics
"""
import logging
import os
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
from rag.generation.providers.gemini_provider import GeminiProvider
from rag.generation.providers.groq_provider import GroqProvider
from rag.generation.providers.offline_provider import OfflineProvider

logger = logging.getLogger("courtmind.llm_client")


class LLMClient:
    """Unified client orchestrating Large Language Model generation across providers."""

    def __init__(
        self,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
        max_output_tokens: Optional[int] = None,
    ) -> None:
        self.provider = (provider or os.getenv("LLM_PROVIDER", "groq")).lower().strip()

        # Model name resolution by provider
        if model_name and model_name.strip():
            self.model_name = model_name.strip()
        elif self.provider == "groq":
            self.model_name = os.getenv("GROQ_MODEL_NAME") or os.getenv("LLM_MODEL_NAME", "qwen/qwen3.8-27b")
        elif self.provider == "gemini":
            self.model_name = os.getenv("GEMINI_MODEL_NAME") or os.getenv("LLM_MODEL_NAME", "gemini-3.5-flash")
        else:
            self.model_name = os.getenv("LLM_MODEL_NAME", "qwen/qwen3.8-27b")

        self.temperature = float(temperature if temperature is not None else os.getenv("LLM_TEMPERATURE", 0.1))
        self.timeout = float(timeout if timeout is not None else os.getenv("LLM_TIMEOUT", 60.0))
        self.max_retries = int(max_retries if max_retries is not None else os.getenv("LLM_MAX_RETRIES", 2))
        self.max_output_tokens = int(max_output_tokens if max_output_tokens is not None else os.getenv("LLM_MAX_OUTPUT_TOKENS", 2048))

        # API key resolution
        if api_key and api_key.strip():
            self.api_key = api_key.strip()
        elif self.provider == "groq":
            self.api_key = (os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY", "")).strip()
        elif self.provider == "gemini":
            self.api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY", "")).strip()
        elif self.provider == "openai":
            self.api_key = (os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY", "")).strip()
        else:
            self.api_key = (os.getenv("LLM_API_KEY") or "").strip()

        # Instantiate provider instance
        self.provider_instance: BaseLLMProvider = self._init_provider()

    def _init_provider(self) -> BaseLLMProvider:
        """Initializes the configured LLM provider instance."""
        if self.provider == "groq":
            logger.info("Initializing Groq provider (model=%s)", self.model_name)
            return GroqProvider(
                api_key=self.api_key,
                model_name=self.model_name,
                temperature=self.temperature,
                timeout=self.timeout,
                max_retries=self.max_retries,
                max_output_tokens=self.max_output_tokens,
            )

        if self.provider == "gemini":
            logger.info("Initializing Gemini provider (model=%s)", self.model_name)
            return GeminiProvider(
                api_key=self.api_key,
                model_name=self.model_name,
                temperature=self.temperature,
                timeout=self.timeout,
                max_retries=self.max_retries,
                max_output_tokens=self.max_output_tokens,
            )

        if self.provider in ("offline", "mock"):
            logger.info("Initializing Offline provider (diagnostic mode)")
            return OfflineProvider()

        if self.provider == "openai":
            raise LLMConfigurationError(
                message="OpenAI provider is not active in this configuration. Please set LLM_PROVIDER=groq or LLM_PROVIDER=gemini.",
                provider="openai",
            )

        raise LLMConfigurationError(
            message=f"Unsupported LLM provider: {self.provider!r}. Supported providers: 'groq', 'gemini', 'offline'.",
            provider=self.provider,
        )

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Sends prompt to the configured LLM and returns grounded completion text.

        Explicit failure: If the provider fails, the exception is raised directly.
        A live provider failure will NEVER be silently replaced with an offline fallback.
        """
        return await self.provider_instance.generate_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

    async def generate_general_legal_response(self, query: str) -> str:
        """Generates authoritative answers to general legal, statutory, or doctrine questions (Mode B)."""
        return await self.provider_instance.generate_general_reference(query)
