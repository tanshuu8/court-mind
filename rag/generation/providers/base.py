"""Abstract Base Class for LLM providers."""
from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    """Abstract interface for large language model generation providers."""

    @abstractmethod
    async def generate_response(self, system_prompt: str, user_prompt: str) -> str:
        """Generates grounded completion from system instruction and user prompt."""
        raise NotImplementedError

    @abstractmethod
    async def generate_general_reference(self, query: str) -> str:
        """Generates general legal reference text for statutory and doctrinal queries."""
        raise NotImplementedError

