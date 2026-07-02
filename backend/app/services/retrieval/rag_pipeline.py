from app.services.llm.llm_factory import LLMFactory
from app.services.retrieval.prompt_builder import PromptBuilder
from app.services.retrieval.search_service import SearchService


class RAGPipeline:
    """
    Coordinates the complete Retrieval-Augmented Generation pipeline.
    """

    def __init__(self):
        self.search_service = SearchService()
        self.llm = LLMFactory.get_llm()

    async def run(
        self,
        question: str,
    ) -> str:
        """
        Execute the complete RAG pipeline.
        """

        search_results = self.search_service.search(question)

        contexts = []

        for result in search_results.points:
            payload = result.payload or {}
            contexts.append(payload.get("text", ""))

        prompt = PromptBuilder.build_prompt(
            question=question,
            contexts=contexts,
        )

        answer = await self.llm.generate(prompt)

        return answer