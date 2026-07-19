import pytest
import uuid
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.ticket_service import TicketService
from app.models.ticket import TicketStatus, TicketPriority, TicketCategory
from app.schemas.ticket import TicketCreate
from datetime import datetime, timezone

@pytest.fixture
def db_session():
    return AsyncMock()

@pytest.fixture
def ticket_service():
    return TicketService()

@pytest.mark.asyncio
async def test_generate_ticket_number(ticket_service, db_session):
    with patch("app.services.ticket_service.ticket_repo.count_all", new_callable=AsyncMock) as mock_count:
        mock_count.return_value = 5
        number = await ticket_service.generate_ticket_number(db_session)
        assert number == "SUP-000006"

def test_validate_transition(ticket_service):
    assert ticket_service.validate_transition(TicketStatus.OPEN, TicketStatus.IN_PROGRESS) is True
    assert ticket_service.validate_transition(TicketStatus.OPEN, TicketStatus.CLOSED) is True
    assert ticket_service.validate_transition(TicketStatus.OPEN, TicketStatus.RESOLVED) is False
    assert ticket_service.validate_transition(TicketStatus.CLOSED, TicketStatus.OPEN) is False

@pytest.mark.asyncio
async def test_create_ticket(ticket_service, db_session):
    customer_id = uuid.uuid4()
    ticket_in = TicketCreate(
        title="Test issue",
        description="I have a problem",
        category=TicketCategory.BUG,
        priority=TicketPriority.HIGH
    )
    
    mock_ticket = MagicMock()
    mock_ticket.id = uuid.uuid4()
    
    with patch.object(ticket_service, "generate_ticket_number", return_value="SUP-000001"), \
         patch("app.services.ticket_service.ticket_repo.create", new_callable=AsyncMock) as mock_create, \
         patch("app.services.ticket_service.ticket_history_repo.create", new_callable=AsyncMock) as mock_history, \
         patch("app.services.ticket_service.notification_service.create_notification", new_callable=AsyncMock) as mock_notify, \
         patch("app.services.auto_assignment_service.AutoAssignmentService.assign_ticket", new_callable=AsyncMock) as mock_assign:
        
        mock_create.return_value = mock_ticket
        mock_assign.return_value = mock_ticket
        
        result = await ticket_service.create_ticket(db_session, ticket_in, customer_id)
        
        assert result == mock_ticket
        mock_create.assert_called_once()
        mock_history.assert_called_once()
        mock_notify.assert_called_once()

@pytest.mark.asyncio
async def test_add_message_ticket_not_found(ticket_service, db_session):
    with patch("app.services.ticket_service.ticket_repo.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            from app.schemas.ticket import TicketMessageCreate
            await ticket_service.add_message(db_session, uuid.uuid4(), uuid.uuid4(), TicketMessageCreate(message="Hello"))
        assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_add_message_closed_ticket(ticket_service, db_session):
    mock_ticket = MagicMock()
    mock_ticket.status = TicketStatus.CLOSED
    
    with patch("app.services.ticket_service.ticket_repo.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_ticket
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            from app.schemas.ticket import TicketMessageCreate
            await ticket_service.add_message(db_session, uuid.uuid4(), uuid.uuid4(), TicketMessageCreate(message="Hello"))
        assert exc.value.status_code == 400

@pytest.mark.asyncio
async def test_add_message_success(ticket_service, db_session):
    mock_ticket = MagicMock()
    mock_ticket.status = TicketStatus.OPEN
    mock_ticket.id = uuid.uuid4()
    mock_ticket.customer_id = uuid.uuid4()
    mock_ticket.first_response_at = None
    mock_ticket.first_response_due = None
    
    mock_sender = MagicMock()
    mock_sender.role = "Admin"
    
    with patch("app.services.ticket_service.ticket_repo.get", new_callable=AsyncMock) as mock_get, \
         patch("app.services.ticket_service.ticket_message_repo.create", new_callable=AsyncMock) as mock_create_msg, \
         patch("app.services.ticket_service.user_repo.get", new_callable=AsyncMock) as mock_get_user, \
         patch("app.services.ticket_service.ticket_repo.update", new_callable=AsyncMock) as mock_update, \
         patch("app.services.ticket_service.ticket_history_repo.create", new_callable=AsyncMock) as mock_history, \
         patch("app.services.ticket_service.notification_service.create_notification", new_callable=AsyncMock) as mock_notify:
        
        mock_get.return_value = mock_ticket
        mock_get_user.return_value = mock_sender
        mock_msg = MagicMock()
        mock_create_msg.return_value = mock_msg
        mock_update.return_value = mock_ticket
        
        from app.schemas.ticket import TicketMessageCreate
        result = await ticket_service.add_message(db_session, mock_ticket.id, uuid.uuid4(), TicketMessageCreate(message="Hello"))
        
        assert result == mock_msg
        mock_create_msg.assert_called_once()
        mock_update.assert_called_once()
        mock_notify.assert_called_once()

