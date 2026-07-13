from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from app.models.notification import Notification, NotificationStatus, NotificationType

class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, notification_id: uuid.UUID) -> Optional[Notification]:
        result = await self.session.execute(select(Notification).where(Notification.id == notification_id))
        return result.scalars().first()

    async def get_user_notifications(self, user_id: uuid.UUID, limit: int = 50) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id, Notification.status != NotificationStatus.ARCHIVED)
            .order_by(desc(Notification.created_at))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, notification: Notification) -> Notification:
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        return notification

    async def mark_as_read(self, notification_id: uuid.UUID) -> Optional[Notification]:
        notification = await self.get_by_id(notification_id)
        if notification and notification.status == NotificationStatus.NEW:
            notification.status = NotificationStatus.READ
            notification.is_read = True
            await self.session.commit()
            await self.session.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: uuid.UUID) -> None:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.status == NotificationStatus.NEW)
            .values(status=NotificationStatus.READ, is_read=True)
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def archive(self, notification_id: uuid.UUID) -> Optional[Notification]:
        notification = await self.get_by_id(notification_id)
        if notification:
            notification.status = NotificationStatus.ARCHIVED
            await self.session.commit()
            await self.session.refresh(notification)
        return notification
