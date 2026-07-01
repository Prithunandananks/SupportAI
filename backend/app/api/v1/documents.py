from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.api import deps
from app.models.user import User
from app.schemas.document import UploadResponse, SearchResponse
from app.services.ingestion import IngestionService
from app.services.search import SearchService

router = APIRouter()


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(
        deps.require_role("Admin")
    ),  # Example: only Admin can upload
    ingestion_service: IngestionService = Depends(deps.get_ingestion_service),
) -> Any:
    content = await file.read()
    return await ingestion_service.process_file(
        content=content,
        filename=file.filename or "unknown",
        content_type=file.content_type or "application/octet-stream",
        user_id=str(current_user.id),
    )


@router.get("/search", response_model=SearchResponse)
async def search_documents(
    q: str = Query(..., min_length=3),
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(deps.get_current_active_user),
    search_service: SearchService = Depends(deps.get_search_service),
) -> Any:
    results = await search_service.semantic_search(query=q, limit=limit)
    return SearchResponse(query=q, results=results)
