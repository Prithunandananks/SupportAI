import uuid
from fastapi import HTTPException, status
from app.services.retrieval.rag_pipeline import RAGPipeline
from app.core.logger import logger
from app.repositories.chat_repo import ChatRepository

class ChatOrchestrator:
    def __init__(self, rag_pipeline: RAGPipeline, chat_repo: ChatRepository = None):
        self.rag_pipeline = rag_pipeline
        self.chat_repo = chat_repo

    async def process_message(self, message: str, session_id: uuid.UUID = None):
        """
        Processes a user message and returns the generated answer.
        Optionally takes a session_id to append to conversation history.
        """
        try:
            answer, sources = await self.rag_pipeline.run(question=message, session_id=session_id)
            
            if session_id and self.chat_repo:
                await self.chat_repo.append_exchange(session_id, message, answer)
                
            return answer, sources
        except Exception as e:
            logger.error(f"Unexpected error in ChatOrchestrator: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while processing your request.",
            )

    async def process_message_stream(self, message: str, session_id: uuid.UUID = None, regenerate: bool = False):
        """
        Processes a user message and yields the generated answer as a stream.
        """
        try:
            override_history = None
            if regenerate and session_id and self.chat_repo:
                history = await self.chat_repo.get_session_history(session_id, limit=50)
                if history and history[-1].role == 'assistant':
                    history.pop()
                if history and history[-1].role == 'user':
                    history.pop()
                override_history = history

            full_answer = ""
            async for item in self.rag_pipeline.run_stream(question=message, session_id=session_id, override_history=override_history):
                if isinstance(item, dict) and "content" in item:
                    full_answer += item["content"]
                yield item
                
            if session_id and self.chat_repo:
                if regenerate:
                    await self.chat_repo.replace_last_assistant_message(session_id, full_answer)
                else:
                    await self.chat_repo.append_exchange(session_id, message, full_answer)
                
        except Exception as e:
            logger.error(f"Unexpected error in ChatOrchestrator streaming: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while streaming your request.",
            )
