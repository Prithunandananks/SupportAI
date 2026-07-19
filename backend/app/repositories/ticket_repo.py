import uuid
from typing import Optional, List, Any
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.ticket import Ticket, TicketMessage, TicketStatusHistory, TicketStatus, TicketPriority

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
            selectinload(Ticket.history),
            selectinload(Ticket.assigned_admin)
        ).where(Ticket.id == id)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_all_for_customer(self, db: AsyncSession, customer_id: uuid.UUID) -> List[Ticket]:
        stmt = select(Ticket).where(Ticket.customer_id == customer_id).order_by(desc(Ticket.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_with_filters(
        self, 
        db: AsyncSession, 
        status: Optional[TicketStatus] = None, 
        priority: Optional[TicketPriority] = None,
        is_flagged: Optional[bool] = None
    ) -> List[Ticket]:
        stmt = select(Ticket).order_by(desc(Ticket.created_at))
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

ticket_repo = TicketRepository(Ticket)

class TicketMessageRepository(BaseRepository[TicketMessage, dict]):
    pass

ticket_message_repo = TicketMessageRepository(TicketMessage)

class TicketStatusHistoryRepository(BaseRepository[TicketStatusHistory, dict]):
    pass

ticket_history_repo = TicketStatusHistoryRepository(TicketStatusHistory)
