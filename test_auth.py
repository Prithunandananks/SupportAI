import httpx
import json

base_url = "http://localhost:8000/api/v1"

# 1. Register User
print("Testing Register...")
resp = httpx.post(f"{base_url}/auth/register", json={
    "email": "test2@example.com",
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User"
})
print("Register Status:", resp.status_code)
# Should be 201 or 400 if exists

# 2. Login User
print("\nTesting Login...")
resp = httpx.post(f"{base_url}/auth/login", data={
    "username": "test2@example.com",
    "password": "TestPassword123"
})
print("Login Status:", resp.status_code)
tokens = resp.json()
access_token = tokens.get("access_token")
refresh_token = tokens.get("refresh_token")

# 3. Get Me with Access Token
print("\nTesting Get Me (Access Token)...")
resp = httpx.get(f"{base_url}/users/me", headers={
    "Authorization": f"Bearer {access_token}"
})
print("Get Me Status:", resp.status_code)
if resp.status_code == 200:
    print("User Role:", resp.json().get("role"))

# 4. Attempt Get Me with Refresh Token (Should Fail - 403)
print("\nTesting Get Me (Refresh Token)...")
resp = httpx.get(f"{base_url}/users/me", headers={
    "Authorization": f"Bearer {refresh_token}"
})
print("Get Me with Refresh Token Status:", resp.status_code)
print("Response:", resp.text)

# 5. Refresh Token properly
print("\nTesting Refresh Token Endpoint...")
resp = httpx.post(f"{base_url}/auth/refresh", json={
    "refresh_token": refresh_token
})
print("Refresh Status:", resp.status_code)
if resp.status_code == 200:
    access_token = resp.json().get("access_token")

# 6. Logout
print("\nTesting Logout...")
resp = httpx.post(f"{base_url}/auth/logout", headers={
    "Authorization": f"Bearer {access_token}"
})
print("Logout Status:", resp.status_code)
