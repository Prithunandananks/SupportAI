from fastapi import APIRouter
from app.api.v1 import (
    chat,
    auth,
    users,
    admin,
    documents,
    tickets,
    admin_tickets,
    notifications,
    quality,
    organization,
    audit_logs,
    api_keys,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organization.router, prefix="/organization", tags=["organization"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(admin_tickets.router, prefix="/admin/tickets", tags=["admin tickets"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(quality.router, prefix="/admin/quality", tags=["quality"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit logs"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["api keys"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
