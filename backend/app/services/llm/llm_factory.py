from app.services.llm.groq_service import GroqService


class LLMFactory:
    @staticmethod
    def get_llm():
        """
        Returns the configured LLM provider.
        """

        return GroqService()