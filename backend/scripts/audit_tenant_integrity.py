import asyncio
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.knowledge_gap import KnowledgeGap
from app.models.document import Document
from app.models.improvement_recommendation import ImprovementRecommendation
from app.models.knowledge_review_task import KnowledgeReviewTask
from app.models.message_source import MessageSource
from app.models.notification import Notification
from app.models.user import User

async def audit():
    print("====================================================")
    print("OWNERSHIP INTEGRITY AUDIT")
    print("====================================================")
    
    async with AsyncSessionLocal() as session:
        # KnowledgeGap -> Document
        stmt = (
            select(KnowledgeGap, Document)
            .join(Document, KnowledgeGap.document_id == Document.id)
            .where(KnowledgeGap.tenant_id != Document.tenant_id)
        )
        result = await session.execute(stmt)
        gap_mismatches = result.all()
        
        # ImprovementRecommendation -> Document
        stmt = (
            select(ImprovementRecommendation, Document)
            .join(Document, ImprovementRecommendation.document_id == Document.id)
            .where(ImprovementRecommendation.tenant_id != Document.tenant_id)
        )
        result = await session.execute(stmt)
        rec_mismatches = result.all()
        
        # KnowledgeReviewTask -> ImprovementRecommendation
        stmt = (
            select(KnowledgeReviewTask, ImprovementRecommendation)
            .join(ImprovementRecommendation, KnowledgeReviewTask.recommendation_id == ImprovementRecommendation.id)
            .where(KnowledgeReviewTask.tenant_id != ImprovementRecommendation.tenant_id)
        )
        result = await session.execute(stmt)
        task_mismatches = result.all()
        
        # MessageSource -> Document
        stmt = (
            select(MessageSource, Document)
            .join(Document, MessageSource.document_id == Document.id)
            .where(MessageSource.tenant_id != Document.tenant_id)
        )
        result = await session.execute(stmt)
        msg_mismatches = result.all()
        
        # Notification -> User
        stmt = (
            select(Notification, User)
            .join(User, Notification.user_id == User.id)
            .where(Notification.tenant_id != User.tenant_id)
        )
        result = await session.execute(stmt)
        notif_mismatches = result.all()
        
        print("\nViolations Found")
        print(f"KnowledgeGap: {len(gap_mismatches)}")
        print(f"Recommendation: {len(rec_mismatches)}")
        print(f"ReviewTask: {len(task_mismatches)}")
        print(f"MessageSource: {len(msg_mismatches)}")
        print(f"Notification: {len(notif_mismatches)}")
        print("\nAudit Complete.")

if __name__ == "__main__":
    asyncio.run(audit())
