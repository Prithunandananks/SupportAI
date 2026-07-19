import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket, TicketHistoryEvent
from app.repositories.ticket_repo import ticket_repo, ticket_history_repo
from app.repositories.user_repo import user_repo
from app.services.notification_service import notification_service
from app.models.notification import NotificationType
from pydantic import BaseModel, Field

class TicketStatusHistoryCreateDB(BaseModel):
    ticket_id: uuid.UUID
    event_type: TicketHistoryEvent
    old_value: Optional[str]
    new_value: Optional[str]
    changed_by: uuid.UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AutoAssignmentService:
    async def assign_ticket(self, db: AsyncSession, ticket: Ticket) -> Optional[Ticket]:
        """
        Automatically assigns a ticket to the admin with the lowest workload.
        Active tickets = OPEN, IN_PROGRESS, WAITING_FOR_CUSTOMER.
        """
        admins = await user_repo.get_admins(db)
        if not admins:
            return None # No admins to assign to
            
        workloads = await ticket_repo.get_agent_workloads(db)
        
        # Default strategy: Lowest Workload
        best_admin = None
        min_workload = float('inf')
        
        for admin in admins:
            current_load = workloads.get(admin.id, 0)
            if current_load < min_workload:
                min_workload = current_load
                best_admin = admin
                
        if not best_admin:
            return None
            
        # Assign the ticket
        ticket.assigned_admin_id = best_admin.id
        ticket.assigned_at = datetime.now(timezone.utc)
        
        ticket = await ticket_repo.update(
            db, 
            db_obj=ticket, 
            obj_in={"assigned_admin_id": ticket.assigned_admin_id, "assigned_at": ticket.assigned_at}
        )
        
        # Log History Event
        history = TicketStatusHistoryCreateDB(
            ticket_id=ticket.id,
            event_type=TicketHistoryEvent.AUTO_ASSIGNED,
            old_value=None,
            new_value=str(best_admin.id),
            changed_by=ticket.customer_id # Assuming the system/customer context triggers it
        )
        await ticket_history_repo.create(db, obj_in=history)
        
        # Notify the assigned agent
        await notification_service.create_notification(
            db=db,
            user_id=best_admin.id,
            title="New Ticket Assigned",
            message=f"Ticket {ticket.ticket_number} has been automatically assigned to you.",
            notification_type=NotificationType.TICKET_ASSIGNED,
            related_ticket_id=ticket.id,
            metadata_obj={"ticket_number": ticket.ticket_number, "reason": "Lowest workload"}
        )
        
        await db.refresh(ticket)
        return ticket

auto_assignment_service = AutoAssignmentService()
