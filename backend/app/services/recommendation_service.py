from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List
import uuid

from app.models.improvement_recommendation import ImprovementRecommendation, RecommendationType, RecommendationStatus
from app.models.knowledge_gap import KnowledgeGap, GapType
from app.repositories.admin_repo import AdminRepository

class RecommendationService:
    async def generate_recommendations(self, db: AsyncSession) -> List[ImprovementRecommendation]:
        admin_repo = AdminRepository(db)
        impact_analytics = await admin_repo.get_knowledge_impact_analytics()
        document_health_ranking = impact_analytics.get("document_health_ranking", [])
        
        # We also need active gaps
        active_gaps_stmt = select(KnowledgeGap).where(KnowledgeGap.resolved_at.is_(None))
        active_gaps = (await db.execute(active_gaps_stmt)).scalars().all()
        gaps_by_doc = {}
        for g in active_gaps:
            doc_id = str(g.document_id)
            if doc_id not in gaps_by_doc:
                gaps_by_doc[doc_id] = []
            gaps_by_doc[doc_id].append(g)

        new_or_updated = []

        for doc_health in document_health_ranking:
            doc_id = doc_health["document_id"]
            health_score = doc_health["health_score"]
            
            # Rule 1: Document Health Score < 70% -> Generate DOCUMENT_REVIEW
            if health_score < 70.0:
                rec = await self._create_or_update(
                    db,
                    doc_id,
                    RecommendationType.DOCUMENT_REVIEW,
                    "HIGH",
                    "Document Health Review Required",
                    "Review document due to low health score."
                )
                if rec: new_or_updated.append(rec)
            else:
                await self._auto_resolve(db, doc_id, RecommendationType.DOCUMENT_REVIEW)

            doc_gaps = gaps_by_doc.get(str(doc_id), [])
            gap_types = {g.gap_type: g for g in doc_gaps}

            # Rule 2: Document has HIGH_FLAG_RATE gap -> Generate CONTENT_UPDATE
            if GapType.HIGH_FLAG_RATE in gap_types:
                rec = await self._create_or_update(
                    db,
                    doc_id,
                    RecommendationType.CONTENT_UPDATE,
                    "CRITICAL",
                    "High Flag Rate Remediation",
                    "Document is frequently associated with flagged responses.",
                    knowledge_gap_id=gap_types[GapType.HIGH_FLAG_RATE].id
                )
                if rec: new_or_updated.append(rec)
            else:
                await self._auto_resolve(db, doc_id, RecommendationType.CONTENT_UPDATE)

            # Rule 3: Document has REPEATED_FAILURES gap -> Generate CONTENT_EXPANSION
            if GapType.REPEATED_FAILURES in gap_types:
                rec = await self._create_or_update(
                    db,
                    doc_id,
                    RecommendationType.CONTENT_EXPANSION,
                    "MEDIUM",
                    "Expand Content Coverage",
                    "Expand document coverage for recurring customer issues.",
                    knowledge_gap_id=gap_types[GapType.REPEATED_FAILURES].id
                )
                if rec: new_or_updated.append(rec)
            else:
                await self._auto_resolve(db, doc_id, RecommendationType.CONTENT_EXPANSION)

            # Rule 4: Chunk appears in Top Problematic Chunks -> Generate CHUNK_REVIEW
            problematic_chunks = impact_analytics.get("problematic_chunks", [])
            is_problematic = any(str(c["document_id"]) == str(doc_id) for c in problematic_chunks)
            if is_problematic:
                rec = await self._create_or_update(
                    db,
                    doc_id,
                    RecommendationType.CHUNK_REVIEW,
                    "MEDIUM",
                    "Review Problematic Chunks",
                    "Review chunk with repeated failures."
                )
                if rec: new_or_updated.append(rec)
            else:
                await self._auto_resolve(db, doc_id, RecommendationType.CHUNK_REVIEW)

        return new_or_updated

    async def _create_or_update(
        self,
        db: AsyncSession,
        document_id: str | uuid.UUID,
        rec_type: RecommendationType,
        severity: str,
        title: str,
        description: str,
        knowledge_gap_id: str | uuid.UUID | None = None
    ) -> ImprovementRecommendation | None:
        
        stmt = select(ImprovementRecommendation).where(
            ImprovementRecommendation.document_id == document_id,
            ImprovementRecommendation.recommendation_type == rec_type,
            ImprovementRecommendation.status.in_([RecommendationStatus.OPEN, RecommendationStatus.IN_PROGRESS])
        )
        existing = (await db.execute(stmt)).scalars().first()

        if existing:
            # Update existing if needed, but it already exists. For duplicate prevention, just return None or existing.
            # We will just return None so it doesn't pollute the "newly generated" list, or we could return existing to signify "it's tracked".
            return existing

        new_rec = ImprovementRecommendation(
            document_id=document_id,
            recommendation_type=rec_type,
            severity=severity,
            title=title,
            description=description,
            knowledge_gap_id=knowledge_gap_id
        )
        db.add(new_rec)
        await db.commit()
        await db.refresh(new_rec)

        if severity == "CRITICAL":
            from app.services.knowledge_review_service import KnowledgeReviewService
            knowledge_review_service = KnowledgeReviewService()
            await knowledge_review_service.create_task(
                db=db,
                recommendation_id=new_rec.id,
                document_id=new_rec.document_id,
                notes="Auto-generated task from critical recommendation."
            )

        return new_rec

    async def _auto_resolve(
        self,
        db: AsyncSession,
        document_id: str | uuid.UUID,
        rec_type: RecommendationType
    ):
        stmt = select(ImprovementRecommendation).where(
            ImprovementRecommendation.document_id == document_id,
            ImprovementRecommendation.recommendation_type == rec_type,
            ImprovementRecommendation.status.in_([RecommendationStatus.OPEN, RecommendationStatus.IN_PROGRESS])
        )
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            existing.status = RecommendationStatus.COMPLETED
            existing.resolved_at = datetime.now(timezone.utc)
            db.add(existing)
            await db.commit()

recommendation_service = RecommendationService()
