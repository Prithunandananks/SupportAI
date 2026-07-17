from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api import deps
from app.models.user import User
from app.models.ticket import Ticket, TicketCategory, TicketStatus
from app.models.chat import ChatMessage
from app.schemas.quality import QualityAnalyticsResponse

router = APIRouter()

@router.get("/analytics", response_model=QualityAnalyticsResponse)
async def get_quality_analytics(
    current_user: User = Depends(deps.require_role("Admin")),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    # Total flagged responses
    total_flagged_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT)
    total_flagged = (await db.execute(total_flagged_stmt)).scalar() or 0

    # Open tickets
    open_tickets_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.status == TicketStatus.OPEN)
    open_tickets = (await db.execute(open_tickets_stmt)).scalar() or 0

    # Resolved tickets
    resolved_tickets_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]))
    resolved_tickets = (await db.execute(resolved_tickets_stmt)).scalar() or 0

    # Average Resolution Time
    resolution_time_stmt = (
        select(
            func.avg(
                # SQLite doesn't natively support Date subtraction easily in seconds, wait. 
                # Use julianday in SQLite, but we use PostgreSQL mostly in production? 
                # SQLAlchemy EXTRACT('epoch') is safer, or func.extract('epoch', Ticket.closed_at - Ticket.created_at)
                # Let's use a simpler approach: fetch them and calculate in python if we want to be db agnostic
                Ticket.created_at, Ticket.closed_at
            )
        )
        .where(Ticket.category == TicketCategory.REPORT, Ticket.closed_at.isnot(None))
    )
    
    # Let's calculate average in python to avoid DB dialect issues with dates
    tickets_with_closed = (await db.execute(select(Ticket.created_at, Ticket.closed_at).where(Ticket.category == TicketCategory.REPORT, Ticket.closed_at.isnot(None)))).all()
    avg_hours = None
    if tickets_with_closed:
        total_seconds = sum((t.closed_at - t.created_at).total_seconds() for t in tickets_with_closed)
        avg_hours = round((total_seconds / len(tickets_with_closed)) / 3600, 2)

    # Most Common Report Reasons
    reasons_stmt = (
        select(Ticket.report_reason, func.count(Ticket.id).label('count'))
        .where(Ticket.category == TicketCategory.REPORT, Ticket.report_reason.isnot(None))
        .group_by(Ticket.report_reason)
        .order_by(desc('count'))
    )
    reasons_res = (await db.execute(reasons_stmt)).all()
    report_reasons = [{"reason": r.report_reason, "count": r.count} for r in reasons_res if r.report_reason]

    # Ticket Status Distribution
    status_stmt = (
        select(Ticket.status, func.count(Ticket.id).label('count'))
        .where(Ticket.category == TicketCategory.REPORT)
        .group_by(Ticket.status)
    )
    status_res = (await db.execute(status_stmt)).all()
    status_distribution = [{"status": s.status, "count": s.count} for s in status_res]

    # Recent Flagged Responses
    recent_stmt = (
        select(Ticket)
        .where(Ticket.category == TicketCategory.REPORT)
        .order_by(desc(Ticket.created_at))
        .limit(10)
    )
    recent_res = (await db.execute(recent_stmt)).scalars().all()
    recent_flags = [{
        "ticket_id": r.id,
        "ticket_number": r.ticket_number,
        "title": r.title,
        "reason": r.report_reason,
        "created_at": r.created_at,
        "status": r.status
    } for r in recent_res]

    # Most Reported Questions
    reported_q_stmt = (
        select(Ticket.chat_message_id, ChatMessage.content, ChatMessage.session_id, ChatMessage.created_at, func.count(Ticket.id).label('count'))
        .join(ChatMessage, Ticket.chat_message_id == ChatMessage.id)
        .where(Ticket.category == TicketCategory.REPORT, Ticket.chat_message_id.isnot(None))
        .group_by(Ticket.chat_message_id, ChatMessage.content, ChatMessage.session_id, ChatMessage.created_at)
        .order_by(desc('count'))
        .limit(10)
    )
    reported_q_res = (await db.execute(reported_q_stmt)).all()
    
    most_reported_questions = []
    for q in reported_q_res:
        user_msg_stmt = (
            select(ChatMessage.content)
            .where(
                ChatMessage.session_id == q.session_id,
                ChatMessage.role == 'user',
                ChatMessage.created_at < q.created_at
            )
            .order_by(desc(ChatMessage.created_at))
            .limit(1)
        )
        user_msg_res = (await db.execute(user_msg_stmt)).scalar()
        
        most_reported_questions.append({
            "message_id": q.chat_message_id,
            "customer_question": user_msg_res or "Unknown Question",
            "ai_response": q.content,
            "report_count": q.count
        })

    return QualityAnalyticsResponse(
        total_flagged=total_flagged,
        open_tickets=open_tickets,
        resolved_tickets=resolved_tickets,
        average_resolution_time_hours=avg_hours,
        report_reasons=report_reasons,
        status_distribution=status_distribution,
        recent_flags=recent_flags,
        most_reported_questions=most_reported_questions
    )
