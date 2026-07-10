from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document

class AdminRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stats(self) -> Dict[str, Any]:
        # Basic counts
        total_users_stmt = select(func.count(User.id))
        total_convos_stmt = select(func.count(ChatSession.id))
        total_ai_msg_stmt = select(func.count(ChatMessage.id)).where(ChatMessage.role == "assistant")
        total_docs_stmt = select(func.count(Document.id))

        total_users = (await self.session.execute(total_users_stmt)).scalar() or 0
        total_convos = (await self.session.execute(total_convos_stmt)).scalar() or 0
        total_ai_messages = (await self.session.execute(total_ai_msg_stmt)).scalar() or 0
        total_documents = (await self.session.execute(total_docs_stmt)).scalar() or 0

        # For active users, let's say users who have created a session
        active_users_stmt = select(func.count(func.distinct(ChatSession.user_id)))
        active_users = (await self.session.execute(active_users_stmt)).scalar() or 0

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_conversations": total_convos,
            "total_ai_messages": total_ai_messages,
            "total_documents": total_documents,
        }

    async def get_recent_documents(self, limit: int = 10) -> List[Document]:
        stmt = select(Document).order_by(desc(Document.created_at)).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_recent_conversations(self, limit: int = 10) -> List[Dict[str, Any]]:
        msg_count_subq = (
            select(func.count(ChatMessage.id))
            .where(ChatMessage.session_id == ChatSession.id)
            .scalar_subquery()
        )
        
        stmt = (
            select(ChatSession, User, msg_count_subq.label("msg_count"))
            .outerjoin(User, ChatSession.user_id == User.id)
            .order_by(desc(ChatSession.created_at))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        
        conversations = []
        for session, user, msg_count in result.all():
            conversations.append({
                "id": session.id,
                "title": session.title,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
                "user": user,
                "message_count": msg_count
            })
        return conversations

    async def get_analytics(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=6) # 7 days including today

        # Group by day in SQLite. SQLite dates are stored as ISO8601 strings.
        # Use strftime to group by date: strftime('%Y-%m-%d', created_at)
        
        doc_stmt = (
            select(
                func.strftime('%Y-%m-%d', Document.created_at).label('date'),
                func.count(Document.id).label('count')
            )
            .where(Document.created_at >= start_date)
            .group_by('date')
            .order_by('date')
        )
        
        chat_stmt = (
            select(
                func.strftime('%Y-%m-%d', ChatSession.created_at).label('date'),
                func.count(ChatSession.id).label('count')
            )
            .where(ChatSession.created_at >= start_date)
            .group_by('date')
            .order_by('date')
        )
        
        doc_result = await self.session.execute(doc_stmt)
        chat_result = await self.session.execute(chat_stmt)

        daily_uploads = {row.date: row.count for row in doc_result.all()}
        daily_conversations = {row.date: row.count for row in chat_result.all()}

        # Generate the last 7 days list formatted
        days = []
        uploads_list = []
        conversations_list = []
        
        for i in range(7):
            d = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            day_name = (start_date + timedelta(days=i)).strftime('%a')
            days.append(day_name)
            uploads_list.append(daily_uploads.get(d, 0))
            conversations_list.append(daily_conversations.get(d, 0))

        return {
            "days": days,
            "uploads": uploads_list,
            "conversations": conversations_list
        }
