import uuid
from typing import List, Protocol
from app.models.chat import ChatMessage
from app.repositories.chat_repo import ChatRepository

class ConversationMemoryProvider(Protocol):
    """
    Abstraction for providing conversation history to the RAG Pipeline.
    Allows for future summarization, token budgeting, etc.
    """
    async def get_conversation_context(self, session_id: uuid.UUID) -> List[ChatMessage]:
        ...

class WindowedMemoryProvider:
    """
    MVP memory provider that returns the last N messages of a conversation.
    """
    def __init__(self, chat_repo: ChatRepository, max_messages: int = 10):
        self.chat_repo = chat_repo
        self.max_messages = max_messages

    async def get_conversation_context(self, session_id: uuid.UUID) -> List[ChatMessage]:
        return await self.chat_repo.get_session_history(session_id, limit=self.max_messages)
