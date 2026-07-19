import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.chat import ChatSession, ChatMessage

class ChatRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(self, user_id: Optional[uuid.UUID] = None, title: Optional[str] = None) -> ChatSession:
        chat_session = ChatSession(user_id=user_id, title=title)
        self.session.add(chat_session)
        await self.session.commit()
        await self.session.refresh(chat_session)
        return chat_session

    async def get_session(self, session_id: uuid.UUID) -> Optional[ChatSession]:
        stmt = select(ChatSession).where(ChatSession.id == session_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_user_sessions(self, user_id: uuid.UUID) -> List[ChatSession]:
        stmt = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_session(self, session_id: uuid.UUID, title: Optional[str] = None) -> Optional[ChatSession]:
        session = await self.get_session(session_id)
        if session:
            if title is not None:
                session.title = title
            await self.session.commit()
            await self.session.refresh(session)
        return session
        
    async def get_session_with_messages(self, session_id: uuid.UUID) -> Optional[ChatSession]:
        stmt = (
            select(ChatSession)
            .options(selectinload(ChatSession.messages).selectinload(ChatMessage.tickets))
            .where(ChatSession.id == session_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_session_history(self, session_id: uuid.UUID, limit: int = 50) -> List[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        messages = list(result.scalars().all())
        # Return in chronological order
        return messages[::-1]

    async def get_message(self, message_id: uuid.UUID) -> Optional[ChatMessage]:
        stmt = select(ChatMessage).where(ChatMessage.id == message_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def update_message_feedback(self, message_id: uuid.UUID, feedback: str) -> Optional[ChatMessage]:
        message = await self.get_message(message_id)
        if message:
            message.feedback = feedback
            await self.session.commit()
            await self.session.refresh(message)
        return message

    def _deduplicate_sources(self, sources: Optional[list]) -> Optional[list]:
        if not sources:
            return sources
        seen = set()
        deduped = []
        for s in sources:
            fname = s.get("filename")
            if fname not in seen:
                seen.add(fname)
                deduped.append(s)
        return deduped

    async def append_message(self, session_id: uuid.UUID, role: str, content: str, sources: Optional[list] = None) -> ChatMessage:
        deduped_sources = self._deduplicate_sources(sources) if role == 'assistant' else None
        message = ChatMessage(session_id=session_id, role=role, content=content, sources=deduped_sources)
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def append_exchange(self, session_id: uuid.UUID, user_message: str, assistant_message: str, sources: Optional[list] = None) -> tuple[uuid.UUID, uuid.UUID]:
        deduped_sources = self._deduplicate_sources(sources)
        u_msg = ChatMessage(session_id=session_id, role="user", content=user_message)
        a_msg = ChatMessage(session_id=session_id, role="assistant", content=assistant_message, sources=deduped_sources)
        self.session.add_all([u_msg, a_msg])
        await self.session.commit()
        await self.session.refresh(u_msg)
        await self.session.refresh(a_msg)
        return u_msg.id, a_msg.id

    async def delete_session(self, session_id: uuid.UUID) -> bool:
        chat_session = await self.get_session(session_id)
        if chat_session:
            await self.session.delete(chat_session)
            await self.session.commit()
            return True
        return False

    async def replace_last_assistant_message(self, session_id: uuid.UUID, content: str, sources: Optional[list] = None) -> Optional[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        msg = result.scalars().first()
        if msg and msg.role == 'assistant':
            msg.content = content
            msg.sources = self._deduplicate_sources(sources)
            await self.session.commit()
            await self.session.refresh(msg)
            return msg
        return None
