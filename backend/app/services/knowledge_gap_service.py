from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List

from app.models.knowledge_gap import KnowledgeGap, GapType, GapSeverity
from app.repositories.admin_repo import AdminRepository
from app.models.document import Document

class KnowledgeGapService:
    async def detect_gaps(self, db: AsyncSession) -> List[KnowledgeGap]:
        # 1. Fetch current analytics
        admin_repo = AdminRepository(db)
        impact_analytics = await admin_repo.get_knowledge_impact_analytics()
        document_health_ranking = impact_analytics.get("document_health_ranking", [])
        
        # 2. Track newly created gaps to return
        new_gaps = []
        
        # We need all document ids to iterate or check
        for doc_health in document_health_ranking:
            doc_id = doc_health["document_id"]
            health_score = doc_health["health_score"]
            total_refs = doc_health["total_references"]
            flagged = doc_health["flagged_responses"]
            
            # Rule 1: LOW_HEALTH_SCORE (< 70%)
            if health_score < 70.0:
                gap = await self._create_or_update_gap(
                    db,
                    doc_id,
                    GapType.LOW_HEALTH_SCORE,
                    GapSeverity.HIGH,
                    f"Document has a low health score of {health_score}%. Review and update content."
                )
                if gap: new_gaps.append(gap)
                
            # Rule 2: HIGH_FLAG_RATE (> 100 refs AND > 20 flags)
            if total_refs > 100 and flagged > 20:
                gap = await self._create_or_update_gap(
                    db,
                    doc_id,
                    GapType.HIGH_FLAG_RATE,
                    GapSeverity.CRITICAL,
                    f"Document is frequently flagged ({flagged} flags out of {total_refs} references). High priority review required."
                )
                if gap: new_gaps.append(gap)
                
            # Rule 3: REPEATED_FAILURES (> 5 flags)
            # Requirements say "Repeated tickets for same document" -> using flags as a proxy since 1 flag = 1 ticket
            if flagged > 5:
                gap = await self._create_or_update_gap(
                    db,
                    doc_id,
                    GapType.REPEATED_FAILURES,
                    GapSeverity.MEDIUM,
                    f"Document is causing repeated ticket escalations ({flagged} times). Consider adding missing knowledge."
                )
                if gap: new_gaps.append(gap)

        return new_gaps

    async def _create_or_update_gap(
        self, 
        db: AsyncSession, 
        document_id: str, 
        gap_type: GapType, 
        severity: GapSeverity,
        description: str
    ) -> KnowledgeGap | None:
        
        # Check if an unresolved gap of this type already exists for this document
        stmt = select(KnowledgeGap).where(
            KnowledgeGap.document_id == document_id,
            KnowledgeGap.gap_type == gap_type,
            KnowledgeGap.resolved_at.is_(None)
        )
        existing_gap = (await db.execute(stmt)).scalars().first()
        
        if existing_gap:
            return None # Already exists
            
        new_gap = KnowledgeGap(
            document_id=document_id,
            gap_type=gap_type,
            severity=severity,
            description=description,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_gap)
        await db.commit()
        await db.refresh(new_gap)
        
        return new_gap

knowledge_gap_service = KnowledgeGapService()
