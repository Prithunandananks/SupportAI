import asyncio
from app.db.session import async_session_maker
from app.services.ticket_service import ticket_service
from app.schemas.ticket import TicketCreate
import uuid

async def main():
    async with async_session_maker() as db:
        try:
            t = TicketCreate(title="Test", description="Test", category="GENERAL", priority="HIGH")
            await ticket_service.create_ticket(db, t, customer_id=uuid.uuid4())
            print("SUCCESS")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
