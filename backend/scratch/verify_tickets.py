import asyncio
import sys

sys.path.append('d:\\projects\\SupportAI\\backend')
from app.db.session import AsyncSessionLocal
from app.repositories.ticket_repo import ticket_repo

async def verify():
    async with AsyncSessionLocal() as db:
        tickets = await ticket_repo.get_all_with_filters(db)
        print(f"Total tickets: {len(tickets)}")
        print("Last 5 tickets:")
        for t in tickets[:5]:
            print(f"ID: {t.id} | Number: {t.ticket_number} | Status: {t.status} | Created: {t.created_at}")

asyncio.run(verify())
