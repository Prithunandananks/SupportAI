import asyncio
import uuid
import sys

sys.path.append('d:\\projects\\SupportAI\\backend')
from app.db.session import AsyncSessionLocal
from app.services.ticket_service import ticket_service
from app.services.notification_service import notification_service
from app.repositories.ticket_repo import ticket_repo
from app.models.ticket import TicketStatus

async def test():
    async with AsyncSessionLocal() as db:
        tickets = await ticket_repo.get_all_with_filters(db)
        ticket = next((t for t in tickets if t.status == TicketStatus.IN_PROGRESS), tickets[0])
        
        print("Creating notification...")
        
        await ticket_service.change_status(db, ticket, TicketStatus.RESOLVED, ticket.customer_id)
        
        notifs = await notification_service.get_user_notifications(db, ticket.customer_id)
        print(f"Total notifications: {len(notifs)}")
        for i, n in enumerate(notifs[:10]):
            print(f"[{i}] {n.created_at.isoformat()} | {n.title} | {n.type} | is_read={n.is_read}")

asyncio.run(test())
