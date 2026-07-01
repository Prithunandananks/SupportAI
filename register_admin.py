import httpx

base_url = "http://localhost:8000/api/v1"

print("Registering admin user...")
resp = httpx.post(f"{base_url}/auth/register", json={
    "email": "admin@example.com",
    "password": "AdminPassword123",
    "first_name": "Admin",
    "last_name": "User"
})
print("Register Status:", resp.status_code)
print("Response:", resp.text)
