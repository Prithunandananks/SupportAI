import asyncio
import os
import sys
import argparse

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import AsyncSessionLocal
from app.models.knowledge_gap import KnowledgeGap
from app.models.document import Document
from app.models.improvement_recommendation import ImprovementRecommendation
from app.models.knowledge_review_task import KnowledgeReviewTask
from app.models.message_source import MessageSource
from app.models.notification import Notification
from app.models.user import User

async def remediate(purge: bool = False):
    mode = "PURGE" if purge else "DRY-RUN"
    print("====================================================")
    print(f"CONTAMINATION REMEDIATION: {mode}")
    print("====================================================")
    
    async with AsyncSessionLocal() as session:
        # 1. KnowledgeGap
        stmt = select(KnowledgeGap.id).join(Document, KnowledgeGap.document_id == Document.id).where(KnowledgeGap.tenant_id != Document.tenant_id)
        result = await session.execute(stmt)
        gap_ids = result.scalars().all()
        
        if gap_ids and purge:
            await session.execute(delete(KnowledgeGap).where(KnowledgeGap.id.in_(gap_ids)))
            
        # 2. Recommendation
        stmt = select(ImprovementRecommendation.id).join(Document, ImprovementRecommendation.document_id == Document.id).where(ImprovementRecommendation.tenant_id != Document.tenant_id)
        result = await session.execute(stmt)
        rec_ids = result.scalars().all()
        
        if rec_ids and purge:
            await session.execute(delete(ImprovementRecommendation).where(ImprovementRecommendation.id.in_(rec_ids)))
            
        # 3. ReviewTask
        stmt = select(KnowledgeReviewTask.id).join(ImprovementRecommendation, KnowledgeReviewTask.recommendation_id == ImprovementRecommendation.id).where(KnowledgeReviewTask.tenant_id != ImprovementRecommendation.tenant_id)
        result = await session.execute(stmt)
        task_ids = result.scalars().all()
        
        if task_ids and purge:
            await session.execute(delete(KnowledgeReviewTask).where(KnowledgeReviewTask.id.in_(task_ids)))
            
        # 4. MessageSource
        stmt = select(MessageSource.id).join(Document, MessageSource.document_id == Document.id).where(MessageSource.tenant_id != Document.tenant_id)
        result = await session.execute(stmt)
        msg_ids = result.scalars().all()
        
        if msg_ids and purge:
            await session.execute(delete(MessageSource).where(MessageSource.id.in_(msg_ids)))
            
        # 5. Notification
        stmt = select(Notification.id).join(User, Notification.user_id == User.id).where(Notification.tenant_id != User.tenant_id)
        result = await session.execute(stmt)
        notif_ids = result.scalars().all()
        
        if notif_ids and purge:
            await session.execute(delete(Notification).where(Notification.id.in_(notif_ids)))
            
        if purge:
            await session.commit()
            
        print("\nSummary Report")
        print(f"KnowledgeGap Mismatches: {len(gap_ids)}")
        print(f"Recommendation Mismatches: {len(rec_ids)}")
        print(f"ReviewTask Mismatches: {len(task_ids)}")
        print(f"MessageSource Mismatches: {len(msg_ids)}")
        print(f"Notification Mismatches: {len(notif_ids)}")
        
        if purge:
            print(f"\nSuccessfully purged all {sum([len(gap_ids), len(rec_ids), len(task_ids), len(msg_ids), len(notif_ids)])} cross-tenant records.")
        else:
            print("\nRun with --purge to delete these records.")
        print("\nRemediation Complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--purge", action="store_true", help="Delete contaminated records")
    parser.add_argument("--dry-run", action="store_true", help="Report only")
    args = parser.parse_args()
    
    asyncio.run(remediate(purge=args.purge))
