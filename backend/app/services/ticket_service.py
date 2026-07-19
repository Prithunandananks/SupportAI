import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.ticket import Ticket, TicketMessage, TicketStatusHistory, TicketStatus, TicketHistoryEvent
from app.repositories.ticket_repo import ticket_repo, ticket_message_repo, ticket_history_repo
from app.schemas.ticket import TicketCreate, TicketUpdateStatus, TicketMessageCreate
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional

from app.services.notification_service import notification_service
from app.models.notification import NotificationType
from app.repositories.user_repo import user_repo

class TicketCreateDB(TicketCreate):
    ticket_number: str
    customer_id: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketMessageCreateDB(TicketMessageCreate):
    ticket_id: uuid.UUID
    sender_id: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketStatusHistoryCreateDB(BaseModel):
    ticket_id: uuid.UUID
    event_type: TicketHistoryEvent
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketService:
    async def generate_ticket_number(self, db: AsyncSession) -> str:
        count = await ticket_repo.count_all(db)
        # Using a simple count-based sequence. In production with high concurrency,
        # a dedicated sequence generator or DB sequence would be safer, but this is 
        # acceptable for this sprint within a transaction context.
        return f"SUP-{(count + 1):06d}"

    def validate_transition(self, current_status: TicketStatus, new_status: TicketStatus) -> bool:
        valid_transitions = {
            TicketStatus.OPEN: [TicketStatus.IN_PROGRESS],
            TicketStatus.IN_PROGRESS: [TicketStatus.RESOLVED],
            TicketStatus.RESOLVED: []
        }
        return new_status in valid_transitions.get(current_status, [])

    async def create_ticket(self, db: AsyncSession, ticket_in: TicketCreate, customer_id: uuid.UUID) -> Ticket:
        ticket_number = await self.generate_ticket_number(db)
        ticket_in_db = TicketCreateDB(**ticket_in.model_dump(), ticket_number=ticket_number, customer_id=customer_id)
        ticket = await ticket_repo.create(db, obj_in=ticket_in_db)
        
        # Log history
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.CREATED,
            old_value=None,
            new_value=TicketStatus.OPEN.value,
            changed_by=customer_id
        )
        await ticket_history_repo.create(db, obj_in=history)
        await db.refresh(ticket)
        
        await notification_service.create_notification(
            db=db,
            user_id=customer_id,
            title="Ticket Created",
            message=f"Your ticket {ticket_number} has been created.",
            notification_type=NotificationType.TICKET_CREATED,
            related_ticket_id=ticket.id,
            metadata_obj={"ticket_number": ticket_number}
        )
        
        admins = await user_repo.get_admins(db)
        for admin in admins:
            await notification_service.create_notification(
                db=db,
                user_id=admin.id,
                title="New Ticket",
                message=f"Ticket {ticket_number} was created.",
                notification_type=NotificationType.TICKET_CREATED,
                related_ticket_id=ticket.id,
                metadata_obj={"ticket_number": ticket_number}
            )
            
        await db.refresh(ticket)
        return ticket
        
    async def add_message(self, db: AsyncSession, ticket_id: uuid.UUID, sender_id: uuid.UUID, msg_in: TicketMessageCreate) -> TicketMessage:
        ticket = await ticket_repo.get(db, id=ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if ticket.status == TicketStatus.RESOLVED:
            raise HTTPException(status_code=400, detail="Cannot reply to a resolved ticket")
            
        msg_in_db = TicketMessageCreateDB(**msg_in.model_dump(), ticket_id=ticket_id, sender_id=sender_id)
        msg = await ticket_message_repo.create(db, obj_in=msg_in_db)
        
        await db.refresh(ticket)
        
        sender = await user_repo.get(db, id=sender_id)
        if sender and sender.role == "Admin":
            await notification_service.create_notification(
                db=db,
                user_id=ticket.customer_id,
                title="New Reply",
                message=f"Support replied to your ticket {ticket.ticket_number}.",
                notification_type=NotificationType.TICKET_REPLY,
                related_ticket_id=ticket.id,
                metadata_obj={"ticket_number": ticket.ticket_number}
            )
        elif sender and sender.role == "Customer":
            if ticket.assigned_admin_id:
                await notification_service.create_notification(
                    db=db,
                    user_id=ticket.assigned_admin_id,
                    title="Customer Replied",
                    message=f"Customer replied to ticket {ticket.ticket_number}.",
                    notification_type=NotificationType.TICKET_REPLY,
                    related_ticket_id=ticket.id,
                    metadata_obj={"ticket_number": ticket.ticket_number}
                )
                
        await db.refresh(msg)
        return msg

    async def change_status(self, db: AsyncSession, ticket: Ticket, new_status: TicketStatus, changed_by: uuid.UUID) -> Ticket:
        if not ticket.assigned_admin_id:
            raise HTTPException(status_code=400, detail="Ticket must be assigned before changing status")
            
        if not self.validate_transition(ticket.status, new_status):
            raise HTTPException(status_code=400, detail=f"Invalid status transition from {ticket.status} to {new_status}")
            
        old_status = ticket.status
        ticket.status = new_status
        
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.STATUS_CHANGED,
            old_value=old_status.value,
            new_value=new_status.value,
            changed_by=changed_by
        )
        await ticket_history_repo.create(db, obj_in=history)
        await db.refresh(ticket)
        
        title = ""
        message = ""
        notification_type = NotificationType.TICKET_UPDATED
        
        if new_status == TicketStatus.IN_PROGRESS:
            title = "Review in Progress"
            message = "We've started reviewing the AI response you reported. Our team is currently investigating the issue. We'll notify you once the review is complete."
            notification_type = NotificationType.TICKET_UPDATED
        elif new_status == TicketStatus.RESOLVED:
            title = "Review Completed"
            message = "We've completed the review of the AI response you reported. Thank you for helping us improve SupportAI."
            notification_type = NotificationType.TICKET_CLOSED
            
        if title:
            await notification_service.create_notification(
                db=db,
                user_id=ticket.customer_id,
                title=title,
                message=message,
                notification_type=notification_type,
                related_ticket_id=ticket.id,
                metadata_obj={"ticket_number": ticket.ticket_number}
            )
        
        await db.refresh(ticket)
        return ticket


    async def assign_ticket(self, db: AsyncSession, ticket: Ticket, admin_id: uuid.UUID, changed_by: uuid.UUID) -> Ticket:
        old_assignee = str(ticket.assigned_admin_id) if ticket.assigned_admin_id else None
        ticket.assigned_admin_id = admin_id
        
        admin = await user_repo.get(db, id=admin_id)
        admin_name = f"{admin.first_name or ''} {admin.last_name or ''}".strip() if admin else "Admin"
        
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.ASSIGNMENT_CHANGED,
            old_value=old_assignee,
            new_value=admin_name,
            changed_by=changed_by
        )
        await ticket_history_repo.create(db, obj_in=history)
        await db.refresh(ticket)
        
        await notification_service.create_notification(
            db=db,
            user_id=ticket.customer_id,
            title="Ticket Assigned",
            message=f"Your ticket {ticket.ticket_number} has been assigned to support.",
            notification_type=NotificationType.TICKET_ASSIGNED,
            related_ticket_id=ticket.id,
            metadata_obj={"ticket_number": ticket.ticket_number}
        )
        
        await db.refresh(ticket)
        return ticket

ticket_service = TicketService()
