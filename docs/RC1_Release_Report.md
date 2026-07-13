# Release Candidate 1 (RC1) Release Report

## 1. Project Version
**Version:** RC1
**Readiness:** Approved for Sprint 15 (Production Hardening)

## 2. Architecture Summary
- **Backend:** FastAPI, Python 3.14. PostgreSQL database managed by SQLAlchemy and Alembic. JWT-based authentication with Role-Based Access Control (RBAC).
- **Frontend:** React, Vite, TailwindCSS.

## 3. Completed Features
- JWT Authentication & Session Management
- RAG-powered Chat Interface with document-based answering
- Ticket Management System (creation, assignment, history, status updates)
- In-App Notification System
- Customer Feedback System (Like/Dislike, Content Reporting)
- Password Reset functionality
- Admin Dashboard with aggregated analytics

## 4. Sprint Timeline
- **Sprint 14.1:** Password Reset
- **Sprint 14.2:** Ticket System
- **Sprint 14.3:** Notification System Foundation
- **Sprint 14.4:** Customer Feedback

## 5. Database Status
- **Schema:** Fully normalized.
- **Migrations:** Up to date. `alembic current` confirms `20be8d66e9b8 (head)`.
- **Integrity:** `ChatMessage.feedback` and `Ticket.category` use native PostgreSQL ENUMs. No placeholder flags are used.

## 6. Validation Results
- **Pytest:** Passing (100% of test suite).
- **ESLint:** Passing (0 errors, 0 warnings).
- **Build:** `npm run build` succeeds cleanly.
- **Codebase Cleanliness:** No `TODO`, `FIXME`, `Mock`, or placeholder data remains in the active repositories. All scratch files have been expunged.

## 7. Security Review
- **RBAC Enforcement:** Admin routes (`/admin/*`) strictly validate JWT claims for the `admin` role.
- **RAG Metadata Exposure:** Customer source references are strictly limited to `Document Name` and `Retrieval Score`. Chunk indices and embeddings are completely hidden.
- **Data Isolation:** Customers can only query their own tickets, conversations, and notifications.

## 8. Known Limitations
- **Notification Delivery:** Currently relies on standard API polling (`setInterval`) rather than real-time pushing.

## 9. Technical Debt
- **Frontend Contexts:** A mild restructuring of React Contexts was performed to adhere to Vite's strict Fast Refresh rules. Further decoupling of Contexts from UI hooks could improve large-scale maintainability.

## 10. Future Sprint Recommendations (Sprint 15)
- **WebSockets:** Upgrade the Notification context to subscribe to a WebSocket channel.
- **Email Delivery:** Expand the generic `NotificationService` backend to send SMTP emails.
- **Rate Limiting:** Apply Redis-based rate limiting on sensitive routes (e.g., feedback, chat submission, password reset) prior to launch.
