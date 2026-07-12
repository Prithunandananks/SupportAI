import asyncio
import sys
import argparse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.repositories.user_repo import user_repo

async def promote_user(email: str):
    print(f"Looking up user with email: {email}")
    async with AsyncSessionLocal() as session:
        user = await user_repo.get_by_email(session, email=email)
        
        if not user:
            print(f"Error: User with email '{email}' not found in the database.")
            sys.exit(1)
            
        if user.role == "Admin":
            print(f"User '{email}' is already an Admin.")
            return

        print(f"Found user: {user.first_name} {user.last_name} (Current role: {user.role})")
        
        # Promote to Admin
        user.role = "Admin"
        session.add(user)
        await session.commit()
        
        print(f"Successfully promoted '{email}' to Admin role.")

def main():
    parser = argparse.ArgumentParser(description="Promote an existing user to Administrator.")
    parser.add_argument("email", help="The email address of the user to promote.")
    
    args = parser.parse_args()
    
    email = args.email.strip().lower()
    
    asyncio.run(promote_user(email))

if __name__ == "__main__":
    main()
