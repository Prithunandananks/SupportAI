from app.services.llm.base import BaseLLM


class GroqService(BaseLLM):
    """
    Placeholder implementation for the Groq LLM.
    The actual SDK integration will be added later.
    """

    async def generate(
        self,
        prompt: str,
        temperature: float = 0.2,
    ) -> str:
        return (
            "Groq integration is not implemented yet."
        )

    async def health_check(self) -> bool:
        return True