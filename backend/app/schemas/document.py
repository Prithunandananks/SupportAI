from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ChunkMetadata(BaseModel):
    document_id: str
    filename: str
    page_number: Optional[int] = None
    chunk_index: int
    uploaded_by: str
    uploaded_at: datetime
    embedding_provider: str
    embedding_model: str
    tenant_id: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    checksum: Optional[str] = None
    language: Optional[str] = None
    version: Optional[str] = None


class TextChunk(BaseModel):
    text: str
    metadata: ChunkMetadata


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    total_chunks: int
    message: str


class SearchResult(BaseModel):
    text: str
    score: float
    metadata: ChunkMetadata


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
