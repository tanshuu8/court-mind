from typing import Any, Dict, List, Optional


class LLMClient:
    """Client wrapper for Large Language Model generation."""

    def __init__(
        self,
        provider: str = "openai",
        model_name: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        temperature: float = 0.0,
    ) -> None:
        self.provider = provider
        self.model_name = model_name
        self.api_key = api_key
        self.temperature = temperature

    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Sends prompt to the configured LLM and returns generated completion text.

        TODO:
            1. Initialize official SDK client (e.g. openai.AsyncOpenAI / langchain).
            2. Send formatted system and user messages.
            3. Handle rate limits and retries.
            4. Return strict grounded completion text.
        """
        raise NotImplementedError("LLMClient.generate_response() will be implemented in Phase 3.")
