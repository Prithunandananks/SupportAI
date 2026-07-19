import uuid
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from app.models.message_source import MessageSource

class MessageSourceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_sources_bulk(self, chat_message_id: uuid.UUID, attribution_data: List[Dict[str, Any]]):
        """
        Efficiently inserts attribution records for a chat message.
        `attribution_data` should be a list of dicts with:
        - document_id (uuid)
        - chunk_index (int)
        - retrieval_score (float)
        - rank (int)
        """
        if not attribution_data:
            return

        values = []
        for item in attribution_data:
            try:
                values.append({
                    "id": uuid.uuid4(),
                    "chat_message_id": chat_message_id,
                    "document_id": uuid.UUID(item["document_id"]) if isinstance(item["document_id"], str) else item["document_id"],
                    "chunk_index": item["chunk_index"],
                    "retrieval_score": item["retrieval_score"],
                    "rank": item["rank"]
                })
            except Exception:
                # If document_id is missing or invalid ("unknown"), skip to avoid DB FK error
                continue

        if not values:
            return

        stmt = insert(MessageSource).values(values).on_conflict_do_nothing()
        await self.session.execute(stmt)
        await self.session.commit()

    async def delete_sources_for_message(self, chat_message_id: uuid.UUID):
        from sqlalchemy import delete
        stmt = delete(MessageSource).where(MessageSource.chat_message_id == chat_message_id)
        await self.session.execute(stmt)
        await self.session.commit()
