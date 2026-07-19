import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.models.ticket import TicketStatus, TicketPriority
from app.schemas.ticket import (
    TicketResponse, 
    AdminTicketResponse,
    AdminTicketDetailResponse, 
    TicketUpdateStatus, 
    TicketAssignAdmin, 
    TicketMessageCreate, 
    TicketMessageResponse,
    TicketNoteCreate,
    TicketNoteResponse
)
from app.repositories.ticket_repo import ticket_repo
from app.services.ticket_service import ticket_service

router = APIRouter()

@router.get("/", response_model=List[AdminTicketResponse])
async def list_all_tickets(
    status: Optional[TicketStatus] = Query(None),
    priority: Optional[TicketPriority] = Query(None),
    is_flagged: Optional[bool] = Query(None),
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """List all tickets across all users (with filtering). Admin only."""
    return await ticket_repo.get_all_with_filters(db, status=status, priority=priority, is_flagged=is_flagged)

@router.get("/assigned/me", response_model=List[AdminTicketResponse])
async def get_tickets_assigned_to_me(
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """List tickets assigned to the current admin."""
    return await ticket_repo.get_tickets_assigned_to_user(db, current_admin.id)

@router.get("/unassigned", response_model=List[AdminTicketResponse])
async def get_unassigned_tickets(
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """List unassigned tickets."""
    return await ticket_repo.get_unassigned_tickets(db)

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

@router.patch("/{id}/assign", response_model=AdminTicketResponse)
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
        
    assignee_id = assign_in.assignee_id or assign_in.assigned_admin_id or current_admin.id
    return await ticket_service.assign_ticket(db, ticket, assignee_id, current_admin.id)

@router.patch("/{id}/unassign", response_model=AdminTicketResponse)
async def unassign_ticket(
    id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """Unassign a ticket."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await ticket_service.unassign_ticket(db, ticket, current_admin.id)

@router.patch("/{id}/status", response_model=AdminTicketResponse)
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

@router.post("/{id}/notes", response_model=TicketNoteResponse)
async def admin_add_internal_note(
    id: uuid.UUID,
    note_in: TicketNoteCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_admin: User = Depends(deps.require_role("admin"))
):
    """Add an internal note to a ticket (Admin only)."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await ticket_service.add_internal_note(db, ticket_id=id, author_id=current_admin.id, note_in=note_in)
