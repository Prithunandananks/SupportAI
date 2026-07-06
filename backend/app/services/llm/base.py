from abc import ABC, abstractmethod
from typing import AsyncGenerator


class BaseLLM(ABC):
    """
    Abstract base class for all LLM providers.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        temperature: float = 0.2,
    ) -> str:
        """
        Generate a response from the language model.
        """
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        temperature: float = 0.2,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from the language model.
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Verify that the provider is reachable.
        """
        pass