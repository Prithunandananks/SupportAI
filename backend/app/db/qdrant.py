from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
from app.core.config import settings
from app.core.logger import logger


class QdrantDatabase:
    def __init__(self):
        if settings.QDRANT_URL == ":memory:":
            self.client = AsyncQdrantClient(location=":memory:")
        else:
            self.client = AsyncQdrantClient(url=settings.QDRANT_URL)
        self.collection_name = settings.QDRANT_COLLECTION_NAME

    async def initialize_collection(self, dimension: int):
        """Ensure the collection exists with the appropriate dimension from the embedding provider."""
        collections = await self.client.get_collections()
        exists = any(c.name == self.collection_name for c in collections.collections)

        if not exists:
            logger.info(
                f"Creating Qdrant collection: {self.collection_name} with dimension: {dimension}"
            )
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=rest.VectorParams(
                    size=dimension, distance=rest.Distance.COSINE
                ),
            )

            # Create payload indexes for fast filtering
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="document_id",
                field_schema=rest.PayloadSchemaType.KEYWORD,
            )
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="uploaded_by",
                field_schema=rest.PayloadSchemaType.KEYWORD,
            )
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="tenant_id",
                field_schema=rest.PayloadSchemaType.KEYWORD,
            )
        else:
            logger.info(f"Qdrant collection '{self.collection_name}' already exists.")


qdrant_db = QdrantDatabase()
