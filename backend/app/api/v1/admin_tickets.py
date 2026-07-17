import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.models.ticket import TicketStatus, TicketPriority
from app.schemas.ticket import (
    TicketResponse, 
    AdminTicketDetailResponse, 
    TicketUpdateStatus, 
    TicketAssignAdmin, 
    TicketMessageCreate, 
    TicketMessageResponse
)
from app.repositories.ticket_repo import ticket_repo
from app.services.ticket_service import ticket_service

router = APIRouter()

@router.get("/", response_model=List[TicketResponse])
async def list_all_tickets(
    status: Optional[TicketStatus] = Query(None),
    priority: Optional[TicketPriority] = Query(None),
    is_flagged: Optional[bool] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """List all tickets across all users (with filtering). Admin only."""
    return await ticket_repo.get_all_with_filters(db, status=status, priority=priority, is_flagged=is_flagged)

@router.get("/{id}", response_model=AdminTicketDetailResponse)
async def get_ticket_details(
    id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """View full ticket details, messages, and history timeline. Admin only."""
    ticket = await ticket_repo.get_full_details(db, id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.patch("/{id}/assign", response_model=TicketResponse)
async def assign_ticket(
    id: uuid.UUID,
    assign_in: TicketAssignAdmin,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """Assign an admin to the ticket."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await ticket_service.assign_ticket(db, ticket, assign_in.assigned_admin_id, current_admin.id)

@router.patch("/{id}/status", response_model=TicketResponse)
async def update_ticket_status(
    id: uuid.UUID,
    status_in: TicketUpdateStatus,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """Update ticket status."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await ticket_service.change_status(db, ticket, status_in.status, current_admin.id)

@router.post("/{id}/messages", response_model=TicketMessageResponse)
async def admin_add_ticket_message(
    id: uuid.UUID,
    msg_in: TicketMessageCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """Reply to a ticket as an admin."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await ticket_service.add_message(db, ticket_id=id, sender_id=current_admin.id, msg_in=msg_in)
