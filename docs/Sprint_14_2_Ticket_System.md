# Sprint 14.2: Ticket System

## Objectives
Implement a complete Customer Support Ticket System to handle escalation from the AI chatbot.

## Architecture
- **Database:** PostgreSQL schemas for `Ticket` and `TicketMessage`. Status Enums (`OPEN`, `IN_PROGRESS`, `RESOLVED`, etc.).
- **Backend:** Service/Repository pattern for Ticket management. Separate routers for `/tickets` (Customer) and `/admin/tickets` (Admin).
- **Frontend:** Dedicated interfaces for customers to manage their tickets and for admins to assign, reply, and update status.

## Files Modified
- `backend/app/models/ticket.py`
- `backend/app/api/v1/tickets.py`
- `backend/app/api/v1/admin.py`
- `frontend/src/services/ticket.service.ts`
- `frontend/src/pages/customer/Tickets.tsx`
- `frontend/src/pages/customer/TicketDetails.tsx`
- `frontend/src/pages/admin/AdminTickets.tsx`

## Root Cause
Users needed human intervention when the AI could not resolve their issue.

## Implementation
- Added Alembic migrations for new models.
- Established strict RBAC on admin endpoints.
- Developed real-time-like ticket message timelines.

## Validation Results
- Pytest suite extended to cover ticket lifecycle (creation, assignment, messaging, closing).
- All endpoints successfully validated against RBAC rules.

## Completion Status
100% Implemented.
