from app.services.llm.base import BaseLLM
from app.core.config import settings
from app.core.logger import logger
from groq import AsyncGroq
import groq


class GroqService(BaseLLM):
    """
    Groq LLM implementation using the official SDK.
    """

    def __init__(self):
        self.model = settings.LLM_MODEL
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def generate(
        self,
        prompt: str,
        temperature: float = 0.2,
    ) -> str:
        try:
            response = await self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except groq.APITimeoutError as e:
            logger.error(f"Groq API timeout: {e}")
            raise TimeoutError("Request to Groq API timed out.") from e
        except groq.AuthenticationError as e:
            logger.error(f"Groq API authentication error: {e}")
            raise ValueError("Invalid Groq API key.") from e
        except groq.RateLimitError as e:
            logger.error(f"Groq API rate limit exceeded: {e}")
            raise RuntimeError("Groq API rate limit exceeded.") from e
        except groq.InternalServerError as e:
            logger.error(f"Groq internal server error: {e}")
            raise RuntimeError("Groq encountered an internal server error.") from e
        except groq.APIError as e:
            logger.error(f"Groq API error: {e}")
            raise RuntimeError(f"Groq API returned an error: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error in Groq generation: {e}")
            raise RuntimeError(f"Unexpected error: {e}") from e

    async def generate_stream(
        self,
        prompt: str,
        temperature: float = 0.2,
    ):
        try:
            stream = await self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=temperature,
                stream=True,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content is not None:
                    yield content
        except Exception as e:
            logger.error(f"Unexpected error in Groq streaming: {e}")
            raise RuntimeError(f"Unexpected streaming error: {e}") from e

    async def health_check(self) -> bool:
        try:
            # Retrieves the model definition to verify connectivity & API key validity
            await self.client.models.retrieve(self.model)
            return True
        except Exception as e:
            logger.error(f"Groq health check failed: {e}")
            return False