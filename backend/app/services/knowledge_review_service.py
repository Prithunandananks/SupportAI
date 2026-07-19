from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid
from typing import List, Optional

from app.models.knowledge_review_task import KnowledgeReviewTask, ReviewTaskStatus
from app.models.improvement_recommendation import ImprovementRecommendation, RecommendationStatus
from app.services.notification_service import notification_service
from app.models.notification import NotificationType

class KnowledgeReviewService:
    async def create_task(
        self,
        db: AsyncSession,
        recommendation_id: str | uuid.UUID,
        document_id: str | uuid.UUID,
        assigned_admin_id: str | uuid.UUID | None = None,
        notes: str | None = None
    ) -> KnowledgeReviewTask:
        # Prevent duplicate active tasks for the same recommendation
        stmt = select(KnowledgeReviewTask).where(
            KnowledgeReviewTask.recommendation_id == recommendation_id,
            KnowledgeReviewTask.status.in_([ReviewTaskStatus.OPEN, ReviewTaskStatus.IN_PROGRESS, ReviewTaskStatus.UNDER_REVIEW])
        )
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            return existing

        task = KnowledgeReviewTask(
            recommendation_id=recommendation_id,
            document_id=document_id,
            assigned_admin_id=assigned_admin_id,
            notes=notes,
            status=ReviewTaskStatus.OPEN
        )
        db.add(task)
        
        # Link Recommendation back if necessary or update recommendation status
        rec = await db.get(ImprovementRecommendation, recommendation_id)
        if rec and rec.status == RecommendationStatus.OPEN:
            rec.status = RecommendationStatus.IN_PROGRESS
            db.add(rec)
            
        await db.commit()
        await db.refresh(task)

        if assigned_admin_id:
            await notification_service.create_notification(
                db=db,
                user_id=assigned_admin_id,
                title="Knowledge Review Task Assigned",
                message="You have been assigned a new Knowledge Review Task.",
                notification_type=NotificationType.SYSTEM
            )

        return task

    async def get_task(self, db: AsyncSession, task_id: str | uuid.UUID) -> Optional[KnowledgeReviewTask]:
        return await db.get(KnowledgeReviewTask, task_id)

    async def get_tasks(self, db: AsyncSession) -> List[KnowledgeReviewTask]:
        from sqlalchemy import desc
        stmt = select(KnowledgeReviewTask).order_by(desc(KnowledgeReviewTask.created_at))
        return list((await db.execute(stmt)).scalars().all())
        
    async def get_tasks_for_document(self, db: AsyncSession, document_id: str | uuid.UUID) -> List[KnowledgeReviewTask]:
        from sqlalchemy import desc
        stmt = select(KnowledgeReviewTask).where(KnowledgeReviewTask.document_id == document_id).order_by(desc(KnowledgeReviewTask.created_at))
        return list((await db.execute(stmt)).scalars().all())

    async def update_task_status(
        self,
        db: AsyncSession,
        task_id: str | uuid.UUID,
        status: ReviewTaskStatus
    ) -> Optional[KnowledgeReviewTask]:
        task = await self.get_task(db, task_id)
        if not task:
            return None
            
        task.status = status
        
        if status in [ReviewTaskStatus.COMPLETED, ReviewTaskStatus.DISMISSED]:
            task.completed_at = datetime.now(timezone.utc)
            
            # Auto-resolve recommendation
            rec = await db.get(ImprovementRecommendation, task.recommendation_id)
            if rec:
                rec.status = RecommendationStatus.COMPLETED if status == ReviewTaskStatus.COMPLETED else RecommendationStatus.DISMISSED
                rec.resolved_at = datetime.now(timezone.utc)
                db.add(rec)

            if task.assigned_admin_id:
                await notification_service.create_notification(
                    db=db,
                    user_id=task.assigned_admin_id,
                    title="Knowledge Review Task Closed",
                    message=f"Review task has been marked as {status.value}.",
                    notification_type=NotificationType.SYSTEM
                )

        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task

    async def assign_task(
        self,
        db: AsyncSession,
        task_id: str | uuid.UUID,
        assigned_admin_id: str | uuid.UUID | None
    ) -> Optional[KnowledgeReviewTask]:
        task = await self.get_task(db, task_id)
        if not task:
            return None
            
        is_reassign = task.assigned_admin_id is not None and assigned_admin_id is not None and str(task.assigned_admin_id) != str(assigned_admin_id)
        task.assigned_admin_id = assigned_admin_id
        
        db.add(task)
        await db.commit()
        await db.refresh(task)
        
        if assigned_admin_id:
            await notification_service.create_notification(
                db=db,
                user_id=assigned_admin_id,
                title="Knowledge Review Task Reassigned" if is_reassign else "Knowledge Review Task Assigned",
                message="You have been assigned a Knowledge Review Task.",
                notification_type=NotificationType.SYSTEM
            )

        return task

knowledge_review_service = KnowledgeReviewService()
