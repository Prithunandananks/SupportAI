import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationType
from app.repositories.notification_repo import NotificationRepository

class NotificationService:
    """
    Business logic for notifications.
    Supports future delivery channels (e.g. Email, WebSocket, Push)
    by extending the delivery mechanism inside `create_notification`.
    """

    async def create_notification(
        self, 
        db: AsyncSession, 
        user_id: uuid.UUID, 
        title: str, 
        message: str, 
        notification_type: NotificationType, 
        related_ticket_id: Optional[uuid.UUID] = None,
        metadata_obj: Optional[Dict[str, Any]] = None
    ) -> Notification:
        repo = NotificationRepository(db)
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            related_ticket_id=related_ticket_id,
            metadata_obj=metadata_obj
        )
        
        # 1. Persist to Database (In-App Notification)
        created_notification = await repo.create(notification)

        # 2. Future: Emit via WebSocket
        # await self._emit_websocket(user_id, created_notification)

        # 3. Future: Send Email depending on user preferences
        # await self._send_email(user_id, created_notification)

        return created_notification

    async def get_user_notifications(self, db: AsyncSession, user_id: uuid.UUID, limit: int = 50) -> List[Notification]:
        repo = NotificationRepository(db)
        return await repo.get_user_notifications(user_id, limit)

    async def mark_as_read(self, db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        repo = NotificationRepository(db)
        # Ensure ownership
        notification = await repo.get_by_id(notification_id)
        if notification and notification.user_id == user_id:
            return await repo.mark_as_read(notification_id)
        return None

    async def mark_all_as_read(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        repo = NotificationRepository(db)
        await repo.mark_all_as_read(user_id)

    async def archive_notification(self, db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        repo = NotificationRepository(db)
        notification = await repo.get_by_id(notification_id)
        if notification and notification.user_id == user_id:
            return await repo.archive(notification_id)
        return None

notification_service = NotificationService()
