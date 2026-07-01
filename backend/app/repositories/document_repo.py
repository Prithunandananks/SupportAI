from typing import List, Optional
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
import uuid

from app.schemas.document import TextChunk, SearchResult, ChunkMetadata


class DocumentRepository:
    def __init__(self, client: AsyncQdrantClient, collection_name: str):
        self.client = client
        self.collection_name = collection_name

    async def upsert_chunks(self, vectors: List[List[float]], chunks: List[TextChunk]):
        points = []
        for vector, chunk in zip(vectors, chunks):
            point_id = str(uuid.uuid4())
            points.append(
                rest.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={"text": chunk.text, **chunk.metadata.model_dump()},
                )
            )

        await self.client.upsert(collection_name=self.collection_name, points=points)

    async def search_similar(
        self, query_vector: List[float], limit: int = 5, user_id: Optional[str] = None
    ) -> List[SearchResult]:
        query_filter = None
        if user_id:
            query_filter = rest.Filter(
                must=[
                    rest.FieldCondition(
                        key="uploaded_by", match=rest.MatchValue(value=user_id)
                    )
                ]
            )

        search_result = await self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )

        results = []
        for scored_point in search_result.points:
            payload = scored_point.payload
            text = payload.pop("text", "")
            metadata = ChunkMetadata(**payload)
            results.append(
                SearchResult(text=text, score=scored_point.score, metadata=metadata)
            )

        return results

    async def delete_document(self, document_id: str):
        await self.client.delete(
            collection_name=self.collection_name,
            points_selector=rest.FilterSelector(
                filter=rest.Filter(
                    must=[
                        rest.FieldCondition(
                            key="document_id", match=rest.MatchValue(value=document_id)
                        )
                    ]
                )
            ),
        )
