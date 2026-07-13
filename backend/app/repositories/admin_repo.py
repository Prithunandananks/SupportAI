from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, cast, Date

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

        # Feedback counts
        from app.models.chat import FeedbackEnum
        likes_stmt = select(func.count(ChatMessage.id)).where(ChatMessage.feedback == FeedbackEnum.LIKE)
        dislikes_stmt = select(func.count(ChatMessage.id)).where(ChatMessage.feedback == FeedbackEnum.DISLIKE)
        likes = (await self.session.execute(likes_stmt)).scalar() or 0
        dislikes = (await self.session.execute(dislikes_stmt)).scalar() or 0
        total_feedback = likes + dislikes
        positive_feedback = round((likes / total_feedback) * 100, 1) if total_feedback > 0 else None
        negative_feedback = round((dislikes / total_feedback) * 100, 1) if total_feedback > 0 else None

        # Reports counts
        from app.models.ticket import Ticket, TicketCategory, TicketStatus
        total_reports_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT)
        open_reports_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.status == TicketStatus.OPEN)
        closed_reports_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]))
        total_reports = (await self.session.execute(total_reports_stmt)).scalar() or 0
        open_reports = (await self.session.execute(open_reports_stmt)).scalar() or 0
        closed_reports = (await self.session.execute(closed_reports_stmt)).scalar() or 0
        
        # Report rate (% of AI messages reported)
        report_rate = round((total_reports / total_ai_messages) * 100, 1) if total_ai_messages > 0 else None

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_conversations": total_convos,
            "total_ai_messages": total_ai_messages,
            "total_documents": total_documents,
            "flagged_questions": total_reports,
            "average_confidence": None,
            "positive_feedback": positive_feedback,
            "negative_feedback": negative_feedback,
            "likes": likes,
            "dislikes": dislikes,
            "total_reports": total_reports,
            "open_reports": open_reports,
            "closed_reports": closed_reports,
            "report_rate": report_rate
        }

    async def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        # Fetch recent documents
        doc_stmt = select(Document).order_by(desc(Document.created_at)).limit(limit)
        docs = (await self.session.execute(doc_stmt)).scalars().all()
        
        # Fetch recent conversations
        chat_stmt = select(ChatSession).order_by(desc(ChatSession.created_at)).limit(limit)
        chats = (await self.session.execute(chat_stmt)).scalars().all()
        
        activities = []
        for d in docs:
            activities.append({
                "id": f"doc-{d.id}",
                "type": "Document uploaded",
                "description": d.filename,
                "created_at": d.created_at
            })
            
        for c in chats:
            title = c.title or "New Chat"
            activities.append({
                "id": f"chat-{c.id}",
                "type": "Conversation created",
                "description": title,
                "created_at": c.created_at
            })

        try:
            # We don't import Ticket at the top to avoid circular imports, but let's do it safely
            from app.models.ticket import Ticket, TicketMessage
            
            ticket_stmt = select(Ticket).order_by(desc(Ticket.created_at)).limit(limit)
            tickets = (await self.session.execute(ticket_stmt)).scalars().all()
            
            msg_stmt = select(TicketMessage).order_by(desc(TicketMessage.created_at)).limit(limit)
            msgs = (await self.session.execute(msg_stmt)).scalars().all()

            for t in tickets:
                activities.append({
                    "id": f"ticket-{t.id}",
                    "type": "Ticket created",
                    "description": t.title,
                    "created_at": t.created_at
                })
                
            for m in msgs:
                activities.append({
                    "id": f"msg-{m.id}",
                    "type": "Ticket answered",
                    "description": f"Message on ticket",
                    "created_at": m.created_at
                })
        except Exception:
            # Tickets tables may not exist yet if migrations haven't run
            await self.session.rollback()
            
        # Sort by created_at descending
        activities.sort(key=lambda x: x["created_at"], reverse=True)
        return activities[:limit]

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
                cast(Document.created_at, Date).label('date'),
                func.count(Document.id).label('count')
            )
            .where(Document.created_at >= start_date)
            .group_by(cast(Document.created_at, Date))
            .order_by(cast(Document.created_at, Date))
        )
        
        chat_stmt = (
            select(
                cast(ChatSession.created_at, Date).label('date'),
                func.count(ChatSession.id).label('count')
            )
            .where(ChatSession.created_at >= start_date)
            .group_by(cast(ChatSession.created_at, Date))
            .order_by(cast(ChatSession.created_at, Date))
        )
        
        doc_result = await self.session.execute(doc_stmt)
        chat_result = await self.session.execute(chat_stmt)

        daily_uploads = {}
        for row in doc_result.all():
            # In SQLite, cast(..., Date) might return string or datetime.date depending on driver.
            # In PostgreSQL asyncpg, it returns datetime.date.
            d_str = str(row.date)[:10] if row.date else None
            if d_str:
                daily_uploads[d_str] = row.count

        daily_conversations = {}
        for row in chat_result.all():
            d_str = str(row.date)[:10] if row.date else None
            if d_str:
                daily_conversations[d_str] = row.count

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
