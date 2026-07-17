import asyncio
import io
import pytest
from httpx import AsyncClient
from app.main import app
from app.db.session import AsyncSessionLocal
from app.db.seed import seed_admin

async def main():
    print("Starting validation...")
    
    # We will use httpx AsyncClient to hit the API
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        # Need to login to get a token for uploading
        print("Logging in as admin...")
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "admin@supportai.com", "password": "adminpassword"}
        )
        if response.status_code != 200:
            print("Failed to login:", response.json())
            return
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. Upload a test document
        print("Uploading document...")
        doc_content = b"The refund period is 30 days from the date of purchase."
        files = {"file": ("refund_policy.txt", doc_content, "text/plain")}
        
        up_resp = await client.post("/api/v1/documents/", headers=headers, files=files)
        print("Upload Response:", up_resp.status_code, up_resp.json())
        
        # Let's hit the /search endpoint to mimic Admin Search (which was the trigger for the bug!)
        print("Mimicking Admin Search...")
        search_resp = await client.get("/api/v1/documents/search?q=refund", headers=headers)
        print("Search Response:", search_resp.status_code, [r['text'] for r in search_resp.json()['results']])
        
        # 2. Ask question
        print("Asking question via Customer Chat...")
        chat_req = {"message": "What is the refund period?"}
        chat_resp = await client.post("/api/v1/chat/session/00000000-0000-0000-0000-000000000000/message", json=chat_req)
        print("Chat Response:", chat_resp.status_code, chat_resp.json())
        
if __name__ == '__main__':
    asyncio.run(main())
