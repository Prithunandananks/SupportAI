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
    current_user: User = Depends(deps.get_current_active_user),
    ingestion_service: IngestionService = Depends(deps.get_ingestion_service),
) -> Any:
    from fastapi import HTTPException
    from app.core.exceptions import UnsupportedDocumentTypeError
    from app.core.upload_validation import validate_upload, sanitize_filename

    content = await file.read()
    try:
        # 1. Validate file
        validate_upload(file, content)
        
        # 2. Sanitize filename
        safe_filename = sanitize_filename(file.filename or "unknown")
        
        return await ingestion_service.process_file(
            content=content,
            filename=safe_filename,
            content_type=file.content_type or "application/octet-stream",
            user_id=str(current_user.id),
        )
    except UnsupportedDocumentTypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search", response_model=SearchResponse)
async def search_documents(
    q: str = Query(..., min_length=3),
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(deps.get_current_active_user),
    search_service: SearchService = Depends(deps.get_search_service),
) -> Any:
    results = await search_service.semantic_search(query=q, limit=limit)
    return SearchResponse(query=q, results=results)
