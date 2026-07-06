import hashlib
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.schemas.document import TextChunk, ChunkMetadata, UploadResponse
from app.services.extraction import ExtractionService
from app.services.chunking import ChunkingService
from app.services.embedding import EmbeddingService
from app.repositories.document_repo import DocumentRepository


class IngestionService:
    def __init__(
        self,
        extraction: ExtractionService,
        chunking: ChunkingService,
        embedding: EmbeddingService,
        repo: DocumentRepository,
    ):
        self.extraction = extraction
        self.chunking = chunking
        self.embedding = embedding
        self.repo = repo

    async def process_file(
        self,
        content: bytes,
        filename: str,
        content_type: str,
        user_id: str,
        tenant_id: Optional[str] = None,
    ) -> UploadResponse:

        # 0. Generate checksum and calculate size
        checksum = hashlib.sha256(content).hexdigest()
        file_size = len(content)

        # 1. Extract text
        raw_text = self.extraction.extract_text(content, content_type)

        # 2. Chunk text
        text_chunks = self.chunking.chunk_text(raw_text)

        if not text_chunks:
            return UploadResponse(
                document_id="",
                filename=filename,
                total_chunks=0,
                message="No text extracted",
            )

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
        vectors = await self.embedding.embed_documents([c.text for c in chunks])

        # 4. Upsert to Repository
        await self.repo.upsert_chunks(vectors, chunks)
        
        # 5. Synchronize BM25 Index
        from app.services.retrieval.bm25_service import bm25_service
        bm25_service.add_chunks(chunks)

        return UploadResponse(
            document_id=document_id,
            filename=filename,
            total_chunks=len(chunks),
            message="Document successfully processed and indexed.",
        )
