import asyncio
import uuid
import sys

# Add backend directory to sys.path
sys.path.append('d:\\projects\\SupportAI\\backend')

from app.db.session import AsyncSessionLocal
from app.models.ticket import TicketStatus
from app.services.ticket_service import ticket_service
from app.repositories.ticket_repo import ticket_repo

async def test_transition():
    async with AsyncSessionLocal() as db:
        tickets = await ticket_repo.get_all_with_filters(db)
        if not tickets:
            print("No tickets found")
            return
        ticket = tickets[0]
        print(f"Current ticket status: {ticket.status}")
        print("Attempting to transition to IN_PROGRESS")
        try:
            admin_id = uuid.uuid4()
            await ticket_service.change_status(db, ticket, TicketStatus.IN_PROGRESS, admin_id)
            print("Transition to IN_PROGRESS SUCCESSFUL")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Transition to IN_PROGRESS FAILED with exception: {type(e).__name__}: {str(e)}")

asyncio.run(test_transition())
