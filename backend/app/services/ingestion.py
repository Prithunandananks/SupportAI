import hashlib
import logging
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.schemas.document import TextChunk, ChunkMetadata, UploadResponse
from app.services.extraction import ExtractionService
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService
from app.repositories.document_repo import DocumentRepository

logger = logging.getLogger(__name__)

from sqlalchemy.ext.asyncio import AsyncSession

class IngestionService:
    def __init__(
        self,
        extraction: ExtractionService,
        chunking: ChunkingService,
        embedding: EmbeddingService,
        repo: DocumentRepository,
        db: AsyncSession,
    ):
        self.extraction = extraction
        self.chunking = chunking
        self.embedding = embedding
        self.repo = repo
        self.db = db

    async def process_file(
        self,
        content: bytes,
        filename: str,
        content_type: str,
        user_id: str,
        tenant_id: Optional[str] = None,
    ) -> UploadResponse:
        logger.info("Upload started for file: %s by user: %s", filename, user_id)

        # 0. Generate checksum and calculate size
        checksum = hashlib.sha256(content).hexdigest()
        file_size = len(content)

        # 1. Extract text
        raw_text = self.extraction.extract_text(content, content_type, filename)

        # 2. Chunk text
        text_chunks = self.chunking.chunk_text(raw_text)
        
        if not text_chunks:
            logger.warning("No text extracted from file: %s", filename)
            return UploadResponse(
                document_id="",
                filename=filename,
                total_chunks=0,
                message="No text extracted",
            )

        logger.info("Chunking completed. Generated %d chunks for file: %s", len(text_chunks), filename)

        document_id = str(uuid.uuid4())
        uploaded_at = datetime.now(timezone.utc)

        chunks = []
        for i, text in enumerate(text_chunks):
            metadata = ChunkMetadata(
                document_id=document_id,
                filename=filename,
                chunk_index=i,
                uploaded_by=user_id,
                uploaded_at=uploaded_at,
                embedding_provider=self.embedding.provider.provider_name,
                embedding_model=self.embedding.provider.model_name,
                tenant_id=tenant_id,
                mime_type=content_type,
                file_size=file_size,
                checksum=checksum,
                language="en",  # Default language for now
                version="1.0",  # Default version
            )
            chunks.append(TextChunk(text=text, metadata=metadata))

        # 3. Generate Embeddings
        logger.info("Generating embeddings for %d chunks from file: %s", len(chunks), filename)
        vectors = await self.embedding.embed_documents([c.text for c in chunks])

        # 4. Upsert to Repository
        logger.info("Inserting %d vectors into Qdrant for file: %s", len(chunks), filename)
        await self.repo.upsert_chunks(vectors, chunks)
        
        # 5. Synchronize BM25 Index
        from app.services.retrieval.bm25_service import bm25_service
        bm25_service.add_chunks(chunks)

        # 6. Insert Document metadata into SQLite
        # ONLY AFTER successful Qdrant indexing
        from app.models.document import Document
        
        logger.info("Inserting SQLite Document record for %s", filename)
        
        try:
            doc = Document(
                id=uuid.UUID(document_id),
                filename=filename,
                user_id=uuid.UUID(user_id),
                file_size=file_size,
                content_type=content_type,
                created_at=uploaded_at
            )
            self.db.add(doc)
            await self.db.commit()
        except Exception as e:
            logger.error("Failed to insert Document metadata into SQLite for %s: %s", filename, str(e))
            logger.info("Rolling back: deleting vectors for document %s from Qdrant", document_id)
            try:
                await self.repo.delete_document(document_id)
            except Exception as rollback_e:
                logger.error("Failed to rollback Qdrant vectors for %s: %s", document_id, str(rollback_e))
            raise RuntimeError(f"Failed to persist document metadata: {str(e)}")

        logger.info("Upload completed successfully for file: %s", filename)

        return UploadResponse(
            document_id=document_id,
            filename=filename,
            total_chunks=len(chunks),
            message="Document successfully processed and indexed.",
        )
