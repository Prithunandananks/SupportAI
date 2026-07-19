import uuid
import asyncio
from fastapi import HTTPException, status
from app.services.retrieval.rag_pipeline import RAGPipeline
from app.core.logger import logger
from app.repositories.chat_repo import ChatRepository
from app.services.llm.llm_factory import LLMFactory

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
                await self.chat_repo.append_exchange(session_id, message, answer, sources)
                
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
            history = None
            session = None
            if session_id and self.chat_repo:
                session = await self.chat_repo.get_session(session_id)
                history = await self.chat_repo.get_session_history(session_id, limit=50)

            override_history = None
            if regenerate and history:
                override_history = history.copy()
                if override_history and override_history[-1].role == 'assistant':
                    override_history.pop()
                if override_history and override_history[-1].role == 'user':
                    override_history.pop()

            title_task = None
            if not regenerate and history is not None and len(history) == 0 and session and (session.title == message or session.title == "New Chat"):
                llm = LLMFactory.get_llm()
                prompt = f"Generate a highly concise 3 to 5 word title for a conversation starting with this user message. Respond ONLY with the title, no quotes or prefixes.\n\nUser message: {message}"
                title_task = asyncio.create_task(llm.generate(prompt=prompt, temperature=0.7))

            full_answer = ""
            final_sources = None
            async for item in self.rag_pipeline.run_stream(question=message, session_id=session_id, override_history=override_history):
                if isinstance(item, dict):
                    if "content" in item:
                        full_answer += item["content"]
                    if "sources" in item:
                        final_sources = item["sources"]
                yield item
                
            if session_id and self.chat_repo:
                if regenerate:
                    replaced_msg = await self.chat_repo.replace_last_assistant_message(session_id, full_answer, final_sources)
                    if replaced_msg:
                        yield {"message_id": str(replaced_msg.id)}
                else:
                    u_id, a_id = await self.chat_repo.append_exchange(session_id, message, full_answer, final_sources)
                    yield {"user_message_id": str(u_id), "message_id": str(a_id)}

            if title_task:
                try:
                    generated_title = await title_task
                    generated_title = generated_title.strip('"\' ')
                    if session_id and self.chat_repo:
                        await self.chat_repo.update_session(session_id, title=generated_title)
                    yield {"title": generated_title}
                except Exception as e:
                    logger.error(f"Failed to generate title: {e}")
                
        except Exception as e:
            logger.error(f"Unexpected error in ChatOrchestrator streaming: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while streaming your request.",
            )
