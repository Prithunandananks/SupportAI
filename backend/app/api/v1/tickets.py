import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketResponse, TicketDetailResponse, TicketMessageCreate, TicketMessageResponse
from app.repositories.ticket_repo import ticket_repo
from app.services.ticket_service import ticket_service

router = APIRouter()

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a new support ticket."""
    return await ticket_service.create_ticket(db, ticket_in, current_user.id)

@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List all tickets for the authenticated customer."""
    return await ticket_repo.get_all_for_customer(db, current_user.id)

@router.get("/{id}", response_model=TicketDetailResponse)
async def get_ticket(
    id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get ticket details and messages."""
    ticket = await ticket_repo.get_full_details(db, id)
    if not ticket or ticket.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Note: Customer endpoints must never expose internal messages.
    # Since we did not add is_internal to TicketMessage per the refined instructions,
    # all messages are public. If is_internal is added later, filter here.
    return ticket

@router.post("/{id}/messages", response_model=TicketMessageResponse)
async def add_ticket_message(
    id: uuid.UUID,
    msg_in: TicketMessageCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Reply to a ticket."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket or ticket.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return await ticket_service.add_message(db, ticket_id=id, sender_id=current_user.id, msg_in=msg_in)

@router.patch("/{id}/close", response_model=TicketResponse)
async def close_ticket(
    id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Close a ticket."""
    ticket = await ticket_repo.get(db, id=id)
    if not ticket or ticket.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return await ticket_service.close_ticket_by_customer(db, ticket, current_user.id)
