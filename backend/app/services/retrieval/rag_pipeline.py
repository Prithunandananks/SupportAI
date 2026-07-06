import uuid
from typing import Tuple, List, Optional
from app.services.llm.llm_factory import LLMFactory
from app.services.retrieval.prompt_builder import PromptBuilder
from app.services.search import SearchService
from app.schemas.chat import SourceCitation
from app.services.chat.memory_provider import ConversationMemoryProvider


from app.services.retrieval.query_rewriter import QueryRewriter

class RAGPipeline:
    """
    Coordinates the complete Retrieval-Augmented Generation pipeline.
    """

    def __init__(self, search_service: SearchService, memory_provider: Optional[ConversationMemoryProvider] = None):
        self.search_service = search_service
        self.memory_provider = memory_provider
        self.query_rewriter = QueryRewriter()
        self.llm = LLMFactory.get_llm()

    async def run(
        self,
        question: str,
        session_id: Optional[uuid.UUID] = None,
    ) -> Tuple[str, List[SourceCitation]]:
        """
        Execute the complete RAG pipeline and return the answer along with source citations.
        """
        
        history = []
        if session_id and self.memory_provider:
            history = await self.memory_provider.get_conversation_context(session_id)

        queries = await self.query_rewriter.rewrite_and_generate_queries(question, history)
        search_results = await self.search_service.search(queries)

        contexts = []
        sources = []

        for result in search_results.points:
            payload = result.payload or {}
            text = payload.get("text", "")
            contexts.append(text)
            
            # Construct citation
            doc_id = payload.get("document_id", "unknown")
            filename = payload.get("filename", "unknown")
            chunk_idx = payload.get("chunk_index", 0)
            
            sources.append(
                SourceCitation(
                    document_id=doc_id,
                    filename=filename,
                    chunk_index=chunk_idx,
                    retrieved_text=text,
                    retrieval_score=result.score
                )
            )

        history = []
        if session_id and self.memory_provider:
            history = await self.memory_provider.get_conversation_context(session_id)

        prompt = PromptBuilder.build_prompt(
            question=question,
            contexts=contexts,
            history=history,
        )

        answer = await self.llm.generate(prompt)

        return answer, sources

    async def run_stream(self, question: str, session_id: Optional[uuid.UUID] = None):
        """
        Execute the RAG pipeline and yield a stream of tokens.
        """
        history = []
        if session_id and self.memory_provider:
            history = await self.memory_provider.get_conversation_context(session_id)

        queries = await self.query_rewriter.rewrite_and_generate_queries(question, history)
        search_results = await self.search_service.search(queries)

        contexts = []
        for result in search_results.points:
            payload = result.payload or {}
            contexts.append(payload.get("text", ""))

        prompt = PromptBuilder.build_prompt(
            question=question,
            contexts=contexts,
            history=history,
        )

        async for chunk in self.llm.generate_stream(prompt):
            yield chunk