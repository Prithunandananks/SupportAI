# Sprint 14.1: Password Reset

## Objectives
Provide a secure mechanism for users to reset their passwords if forgotten.

## Architecture
- **Backend:** FastAPI endpoints for requesting and completing password resets. Uses standard JWTs with a short expiration for secure token delivery.
- **Frontend:** React pages for initiating the reset and confirming the new password.

## Files Modified
- `backend/app/api/v1/auth.py`
- `backend/app/services/auth_service.py`
- `frontend/src/pages/auth/ResetPassword.tsx`
- `frontend/src/pages/auth/ForgotPassword.tsx`

## Root Cause
Feature requirement for standard user account management parity.

## Implementation
1. User requests reset -> Backend generates a temporary JWT reset token.
2. User provides new password with token -> Backend verifies token and updates password hash in PostgreSQL.

## Validation Results
- Pytest unit tests confirm token validation and password hashing updates.
- End-to-end testing confirms UI flow.

## Completion Status
100% Implemented.
