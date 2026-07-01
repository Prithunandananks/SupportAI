import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://user:password@localhost:5432/supportai')
    await conn.execute("UPDATE users SET role='Admin' WHERE email='admin@example.com'")
    await conn.close()

asyncio.run(main())
