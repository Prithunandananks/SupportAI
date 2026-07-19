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
        attribution_metadata = []
        seen_docs = set()

        rank = 1
        for result in search_results.points:
            payload = result.payload or {}
            text = payload.get("text", "")
            doc_id = payload.get("document_id", "unknown")
            chunk_idx = payload.get("chunk_index", 0)
            score = result.score or 0.0
            
            contexts.append(text)
            
            attribution_metadata.append({
                "document_id": doc_id,
                "chunk_index": chunk_idx,
                "retrieval_score": score,
                "rank": rank
            })
            rank += 1
            
            if doc_id not in seen_docs:
                seen_docs.add(doc_id)
                # Construct citation
                filename = payload.get("filename", "unknown")
                
                sources.append(
                    SourceCitation(
                        filename=filename,
                        retrieval_score=score
                    )
                )

        if not contexts:
            return "I couldn't find relevant information in the current knowledge base. Please try rephrasing your question or contact an administrator if you believe the information should exist.", [], []

        history = []
        if session_id and self.memory_provider:
            history = await self.memory_provider.get_conversation_context(session_id)

        prompt = PromptBuilder.build_prompt(
            question=question,
            contexts=contexts,
            history=history,
        )

        answer = await self.llm.generate(prompt)

        return answer, sources, attribution_metadata

    async def run_stream(self, question: str, session_id: Optional[uuid.UUID] = None, override_history: Optional[List] = None):
        """
        Execute the RAG pipeline and yield a stream of tokens.
        """
        history = []
        if override_history is not None:
            history = override_history
        elif session_id and self.memory_provider:
            history = await self.memory_provider.get_conversation_context(session_id)

        queries = await self.query_rewriter.rewrite_and_generate_queries(question, history)
        search_results = await self.search_service.search(queries)

        contexts = []
        sources = []
        attribution_metadata = []
        highest_score = 0.0
        seen_docs = set()

        rank = 1
        for result in search_results.points:
            payload = result.payload or {}
            text = payload.get("text", "")
            doc_id = payload.get("document_id", "unknown")
            chunk_idx = payload.get("chunk_index", 0)
            score = result.score or 0.0
            
            contexts.append(text)
            
            attribution_metadata.append({
                "document_id": doc_id,
                "chunk_index": chunk_idx,
                "retrieval_score": score,
                "rank": rank
            })
            rank += 1
            
            if score > highest_score:
                highest_score = score
                
            if doc_id not in seen_docs:
                seen_docs.add(doc_id)
                sources.append({
                    "filename": payload.get("filename", "unknown"),
                    "retrieval_score": score
                })

        # Calculate confidence
        confidence = None
        if highest_score > 0:
            confidence = int(highest_score * 100)

        if not contexts:
            yield {"content": "I couldn't find relevant information in the current knowledge base. Please try rephrasing your question or contact an administrator if you believe the information should exist."}
            if sources or confidence is not None:
                yield {"sources": sources, "confidence": confidence, "attribution_metadata": attribution_metadata}
            return

        prompt = PromptBuilder.build_prompt(
            question=question,
            contexts=contexts,
            history=history,
        )

        async for chunk in self.llm.generate_stream(prompt):
            yield {"content": chunk}
            
        if sources:
            yield {"sources": sources, "confidence": confidence, "attribution_metadata": attribution_metadata}