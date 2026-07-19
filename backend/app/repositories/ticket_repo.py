import uuid
from typing import Optional, List, Any
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.models.ticket import Ticket, TicketMessage, TicketStatusHistory, TicketStatus, TicketPriority, TicketInternalNote

class TicketRepository(BaseRepository[Ticket, dict]):
    async def get_with_messages(self, db: AsyncSession, id: uuid.UUID) -> Optional[Ticket]:
        stmt = select(Ticket).options(
            selectinload(Ticket.messages)
        ).where(Ticket.id == id)
        result = await db.execute(stmt)
        return result.scalars().first()
        
    async def get_full_details(self, db: AsyncSession, id: uuid.UUID) -> Optional[Ticket]:
        stmt = select(Ticket).options(
            selectinload(Ticket.messages),
            selectinload(Ticket.internal_notes),
            selectinload(Ticket.history)
        ).where(Ticket.id == id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_all_for_customer(self, db: AsyncSession, customer_id: uuid.UUID) -> List[Ticket]:
        stmt = select(Ticket).options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assigned_admin),
            selectinload(Ticket.messages),
            selectinload(Ticket.history),
            selectinload(Ticket.internal_notes)
        ).where(Ticket.customer_id == customer_id).order_by(desc(Ticket.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_with_filters(
        self, 
        db: AsyncSession, 
        status: Optional[TicketStatus] = None, 
        priority: Optional[TicketPriority] = None,
        is_flagged: Optional[bool] = None
    ) -> List[Ticket]:
        stmt = select(Ticket).options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assigned_admin),
            selectinload(Ticket.messages),
            selectinload(Ticket.history),
            selectinload(Ticket.internal_notes)
        ).order_by(desc(Ticket.created_at))
        if status:
            stmt = stmt.where(Ticket.status == status)
        if priority:
            stmt = stmt.where(Ticket.priority == priority)
        if is_flagged is not None:
            if is_flagged:
                stmt = stmt.where(Ticket.chat_message_id.isnot(None))
            else:
                stmt = stmt.where(Ticket.chat_message_id.is_(None))
        result = await db.execute(stmt)
        return list(result.scalars().all())
        
    async def count_all(self, db: AsyncSession) -> int:
        from sqlalchemy import func
        stmt = select(func.count(Ticket.id))
        result = await db.execute(stmt)
        return result.scalar_one()

    async def assign_ticket(self, db: AsyncSession, ticket_id: uuid.UUID, assignee_id: uuid.UUID) -> Optional[Ticket]:
        ticket = await self.get(db, id=ticket_id)
        if not ticket:
            return None
        ticket.assigned_admin_id = assignee_id
        ticket.assigned_at = datetime.now(timezone.utc)
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        return ticket

    async def unassign_ticket(self, db: AsyncSession, ticket_id: uuid.UUID) -> Optional[Ticket]:
        ticket = await self.get(db, id=ticket_id)
        if not ticket:
            return None
        ticket.assigned_admin_id = None
        ticket.assigned_at = None
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        return ticket

    async def get_assigned_tickets(self, db: AsyncSession) -> List[Ticket]:
        stmt = select(Ticket).where(Ticket.assigned_admin_id.isnot(None)).order_by(desc(Ticket.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_unassigned_tickets(self, db: AsyncSession) -> List[Ticket]:
        stmt = select(Ticket).where(Ticket.assigned_admin_id.is_(None)).order_by(desc(Ticket.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_tickets_assigned_to_user(self, db: AsyncSession, user_id: uuid.UUID) -> List[Ticket]:
        stmt = select(Ticket).where(Ticket.assigned_admin_id == user_id).order_by(desc(Ticket.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_agent_workloads(self, db: AsyncSession) -> dict[uuid.UUID, int]:
        from sqlalchemy import func
        stmt = select(
            Ticket.assigned_admin_id, 
            func.count(Ticket.id)
        ).where(
            Ticket.assigned_admin_id.isnot(None),
            Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_CUSTOMER])
        ).group_by(Ticket.assigned_admin_id)
        
        result = await db.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

ticket_repo = TicketRepository(Ticket)

class TicketMessageRepository(BaseRepository[TicketMessage, dict]):
    pass

ticket_message_repo = TicketMessageRepository(TicketMessage)

class TicketStatusHistoryRepository(BaseRepository[TicketStatusHistory, dict]):
    pass

ticket_history_repo = TicketStatusHistoryRepository(TicketStatusHistory)

class TicketInternalNoteRepository(BaseRepository[TicketInternalNote, dict]):
    pass

ticket_note_repo = TicketInternalNoteRepository(TicketInternalNote)
