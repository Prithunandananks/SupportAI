# Sprint 14.4: Customer Feedback

## Objectives
Enable users to rate AI responses (Like/Dislike) and report messages for inaccuracies or hallucinations.

## Architecture
- **Database:** `ChatMessage` schema updated with a `feedback` column using a native PostgreSQL Enum (`LIKE`, `DISLIKE`). `Ticket` schema augmented with `chat_message_id`, `report_reason`, and `customer_comment`.
- **Backend:** Chat API updated to handle feedback endpoints without data-loss or graceful degradation mocks. Real persistence.
- **Frontend:** `ChatMessage.tsx` augmented with Thumbs Up, Thumbs Down, and Flag buttons. `ReportMessageModal.tsx` creates real tickets.

## Files Modified
- `backend/app/models/chat.py`
- `backend/app/models/ticket.py`
- `backend/app/api/v1/chat.py`
- `frontend/src/components/chat/ChatMessage.tsx`
- `frontend/src/components/chat/ReportMessageModal.tsx`
- `frontend/src/pages/admin/AdminDashboard.tsx`

## Root Cause
Lack of visibility into RAG system performance from the end-user perspective.

## Implementation
- Alembic migrations executed successfully modifying `ChatMessage` and `Ticket`.
- Reporting a message immediately triggers the Ticket pipeline, creating an `OPEN` ticket under the `REPORT` category.
- Admin dashboard now computes feedback statistics dynamically from PostgreSQL rather than using mock hardcoded values.
- RAG metadata (chunk indices, page numbers) stripped from the Customer Source chips for security, exposing only Document Name and Retrieval Score.

## Validation Results
- Verified feedback persistence in the database.
- Confirmed "Report" successfully generates a Ticket.
- Validated UI feedback states prevent duplicate feedback submission.

## Completion Status
100% Implemented.
