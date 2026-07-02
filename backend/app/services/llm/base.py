from abc import ABC, abstractmethod


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
    async def health_check(self) -> bool:
        """
        Verify that the provider is reachable.
        """
        pass