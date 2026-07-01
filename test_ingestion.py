import httpx
import os

base_url = "http://localhost:8000/api/v1"

print("1. Logging in as admin...")
resp = httpx.post(f"{base_url}/auth/login", data={
    "username": "admin@example.com",
    "password": "AdminPassword123"
})
if resp.status_code != 200:
    print("Failed to login:", resp.text)
    exit(1)
    
access_token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {access_token}"}

print("2. Uploading a text file...")
with open("sample.txt", "w") as f:
    f.write("SupportAI is an advanced customer support platform that integrates Retrieval-Augmented Generation (RAG). It uses Qdrant for vector search and Groq for LLM inference.")

with open("sample.txt", "rb") as f:
    files = {"file": ("sample.txt", f, "text/plain")}
    resp = httpx.post(f"{base_url}/documents/upload", files=files, headers=headers)
    print("Upload Status:", resp.status_code)
    print("Upload Response:", resp.text)

print("\n3. Testing Semantic Search...")
resp = httpx.get(f"{base_url}/documents/search", params={"q": "What database does SupportAI use for vectors?"}, headers=headers)
print("Search Status:", resp.status_code)
print("Search Response:", resp.text)
