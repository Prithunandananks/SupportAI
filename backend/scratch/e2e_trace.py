import sys
from fastapi.testclient import TestClient
from app.main import app

def main():
    print("--- Starting Validation ---")
    client = TestClient(app)
    
    print("1. Logging in as Admin...")
    resp = client.post("/api/v1/auth/login", data={"username": "admin@supportai.com", "password": "adminpassword"})
    if resp.status_code != 200:
        print("Login failed!", resp.json())
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("2. Uploading test document...")
    doc_content = b"The refund period is 30 days from the date of purchase."
    files = {"file": ("refund_policy.txt", doc_content, "text/plain")}
    resp = client.post("/api/v1/documents/", headers=headers, files=files)
    print("Upload response:", resp.status_code, resp.json())
    
    print("3. Executing Admin Search to trigger potential regression...")
    resp = client.get("/api/v1/documents/search?q=refund", headers=headers)
    
    print("4. Asking Customer Chat 'What is the refund period?'...")
    resp = client.post("/api/v1/chat/session/00000000-0000-0000-0000-000000000000/message", json={"message": "What is the refund period?"})
    print("Chat response:", resp.status_code)
    try:
        print("Answer:", resp.json())
    except:
        print("Raw:", resp.text)
        
if __name__ == '__main__':
    main()
