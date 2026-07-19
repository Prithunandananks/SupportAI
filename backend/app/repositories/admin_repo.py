from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, cast, Date
from app.db.session import tenant_id_var

from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document

class AdminRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stats(self) -> Dict[str, Any]:
        # Basic counts
        total_users_stmt = select(func.count(User.id)).where(User.tenant_id == tenant_id_var.get())
        total_convos_stmt = select(func.count(ChatSession.id)).where(ChatSession.tenant_id == tenant_id_var.get())
        total_ai_msg_stmt = select(func.count(ChatMessage.id)).where(ChatMessage.role == "assistant", ChatMessage.tenant_id == tenant_id_var.get())
        total_docs_stmt = select(func.count(Document.id)).where(Document.tenant_id == tenant_id_var.get())

        total_users = (await self.session.execute(total_users_stmt)).scalar() or 0
        total_convos = (await self.session.execute(total_convos_stmt)).scalar() or 0
        total_ai_messages = (await self.session.execute(total_ai_msg_stmt)).scalar() or 0
        total_documents = (await self.session.execute(total_docs_stmt)).scalar() or 0

        # For active users, let's say users who have created a session
        active_users_stmt = select(func.count(func.distinct(ChatSession.user_id))).where(ChatSession.tenant_id == tenant_id_var.get())
        active_users = (await self.session.execute(active_users_stmt)).scalar() or 0

        # Feedback counts
        from app.models.chat import FeedbackEnum
        likes_stmt = select(func.count(ChatMessage.id)).where(ChatMessage.feedback == FeedbackEnum.LIKE, ChatMessage.tenant_id == tenant_id_var.get())
        dislikes_stmt = select(func.count(ChatMessage.id)).where(ChatMessage.feedback == FeedbackEnum.DISLIKE, ChatMessage.tenant_id == tenant_id_var.get())
        likes = (await self.session.execute(likes_stmt)).scalar() or 0
        dislikes = (await self.session.execute(dislikes_stmt)).scalar() or 0
        total_feedback = likes + dislikes
        positive_feedback = round((likes / total_feedback) * 100, 1) if total_feedback > 0 else None
        negative_feedback = round((dislikes / total_feedback) * 100, 1) if total_feedback > 0 else None

        # Reports counts
        from app.models.ticket import Ticket, TicketCategory, TicketStatus, TicketInternalNote, TicketStatusHistory, TicketHistoryEvent
        total_reports_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.tenant_id == tenant_id_var.get())
        open_reports_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.status == TicketStatus.OPEN, Ticket.tenant_id == tenant_id_var.get())
        closed_reports_stmt = select(func.count(Ticket.id)).where(Ticket.category == TicketCategory.REPORT, Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]), Ticket.tenant_id == tenant_id_var.get())
        
        assigned_tickets_stmt = select(func.count(Ticket.id)).where(Ticket.assigned_admin_id.isnot(None), Ticket.tenant_id == tenant_id_var.get())
        unassigned_tickets_stmt = select(func.count(Ticket.id)).where(Ticket.assigned_admin_id.is_(None), Ticket.tenant_id == tenant_id_var.get())
        admin_users_stmt = select(func.count(User.id)).where(User.tenant_id == tenant_id_var.get()).where(func.lower(User.role) == "admin")
        
        total_notes_stmt = select(func.count(TicketInternalNote.id)).where(TicketInternalNote.tenant_id == tenant_id_var.get())
        tickets_with_notes_stmt = select(func.count(func.distinct(TicketInternalNote.ticket_id))).where(TicketInternalNote.tenant_id == tenant_id_var.get())
        
        auto_assigned_stmt = select(func.count(func.distinct(TicketStatusHistory.ticket_id))).where(TicketStatusHistory.event_type == TicketHistoryEvent.AUTO_ASSIGNED, TicketStatusHistory.tenant_id == tenant_id_var.get())
        manual_assigned_stmt = select(func.count(TicketStatusHistory.id)).where(TicketStatusHistory.event_type == TicketHistoryEvent.ASSIGNMENT_CHANGED, TicketStatusHistory.tenant_id == tenant_id_var.get())
        
        total_reports = (await self.session.execute(total_reports_stmt)).scalar() or 0
        open_reports = (await self.session.execute(open_reports_stmt)).scalar() or 0
        closed_reports = (await self.session.execute(closed_reports_stmt)).scalar() or 0
        assigned_tickets = (await self.session.execute(assigned_tickets_stmt)).scalar() or 0
        unassigned_tickets = (await self.session.execute(unassigned_tickets_stmt)).scalar() or 0
        admin_users = (await self.session.execute(admin_users_stmt)).scalar() or 0
        total_internal_notes = (await self.session.execute(total_notes_stmt)).scalar() or 0
        tickets_with_notes = (await self.session.execute(tickets_with_notes_stmt)).scalar() or 0
        
        auto_assigned_tickets = (await self.session.execute(auto_assigned_stmt)).scalar() or 0
        manual_assignments = (await self.session.execute(manual_assigned_stmt)).scalar() or 0
        
        average_agent_load = round((assigned_tickets / admin_users), 1) if admin_users > 0 else 0.0
        average_notes_per_ticket = round((total_internal_notes / total_reports), 1) if total_reports > 0 else 0.0
        
        # Report rate (% of AI messages reported)
        report_rate = round((total_reports / total_ai_messages) * 100, 1) if total_ai_messages > 0 else None

        # SLA Metrics
        now_utc = datetime.now(timezone.utc)
        resolved_tickets_stmt = select(Ticket).where(Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]), Ticket.tenant_id == tenant_id_var.get())
        resolved_tickets = (await self.session.execute(resolved_tickets_stmt)).scalars().all()
        
        total_resolved = len(resolved_tickets)
        within_sla = 0
        total_first_response_time = 0
        total_resolution_time = 0
        first_response_count = 0
        
        for t in resolved_tickets:
            breached = False
            if t.first_response_due and not t.first_response_at and t.closed_at > t.first_response_due:
                breached = True
            elif t.first_response_due and t.first_response_at and t.first_response_at > t.first_response_due:
                breached = True
            elif t.resolution_due and t.closed_at and t.closed_at > t.resolution_due:
                breached = True
                
            if not breached:
                within_sla += 1
                
            if t.first_response_at and t.created_at:
                total_first_response_time += (t.first_response_at - t.created_at).total_seconds()
                first_response_count += 1
                
            if t.closed_at and t.created_at:
                total_resolution_time += (t.closed_at - t.created_at).total_seconds()

        sla_compliance_rate = round((within_sla / total_resolved) * 100, 1) if total_resolved > 0 else 100.0
        avg_first_response_time_hrs = round((total_first_response_time / first_response_count) / 3600, 1) if first_response_count > 0 else 0.0
        avg_resolution_time_hrs = round((total_resolution_time / total_resolved) / 3600, 1) if total_resolved > 0 else 0.0
        
        open_tickets_stmt = select(Ticket).where(Ticket.status.notin_([TicketStatus.RESOLVED, TicketStatus.CLOSED]), Ticket.tenant_id == tenant_id_var.get())
        open_tickets = (await self.session.execute(open_tickets_stmt)).scalars().all()
        
        overdue_tickets = 0
        sla_breached_open = 0
        for t in open_tickets:
            if t.first_response_due and not t.first_response_at and now_utc > t.first_response_due:
                overdue_tickets += 1
                sla_breached_open += 1
            elif t.resolution_due and now_utc > t.resolution_due:
                overdue_tickets += 1
                sla_breached_open += 1
            elif t.first_response_due and t.first_response_at and t.first_response_at > t.first_response_due:
                sla_breached_open += 1
                
        sla_breached_tickets = (total_resolved - within_sla) + sla_breached_open

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
            "report_rate": report_rate,
            "assigned_tickets": assigned_tickets,
            "unassigned_tickets": unassigned_tickets,
            "average_agent_load": average_agent_load,
            "tickets_with_notes": tickets_with_notes,
            "total_internal_notes": total_internal_notes,
            "average_notes_per_ticket": average_notes_per_ticket,
            "sla_compliance_rate": sla_compliance_rate,
            "sla_breached_tickets": sla_breached_tickets,
            "average_first_response_time": avg_first_response_time_hrs,
            "average_resolution_time": avg_resolution_time_hrs,
            "overdue_tickets": overdue_tickets,
            "auto_assigned_tickets": auto_assigned_tickets,
            "manual_assignments": manual_assignments
        }

    async def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        # Fetch recent documents
        doc_stmt = select(Document).where(Document.tenant_id == tenant_id_var.get()).order_by(desc(Document.created_at)).limit(limit)
        docs = (await self.session.execute(doc_stmt)).scalars().all()
        
        # Fetch recent conversations
        chat_stmt = select(ChatSession).where(ChatSession.tenant_id == tenant_id_var.get()).order_by(desc(ChatSession.created_at)).limit(limit)
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
            
            ticket_stmt = select(Ticket).where(Ticket.tenant_id == tenant_id_var.get()).order_by(desc(Ticket.created_at)).limit(limit)
            tickets = (await self.session.execute(ticket_stmt)).scalars().all()
            
            msg_stmt = select(TicketMessage).where(TicketMessage.tenant_id == tenant_id_var.get()).order_by(desc(TicketMessage.created_at)).limit(limit)
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
        stmt = select(Document).where(Document.tenant_id == tenant_id_var.get()).order_by(desc(Document.created_at)).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_recent_conversations(self, limit: int = 10) -> List[Dict[str, Any]]:
        msg_count_subq = (
            select(func.count(ChatMessage.id))
            .where(ChatMessage.session_id == ChatSession.id, ChatMessage.tenant_id == tenant_id_var.get())
            .scalar_subquery()
        )
        
        stmt = (
            select(ChatSession, User, msg_count_subq.label("msg_count"))
            .outerjoin(User, ChatSession.user_id == User.id)
            .where(ChatSession.tenant_id == tenant_id_var.get())
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
            .where(Document.created_at >= start_date, Document.tenant_id == tenant_id_var.get())
            .group_by(cast(Document.created_at, Date))
            .order_by(cast(Document.created_at, Date))
        )
        
        chat_stmt = (
            select(
                cast(ChatSession.created_at, Date).label('date'),
                func.count(ChatSession.id).label('count')
            )
            .where(ChatSession.created_at >= start_date, ChatSession.tenant_id == tenant_id_var.get())
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

        # SLA Compliance Trend (last 7 days)
        from app.models.ticket import Ticket, TicketStatus
        
        sla_compliance_trend = []
        resolution_time_trend = []
        
        for i in range(7):
            d_start = start_date + timedelta(days=i)
            d_end = d_start + timedelta(days=1)
            
            day_tickets_stmt = select(Ticket).where(
                Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
                Ticket.closed_at >= d_start,
                Ticket.closed_at < d_end,
                Ticket.tenant_id == tenant_id_var.get()
            )
            day_tickets = (await self.session.execute(day_tickets_stmt)).scalars().all()
            
            if not day_tickets:
                sla_compliance_trend.append(100.0)
                resolution_time_trend.append(0.0)
                continue
                
            day_within_sla = 0
            day_res_time = 0
            for t in day_tickets:
                breached = False
                if t.first_response_due and not t.first_response_at and t.closed_at and t.closed_at > t.first_response_due:
                    breached = True
                elif t.first_response_due and t.first_response_at and t.first_response_at > t.first_response_due:
                    breached = True
                elif t.resolution_due and t.closed_at and t.closed_at > t.resolution_due:
                    breached = True
                    
                if not breached:
                    day_within_sla += 1
                    
                if t.closed_at and t.created_at:
                    day_res_time += (t.closed_at - t.created_at).total_seconds()
                    
            sla_compliance_trend.append(round((day_within_sla / len(day_tickets)) * 100, 1))
            resolution_time_trend.append(round((day_res_time / len(day_tickets)) / 3600, 1))
            
        # Priority vs Resolution Time
        priority_stmt = select(Ticket).where(Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]), Ticket.tenant_id == tenant_id_var.get())
        all_resolved = (await self.session.execute(priority_stmt)).scalars().all()
        
        priority_stats = {}
        for t in all_resolved:
            p = t.priority.value if hasattr(t.priority, 'value') else str(t.priority)
            if p not in priority_stats:
                priority_stats[p] = {"count": 0, "time": 0}
            if t.closed_at and t.created_at:
                priority_stats[p]["count"] += 1
                priority_stats[p]["time"] += (t.closed_at - t.created_at).total_seconds()
                
        priority_resolution_time = {}
        for p, stats in priority_stats.items():
            priority_resolution_time[p] = round((stats["time"] / stats["count"]) / 3600, 1) if stats["count"] > 0 else 0.0

        # Agent SLA Performance
        agent_stats = {}
        for t in all_resolved:
            if not t.assigned_admin_id:
                continue
            aid = str(t.assigned_admin_id)
            if aid not in agent_stats:
                agent_stats[aid] = {"total": 0, "within_sla": 0}
            
            agent_stats[aid]["total"] += 1
            
            breached = False
            if t.first_response_due and not t.first_response_at and t.closed_at and t.closed_at > t.first_response_due:
                breached = True
            elif t.first_response_due and t.first_response_at and t.first_response_at > t.first_response_due:
                breached = True
            elif t.resolution_due and t.closed_at and t.closed_at > t.resolution_due:
                breached = True
                
            if not breached:
                agent_stats[aid]["within_sla"] += 1
                
        agent_sla_performance = []
        assignment_distribution = []
        open_tickets_per_agent = []
        
        all_admins_stmt = select(User).where(func.lower(User.role) == "admin", User.tenant_id == tenant_id_var.get())
        all_admins = (await self.session.execute(all_admins_stmt)).scalars().all()
        admin_map = {str(a.id): f"{a.first_name or ''} {a.last_name or ''}".strip() or "Unknown Agent" for a in all_admins}
        
        for aid, stats in agent_stats.items():
            name = admin_map.get(aid, "Unknown Agent")
            rate = round((stats["within_sla"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0.0
            agent_sla_performance.append({
                "agent_name": name,
                "compliance_rate": rate,
                "resolved_tickets": stats["total"]
            })
            
        # Assignment Distribution (total assigned tickets per agent)
        assigned_tickets_stmt = select(Ticket).where(Ticket.assigned_admin_id.isnot(None), Ticket.tenant_id == tenant_id_var.get())
        all_assigned = (await self.session.execute(assigned_tickets_stmt)).scalars().all()
        
        dist_stats = {}
        for t in all_assigned:
            aid = str(t.assigned_admin_id)
            dist_stats[aid] = dist_stats.get(aid, 0) + 1
            
        for aid, count in dist_stats.items():
            assignment_distribution.append({
                "name": admin_map.get(aid, "Unknown Agent"),
                "value": count
            })
            
        # Open Tickets Per Agent
        open_tickets_stmt = select(Ticket).where(
            Ticket.assigned_admin_id.isnot(None),
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER]),
            Ticket.tenant_id == tenant_id_var.get()
        )
        all_open_assigned = (await self.session.execute(open_tickets_stmt)).scalars().all()
        open_stats = {}
        for t in all_open_assigned:
            aid = str(t.assigned_admin_id)
            open_stats[aid] = open_stats.get(aid, 0) + 1
            
        for aid, count in open_stats.items():
            open_tickets_per_agent.append({
                "name": admin_map.get(aid, "Unknown Agent"),
                "open_tickets": count
            })
            
        # Auto Assignment Success Rate
        # auto assignments total vs manual overrides.
        # But a simple approximation: total auto assignments / (total auto + manual)
        from app.models.ticket import TicketStatusHistory, TicketHistoryEvent
        auto_cnt_stmt = select(func.count(TicketStatusHistory.id)).where(TicketStatusHistory.event_type == TicketHistoryEvent.AUTO_ASSIGNED, TicketStatusHistory.tenant_id == tenant_id_var.get())
        manual_cnt_stmt = select(func.count(TicketStatusHistory.id)).where(TicketStatusHistory.event_type == TicketHistoryEvent.ASSIGNMENT_CHANGED, TicketStatusHistory.tenant_id == tenant_id_var.get())
        
        auto_cnt = (await self.session.execute(auto_cnt_stmt)).scalar() or 0
        manual_cnt = (await self.session.execute(manual_cnt_stmt)).scalar() or 0
        total_assignments = auto_cnt + manual_cnt
        auto_assignment_success_rate = round((auto_cnt / total_assignments) * 100, 1) if total_assignments > 0 else 0.0

        return {
            "days": days,
            "uploads": uploads_list,
            "conversations": conversations_list,
            "sla_compliance_trend": sla_compliance_trend,
            "resolution_time_trend": resolution_time_trend,
            "priority_resolution_time": priority_resolution_time,
            "agent_sla_performance": agent_sla_performance,
            "assignment_distribution": assignment_distribution,
            "open_tickets_per_agent": open_tickets_per_agent,
            "auto_assignment_success_rate": auto_assignment_success_rate
        }

    async def get_knowledge_impact_analytics(self) -> Dict[str, Any]:
        from app.models.message_source import MessageSource
        from app.models.ticket import Ticket, TicketCategory
        
        # 1. Top Referenced Documents
        ref_stmt = (
            select(
                MessageSource.document_id,
                Document.filename,
                func.count(MessageSource.id).label('count')
            )
            .join(Document, MessageSource.document_id == Document.id)
            .where(MessageSource.tenant_id == tenant_id_var.get())
            .group_by(MessageSource.document_id, Document.filename)
            .order_by(desc('count'))
            .limit(10)
        )
        ref_result = await self.session.execute(ref_stmt)
        top_referenced_documents = [
            {"document_id": str(row.document_id), "filename": row.filename, "count": row.count}
            for row in ref_result.all()
        ]
        
        # 2. Top Flagged Documents
        flagged_stmt = (
            select(
                MessageSource.document_id,
                Document.filename,
                func.count(MessageSource.id).label('count')
            )
            .join(Document, MessageSource.document_id == Document.id)
            .join(Ticket, MessageSource.chat_message_id == Ticket.chat_message_id)
            .where(Ticket.category == TicketCategory.REPORT, MessageSource.tenant_id == tenant_id_var.get())
            .group_by(MessageSource.document_id, Document.filename)
            .order_by(desc('count'))
            .limit(10)
        )
        flagged_result = await self.session.execute(flagged_stmt)
        top_flagged_documents = [
            {"document_id": str(row.document_id), "filename": row.filename, "count": row.count}
            for row in flagged_result.all()
        ]
        
        # 3. Top Problematic Chunks
        chunks_stmt = (
            select(
                MessageSource.chunk_index,
                MessageSource.document_id,
                Document.filename,
                func.count(MessageSource.id).label('count')
            )
            .join(Document, MessageSource.document_id == Document.id)
            .join(Ticket, MessageSource.chat_message_id == Ticket.chat_message_id)
            .where(Ticket.category == TicketCategory.REPORT, MessageSource.tenant_id == tenant_id_var.get())
            .group_by(MessageSource.chunk_index, MessageSource.document_id, Document.filename)
            .order_by(desc('count'))
            .limit(10)
        )
        chunks_result = await self.session.execute(chunks_stmt)
        top_problematic_chunks = [
            {
                "chunk_index": row.chunk_index,
                "document_id": str(row.document_id),
                "filename": row.filename,
                "flag_count": row.count
            }
            for row in chunks_result.all()
        ]
        
        # 4. Document Health Ranking
        health_ranking = []
        
        # First get all references grouped by document
        all_refs_stmt = (
            select(
                MessageSource.document_id,
                Document.filename,
                func.count(MessageSource.id).label('total_refs')
            )
            .join(Document, MessageSource.document_id == Document.id)
            .where(MessageSource.tenant_id == tenant_id_var.get())
            .group_by(MessageSource.document_id, Document.filename)
        )
        all_refs_result = await self.session.execute(all_refs_stmt)
        
        flagged_map = {item["document_id"]: item["count"] for item in top_flagged_documents}
        
        for row in all_refs_result.all():
            doc_id_str = str(row.document_id)
            total_refs = row.total_refs
            flagged = flagged_map.get(doc_id_str, 0)
            
            # If it wasn't in top 10, we might need to query it specifically, but for now we can just query all flagged
            # Actually, let's query all flagged documents to build a complete map
            pass

        # Better query for flagged documents without limit
        all_flagged_stmt = (
            select(
                MessageSource.document_id,
                func.count(MessageSource.id).label('count')
            )
            .join(Ticket, MessageSource.chat_message_id == Ticket.chat_message_id)
            .where(Ticket.category == TicketCategory.REPORT, MessageSource.tenant_id == tenant_id_var.get())
            .group_by(MessageSource.document_id)
        )
        all_flagged_result = await self.session.execute(all_flagged_stmt)
        complete_flagged_map = {str(row.document_id): row.count for row in all_flagged_result.all()}
        
        all_refs_result = await self.session.execute(all_refs_stmt)
        for row in all_refs_result.all():
            doc_id_str = str(row.document_id)
            total_refs = row.total_refs
            flagged = complete_flagged_map.get(doc_id_str, 0)
            
            health_score = 100.0 * (1 - (flagged / total_refs)) if total_refs > 0 else 100.0
            
            health_ranking.append({
                "document_id": doc_id_str,
                "filename": row.filename,
                "total_references": total_refs,
                "flagged_responses": flagged,
                "health_score": round(health_score, 1)
            })
            
        # Sort by health_score ascending (worst first)
        health_ranking.sort(key=lambda x: (x["health_score"], -x["total_references"]))
        
        from app.models.knowledge_gap import KnowledgeGap, GapSeverity
        
        # Total Open Gaps
        total_open_gaps_stmt = select(func.count(KnowledgeGap.id)).where(KnowledgeGap.resolved_at.is_(None), KnowledgeGap.tenant_id == tenant_id_var.get())
        total_open_gaps = (await self.session.execute(total_open_gaps_stmt)).scalar() or 0
        
        # Critical Gaps
        critical_gaps_stmt = select(func.count(KnowledgeGap.id)).where(
            KnowledgeGap.resolved_at.is_(None),
            KnowledgeGap.severity == GapSeverity.CRITICAL,
            KnowledgeGap.tenant_id == tenant_id_var.get()
        )
        critical_gaps = (await self.session.execute(critical_gaps_stmt)).scalar() or 0
        
        # Gap Resolution Rate
        total_gaps_stmt = select(func.count(KnowledgeGap.id)).where(KnowledgeGap.tenant_id == tenant_id_var.get()).where(KnowledgeGap.tenant_id == tenant_id_var.get())
        total_gaps = (await self.session.execute(total_gaps_stmt)).scalar() or 0
        resolved_gaps_stmt = select(func.count(KnowledgeGap.id)).where(KnowledgeGap.resolved_at.isnot(None), KnowledgeGap.tenant_id == tenant_id_var.get())
        resolved_gaps = (await self.session.execute(resolved_gaps_stmt)).scalar() or 0
        
        gap_resolution_rate = round((resolved_gaps / total_gaps) * 100, 1) if total_gaps > 0 else 0.0
        
        # Gap Trend (last 7 days creation)
        from datetime import datetime, timezone, timedelta
        now_utc = datetime.now(timezone.utc)
        gap_trend = []
        for i in range(6, -1, -1):
            date_target = (now_utc - timedelta(days=i)).date()
            stmt = select(func.count(KnowledgeGap.id)).where(
                func.date(KnowledgeGap.created_at) == date_target,
                KnowledgeGap.tenant_id == tenant_id_var.get()
            )
            count = (await self.session.execute(stmt)).scalar() or 0
            gap_trend.append({"date": date_target.strftime("%m/%d"), "count": count})
            
        # Most Affected Documents
        affected_stmt = (
            select(
                KnowledgeGap.document_id,
                Document.filename,
                func.count(KnowledgeGap.id).label('gap_count')
            )
            .join(Document, KnowledgeGap.document_id == Document.id)
            .where(KnowledgeGap.resolved_at.is_(None), KnowledgeGap.tenant_id == tenant_id_var.get())
            .group_by(KnowledgeGap.document_id, Document.filename)
            .order_by(desc('gap_count'))
            .limit(5)
        )
        affected_result = await self.session.execute(affected_stmt)
        most_affected_documents = [
            {"document_id": str(row.document_id), "filename": row.filename, "gap_count": row.gap_count}
            for row in affected_result.all()
        ]
        
        # Recent Gaps
        recent_gaps_stmt = (
            select(KnowledgeGap, Document.filename)
            .join(Document, KnowledgeGap.document_id == Document.id)
            .where(KnowledgeGap.resolved_at.is_(None), KnowledgeGap.tenant_id == tenant_id_var.get())
            .order_by(desc(KnowledgeGap.created_at))
            .limit(10)
        )
        recent_gaps_result = await self.session.execute(recent_gaps_stmt)
        recent_gaps = []
        for gap, filename in recent_gaps_result.all():
            recent_gaps.append({
                "id": gap.id,
                "document_id": gap.document_id,
                "filename": filename,
                "gap_type": gap.gap_type.value,
                "severity": gap.severity.value,
                "description": gap.description,
                "created_at": gap.created_at,
                "resolved_at": gap.resolved_at
            })
        
        from app.models.improvement_recommendation import ImprovementRecommendation, RecommendationStatus
        
        # Recommendations Analytics
        open_recs_stmt = select(func.count(ImprovementRecommendation.id)).where(
            ImprovementRecommendation.status.in_([RecommendationStatus.OPEN, RecommendationStatus.IN_PROGRESS]),
            ImprovementRecommendation.tenant_id == tenant_id_var.get()
        )
        open_recommendations = (await self.session.execute(open_recs_stmt)).scalar() or 0
        
        critical_recs_stmt = select(func.count(ImprovementRecommendation.id)).where(
            ImprovementRecommendation.status.in_([RecommendationStatus.OPEN, RecommendationStatus.IN_PROGRESS]),
            ImprovementRecommendation.severity == 'CRITICAL',
            ImprovementRecommendation.tenant_id == tenant_id_var.get()
        )
        critical_recommendations = (await self.session.execute(critical_recs_stmt)).scalar() or 0
        
        total_recs_stmt = select(func.count(ImprovementRecommendation.id)).where(ImprovementRecommendation.tenant_id == tenant_id_var.get())
        total_recs = (await self.session.execute(total_recs_stmt)).scalar() or 0
        
        completed_recs_stmt = select(func.count(ImprovementRecommendation.id)).where(
            ImprovementRecommendation.status == RecommendationStatus.COMPLETED,
            ImprovementRecommendation.tenant_id == tenant_id_var.get()
        )
        completed_recommendations = (await self.session.execute(completed_recs_stmt)).scalar() or 0
        
        recommendation_resolution_rate = round((completed_recommendations / total_recs) * 100, 1) if total_recs > 0 else 0.0
        
        most_rec_docs_stmt = (
            select(
                ImprovementRecommendation.document_id,
                Document.filename,
                func.count(ImprovementRecommendation.id).label('rec_count')
            )
            .join(Document, ImprovementRecommendation.document_id == Document.id)
            .where(ImprovementRecommendation.status.in_([RecommendationStatus.OPEN, RecommendationStatus.IN_PROGRESS]), ImprovementRecommendation.tenant_id == tenant_id_var.get())
            .group_by(ImprovementRecommendation.document_id, Document.filename)
            .order_by(desc('rec_count'))
            .limit(5)
        )
        most_rec_docs_result = await self.session.execute(most_rec_docs_stmt)
        most_recommended_documents = [
            {"document_id": str(row.document_id), "filename": row.filename, "gap_count": row.rec_count}
            for row in most_rec_docs_result.all()
        ]
        
        recent_recs_stmt = (
            select(ImprovementRecommendation, Document.filename)
            .join(Document, ImprovementRecommendation.document_id == Document.id)
            .where(ImprovementRecommendation.status.in_([RecommendationStatus.OPEN, RecommendationStatus.IN_PROGRESS]), ImprovementRecommendation.tenant_id == tenant_id_var.get())
            .order_by(desc(ImprovementRecommendation.created_at))
            .limit(10)
        )
        recent_recs_result = await self.session.execute(recent_recs_stmt)
        recent_recommendations = []
        for rec, filename in recent_recs_result.all():
            recent_recommendations.append({
                "id": rec.id,
                "document_id": rec.document_id,
                "filename": filename,
                "knowledge_gap_id": rec.knowledge_gap_id,
                "recommendation_type": rec.recommendation_type.value,
                "severity": rec.severity,
                "title": rec.title,
                "description": rec.description,
                "status": rec.status.value,
                "created_at": rec.created_at,
                "resolved_at": rec.resolved_at
            })
        
        from app.models.knowledge_review_task import KnowledgeReviewTask, ReviewTaskStatus
        from sqlalchemy import extract
        
        # Review Tasks Analytics
        open_reviews_stmt = select(func.count(KnowledgeReviewTask.id)).where(
            KnowledgeReviewTask.status.in_([ReviewTaskStatus.OPEN, ReviewTaskStatus.IN_PROGRESS, ReviewTaskStatus.UNDER_REVIEW]),
            KnowledgeReviewTask.tenant_id == tenant_id_var.get()
        )
        open_review_tasks = (await self.session.execute(open_reviews_stmt)).scalar() or 0
        
        completed_reviews_stmt = select(func.count(KnowledgeReviewTask.id)).where(
            KnowledgeReviewTask.status == ReviewTaskStatus.COMPLETED,
            KnowledgeReviewTask.tenant_id == tenant_id_var.get()
        )
        completed_reviews = (await self.session.execute(completed_reviews_stmt)).scalar() or 0
        
        total_reviews_stmt = select(func.count(KnowledgeReviewTask.id)).where(KnowledgeReviewTask.tenant_id == tenant_id_var.get())
        total_reviews = (await self.session.execute(total_reviews_stmt)).scalar() or 0
        
        review_completion_rate = round((completed_reviews / total_reviews) * 100, 1) if total_reviews > 0 else 0.0
        
        avg_time_stmt = select(
            func.avg(
                extract('epoch', KnowledgeReviewTask.completed_at) - extract('epoch', KnowledgeReviewTask.created_at)
            )
        ).where(KnowledgeReviewTask.status == ReviewTaskStatus.COMPLETED, KnowledgeReviewTask.tenant_id == tenant_id_var.get())
        avg_review_time = (await self.session.execute(avg_time_stmt)).scalar()
        
        workload_stmt = (
            select(
                User.id,
                User.first_name,
                User.last_name,
                func.count(KnowledgeReviewTask.id).label('task_count')
            )
            .join(KnowledgeReviewTask, KnowledgeReviewTask.assigned_admin_id == User.id)
            .where(KnowledgeReviewTask.status.in_([ReviewTaskStatus.OPEN, ReviewTaskStatus.IN_PROGRESS, ReviewTaskStatus.UNDER_REVIEW]), KnowledgeReviewTask.tenant_id == tenant_id_var.get())
            .group_by(User.id, User.first_name, User.last_name)
            .order_by(desc('task_count'))
            .limit(5)
        )
        workload_result = await self.session.execute(workload_stmt)
        reviewer_workload = [
            {"admin_id": str(row.id), "name": f"{row.first_name} {row.last_name}", "active_tasks": row.task_count}
            for row in workload_result.all()
        ]

        return {
            "top_flagged_documents": top_flagged_documents,
            "top_referenced_documents": top_referenced_documents,
            "top_problematic_chunks": top_problematic_chunks,
            "document_health_ranking": health_ranking,
            "total_open_gaps": total_open_gaps,
            "critical_gaps": critical_gaps,
            "gap_resolution_rate": gap_resolution_rate,
            "gap_trend": gap_trend,
            "most_affected_documents": most_affected_documents,
            "recent_gaps": recent_gaps,
            "open_recommendations": open_recommendations,
            "critical_recommendations": critical_recommendations,
            "completed_recommendations": completed_recommendations,
            "recommendation_resolution_rate": recommendation_resolution_rate,
            "most_recommended_documents": most_recommended_documents,
            "recent_recommendations": recent_recommendations,
            "open_review_tasks": open_review_tasks,
            "completed_reviews": completed_reviews,
            "review_completion_rate": review_completion_rate,
            "average_review_time": float(avg_review_time) if avg_review_time else None,
            "reviewer_workload": reviewer_workload
        }
