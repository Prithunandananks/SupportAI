import uuid
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.ticket import Ticket, TicketMessage, TicketStatusHistory, TicketStatus, TicketHistoryEvent, TicketInternalNote, TicketPriority
from app.repositories.ticket_repo import ticket_repo, ticket_message_repo, ticket_history_repo, ticket_note_repo
from app.schemas.ticket import TicketCreate, TicketUpdateStatus, TicketMessageCreate, TicketNoteCreate
from pydantic import BaseModel, Field

from app.services.notification_service import notification_service
from app.models.notification import NotificationType
from app.repositories.user_repo import user_repo
from app.core.sla_config import SLA_CONFIG

class TicketCreateDB(TicketCreate):
    ticket_number: str
    customer_id: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    first_response_due: Optional[datetime] = None
    resolution_due: Optional[datetime] = None

class TicketMessageCreateDB(TicketMessageCreate):
    ticket_id: uuid.UUID
    sender_id: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketNoteCreateDB(TicketNoteCreate):
    ticket_id: uuid.UUID
    author_id: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
            TicketStatus.OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
            TicketStatus.IN_PROGRESS: [TicketStatus.WAITING_FOR_CUSTOMER, TicketStatus.RESOLVED, TicketStatus.CLOSED],
            TicketStatus.WAITING_FOR_CUSTOMER: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
            TicketStatus.RESOLVED: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
            TicketStatus.CLOSED: [] # Cannot transition out of closed for now
        }
        return new_status in valid_transitions.get(current_status, [])

    async def create_ticket(self, db: AsyncSession, ticket_in: TicketCreate, customer_id: uuid.UUID) -> Ticket:
        ticket_number = await self.generate_ticket_number(db)
        
        now = datetime.now(timezone.utc)
        rule = SLA_CONFIG.get(ticket_in.priority, SLA_CONFIG[TicketPriority.MEDIUM])
        first_response_due = now + timedelta(hours=rule.first_response_hours)
        resolution_due = now + timedelta(hours=rule.resolution_hours)
        
        ticket_in_db = TicketCreateDB(
            **ticket_in.model_dump(), 
            ticket_number=ticket_number, 
            customer_id=customer_id,
            first_response_due=first_response_due,
            resolution_due=resolution_due
        )
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
        
        await db.refresh(ticket)
        
        # Trigger Auto Assignment
        from app.services.auto_assignment_service import auto_assignment_service
        assigned_ticket = await auto_assignment_service.assign_ticket(db, ticket)
        if assigned_ticket:
            ticket = assigned_ticket
            
        await db.refresh(ticket)
        return ticket
        
    async def _evaluate_first_response_sla(self, db: AsyncSession, ticket: Ticket, sender_id: uuid.UUID) -> None:
        if ticket.first_response_due and ticket.first_response_at > ticket.first_response_due:
            history_breach = TicketStatusHistoryCreateDB(
                ticket_id=ticket.id,
                event_type=TicketHistoryEvent.SLA_BREACHED,
                old_value=None,
                new_value="FIRST_RESPONSE",
                changed_by=sender_id
            )
            await ticket_history_repo.create(db, obj_in=history_breach)
            
    async def _evaluate_resolution_sla(self, db: AsyncSession, ticket: Ticket, changed_by: uuid.UUID) -> None:
        if not ticket.resolution_due or not ticket.closed_at:
            return
            
        is_breached = ticket.closed_at > ticket.resolution_due
        event_type = TicketHistoryEvent.TICKET_RESOLVED_AFTER_SLA if is_breached else TicketHistoryEvent.TICKET_RESOLVED_WITHIN_SLA
        
        history_resolution = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=event_type,
            old_value=None,
            new_value=ticket.closed_at.isoformat(),
            changed_by=changed_by
        )
        await ticket_history_repo.create(db, obj_in=history_resolution)
        
        if is_breached:
            history_breach = TicketStatusHistoryCreateDB(
                ticket_id=ticket.id,
                event_type=TicketHistoryEvent.SLA_BREACHED,
                old_value=None,
                new_value="RESOLUTION",
                changed_by=changed_by
            )
            await ticket_history_repo.create(db, obj_in=history_breach)
        
    async def add_message(self, db: AsyncSession, ticket_id: uuid.UUID, sender_id: uuid.UUID, msg_in: TicketMessageCreate) -> TicketMessage:
        ticket = await ticket_repo.get(db, id=ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if ticket.status == TicketStatus.CLOSED:
            raise HTTPException(status_code=400, detail="Cannot reply to a closed ticket")
            
        msg_in_db = TicketMessageCreateDB(**msg_in.model_dump(), ticket_id=ticket_id, sender_id=sender_id)
        msg = await ticket_message_repo.create(db, obj_in=msg_in_db)
        
        await db.refresh(ticket)
        
        sender = await user_repo.get(db, id=sender_id)
        if sender and sender.role == "Admin":
            if not ticket.first_response_at:
                ticket.first_response_at = datetime.now(timezone.utc)
                ticket = await ticket_repo.update(db, db_obj=ticket, obj_in={"first_response_at": ticket.first_response_at})
                
                history = TicketStatusHistoryCreateDB(
                    ticket_id=ticket.id,
                    event_type=TicketHistoryEvent.FIRST_RESPONSE_RECORDED,
                    old_value=None,
                    new_value=ticket.first_response_at.isoformat(),
                    changed_by=sender_id
                )
                await ticket_history_repo.create(db, obj_in=history)
                await self._evaluate_first_response_sla(db, ticket, sender_id)
                
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
        if not self.validate_transition(ticket.status, new_status):
            raise HTTPException(status_code=400, detail=f"Invalid status transition from {ticket.status} to {new_status}")
            
        old_status = ticket.status
        ticket.status = new_status
        
        if new_status in [TicketStatus.RESOLVED, TicketStatus.CLOSED] and old_status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            ticket.closed_at = datetime.now(timezone.utc)
            ticket = await ticket_repo.update(db, db_obj=ticket, obj_in={"status": new_status, "closed_at": ticket.closed_at})
        else:
            ticket = await ticket_repo.update(db, db_obj=ticket, obj_in={"status": new_status})
        
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.STATUS_CHANGED,
            old_value=old_status.value,
            new_value=new_status.value,
            changed_by=changed_by
        )
        await ticket_history_repo.create(db, obj_in=history)
        
        if new_status in [TicketStatus.RESOLVED, TicketStatus.CLOSED] and old_status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            await self._evaluate_resolution_sla(db, ticket, changed_by)
            
        await db.refresh(ticket)
        
        title_map = {
            TicketStatus.WAITING_FOR_CUSTOMER: "Ticket Waiting for Customer",
            TicketStatus.RESOLVED: "Ticket Resolved",
            TicketStatus.CLOSED: "Ticket Closed",
            TicketStatus.IN_PROGRESS: "Ticket In Progress",
        }
        nt_type_map = {
            TicketStatus.WAITING_FOR_CUSTOMER: NotificationType.TICKET_WAITING_CUSTOMER,
            TicketStatus.RESOLVED: NotificationType.TICKET_RESOLVED,
            TicketStatus.CLOSED: NotificationType.TICKET_CLOSED,
            TicketStatus.IN_PROGRESS: NotificationType.TICKET_UPDATED,
        }
        
        await notification_service.create_notification(
            db=db,
            user_id=ticket.customer_id,
            title=title_map.get(new_status, "Ticket Status Updated"),
            message=f"Your ticket {ticket.ticket_number} status changed to {new_status.value}.",
            notification_type=nt_type_map.get(new_status, NotificationType.TICKET_UPDATED),
            related_ticket_id=ticket.id,
            metadata_obj={"ticket_number": ticket.ticket_number}
        )
        
        await db.refresh(ticket)
        return ticket

    async def close_ticket_by_customer(self, db: AsyncSession, ticket: Ticket, customer_id: uuid.UUID) -> Ticket:
        if ticket.status == TicketStatus.CLOSED:
            return ticket
            
        old_status = ticket.status
        ticket.status = TicketStatus.CLOSED
        ticket.closed_at = datetime.now(timezone.utc)
        
        ticket = await ticket_repo.update(db, db_obj=ticket, obj_in={"status": TicketStatus.CLOSED, "closed_at": ticket.closed_at})
        
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.CUSTOMER_CLOSED,
            old_value=old_status.value,
            new_value=TicketStatus.CLOSED.value,
            changed_by=customer_id
        )
        await ticket_history_repo.create(db, obj_in=history)
        
        if old_status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            await self._evaluate_resolution_sla(db, ticket, customer_id)
            
        await db.refresh(ticket)
        
        await notification_service.create_notification(
            db=db,
            user_id=ticket.customer_id,
            title="Ticket Closed",
            message=f"Your ticket {ticket.ticket_number} has been closed.",
            notification_type=NotificationType.TICKET_CLOSED,
            related_ticket_id=ticket.id,
            metadata_obj={"ticket_number": ticket.ticket_number}
        )
        
        await db.refresh(ticket)
        return ticket

    async def assign_ticket(self, db: AsyncSession, ticket: Ticket, admin_id: uuid.UUID, changed_by: uuid.UUID) -> Ticket:
        assignee = await user_repo.get(db, id=admin_id)
        if not assignee or assignee.role.lower() != "admin":
            raise HTTPException(status_code=400, detail="Assignee must be a valid admin")
            
        old_assignee = str(ticket.assigned_admin_id) if ticket.assigned_admin_id else None
        
        updated_ticket = await ticket_repo.assign_ticket(db, ticket.id, admin_id)
        if not updated_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found during assignment")
        
        history = TicketStatusHistoryCreateDB(
            ticket_id=updated_ticket.id,
            event_type=TicketHistoryEvent.ASSIGNMENT_CHANGED,
            old_value=old_assignee,
            new_value=str(admin_id),
            changed_by=changed_by
        )
        await ticket_history_repo.create(db, obj_in=history)
        await db.refresh(updated_ticket)
        
        await notification_service.create_notification(
            db=db,
            user_id=updated_ticket.customer_id,
            title="Ticket Assigned",
            message=f"Your ticket {updated_ticket.ticket_number} has been assigned to support.",
            notification_type=NotificationType.TICKET_ASSIGNED,
            related_ticket_id=updated_ticket.id,
            metadata_obj={"ticket_number": updated_ticket.ticket_number}
        )
        
        await notification_service.create_notification(
            db=db,
            user_id=admin_id,
            title="Ticket Assigned to You",
            message=f"Ticket {updated_ticket.ticket_number} has been assigned to you.",
            notification_type=NotificationType.TICKET_ASSIGNED,
            related_ticket_id=updated_ticket.id,
            metadata_obj={"ticket_number": updated_ticket.ticket_number}
        )
        
        await db.refresh(updated_ticket)
        return updated_ticket

    async def unassign_ticket(self, db: AsyncSession, ticket: Ticket, changed_by: uuid.UUID) -> Ticket:
        if not ticket.assigned_admin_id:
            return ticket
            
        old_assignee = str(ticket.assigned_admin_id)
        
        updated_ticket = await ticket_repo.unassign_ticket(db, ticket.id)
        if not updated_ticket:
            raise HTTPException(status_code=404, detail="Ticket not found during unassignment")
            
        history = TicketStatusHistoryCreateDB(
            ticket_id=updated_ticket.id,
            event_type=TicketHistoryEvent.ASSIGNMENT_CHANGED,
            old_value=old_assignee,
            new_value=None,
            changed_by=changed_by
        )
        await ticket_history_repo.create(db, obj_in=history)
        await db.refresh(updated_ticket)
        return updated_ticket

    async def add_internal_note(self, db: AsyncSession, ticket_id: uuid.UUID, author_id: uuid.UUID, note_in: TicketNoteCreate) -> TicketInternalNote:
        ticket = await ticket_repo.get(db, id=ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        note_in_db = TicketNoteCreateDB(**note_in.model_dump(), ticket_id=ticket_id, author_id=author_id)
        note = await ticket_note_repo.create(db, obj_in=note_in_db)
        
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.INTERNAL_NOTE_ADDED,
            old_value=None,
            new_value=None,
            changed_by=author_id
        )
        await ticket_history_repo.create(db, obj_in=history)
        await db.refresh(note)
        return note

ticket_service = TicketService()
