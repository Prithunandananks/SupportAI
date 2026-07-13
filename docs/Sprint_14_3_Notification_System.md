# Sprint 14.3: Notification System Foundation

## Objectives
Implement a robust, extensible in-app notification system tightly integrated with the Ticket lifecycle.

## Architecture
- **Database:** `Notification` model with Enums linking to user accounts.
- **Backend:** Generic `NotificationService` that can be extended for emails/push later. Triggered synchronously within `TicketService`.
- **Frontend:** React Context API with a polling mechanism (ready for WebSocket upgrade in the future).

## Files Modified
- `backend/app/models/notification.py`
- `backend/app/api/v1/notifications.py`
- `backend/app/services/notification_service.py`
- `backend/app/services/ticket_service.py`
- `frontend/src/store/NotificationProvider.tsx`
- `frontend/src/store/NotificationContext.ts`
- `frontend/src/hooks/useNotifications.ts`
- `frontend/src/components/layout/NotificationDropdown.tsx`
- `frontend/src/pages/customer/Notifications.tsx`

## Root Cause
Customers were not aware when an admin replied to their support ticket.

## Implementation
- Alembic migration applied.
- Trigger matrix injected into `TicketService` (e.g. `TICKET_CREATED`, `TICKET_ASSIGNED`, `TICKET_REPLY`).
- UI includes a dropdown bell and a dedicated page with Mark-as-Read functionality.
- Addressed SQLAlchemy Greenlet errors by enforcing explicit `db.refresh()`.

## Validation Results
- Notifications are successfully persisted and fetched.
- Clicking a notification marks it as read and correctly routes the user to the related ticket.

## Completion Status
100% Implemented.
