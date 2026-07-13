from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.api import deps
from app.models.user import User
from app.schemas.document import UploadResponse, SearchResponse
from app.services.ingestion import IngestionService
from app.services.search import SearchService

router = APIRouter()


from app.core.logger import logger
import json
from fastapi import Request

@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.require_role("admin")),
    ingestion_service: IngestionService = Depends(deps.get_ingestion_service),
) -> Any:
    from fastapi import HTTPException
    from app.core.exceptions import UnsupportedDocumentTypeError
    from app.core.upload_validation import validate_upload, sanitize_filename

    content = await file.read()
    req_id = getattr(request.state, "request_id", "unknown")
    user_id_str = str(current_user.id)
    try:
        # 1. Validate file
        validate_upload(file, content)
        
        # 2. Sanitize filename
        safe_filename = sanitize_filename(file.filename or "unknown")
        
        res = await ingestion_service.process_file(
            content=content,
            filename=safe_filename,
            content_type=file.content_type or "application/octet-stream",
            user_id=user_id_str,
        )
        logger.info(json.dumps({
            "event": "document_uploaded",
            "document_id": str(res.document_id),
            "filename": safe_filename,
            "user_id": user_id_str,
            "request_id": req_id
        }))
        return res
    except UnsupportedDocumentTypeError as e:
        logger.warning(json.dumps({
            "event": "upload_failed",
            "reason": "unsupported_type",
            "filename": file.filename,
            "user_id": user_id_str,
            "request_id": req_id
        }))
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        logger.warning(json.dumps({
            "event": "upload_failed",
            "reason": "validation_error",
            "filename": file.filename,
            "user_id": user_id_str,
            "request_id": req_id
        }))
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(json.dumps({
            "event": "upload_failed",
            "reason": "internal_error",
            "filename": file.filename,
            "user_id": user_id_str,
            "request_id": req_id,
            "error": str(e)
        }))
        raise HTTPException(status_code=500, detail="Internal server error during upload")


@router.get("/search", response_model=SearchResponse)
async def search_documents(
    q: str = Query(..., min_length=3),
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(deps.get_current_active_user),
    search_service: SearchService = Depends(deps.get_search_service),
) -> Any:
    from app.schemas.document import SearchResult, ChunkMetadata
    
    hybrid_results = await search_service.search(query=q, limit=limit)
    
    results = []
    for point in hybrid_results.points:
        payload = point.payload
        text = payload.pop("text", "")
        # Remove empty metadata fields
        metadata = ChunkMetadata(**payload)
        results.append(SearchResult(text=text, score=point.score, metadata=metadata))
        
    return SearchResponse(query=q, results=results)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    request: Request,
    document_id: str,
    current_user: User = Depends(deps.require_role("admin")),
    document_repo = Depends(deps.get_document_repo),
    db = Depends(deps.get_db)
) -> None:
    from fastapi import HTTPException
    from sqlalchemy import select, delete
    from app.models.document import Document
    import uuid
    
    req_id = getattr(request.state, "request_id", "unknown")
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")

    # Verify document exists and belongs to user (or user is Admin)
    stmt = select(Document).where(Document.id == doc_uuid)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    user_id_str = str(current_user.id)
    if doc.user_id != current_user.id and current_user.role.lower() != "admin":
        logger.warning(json.dumps({
            "event": "delete_document_failed",
            "reason": "forbidden",
            "document_id": document_id,
            "user_id": user_id_str,
            "request_id": req_id
        }))
        raise HTTPException(status_code=403, detail="Forbidden")

    # 1. Delete from Qdrant
    await document_repo.delete_document(document_id=document_id)

    # 2. Delete from SQLite
    del_stmt = delete(Document).where(Document.id == doc_uuid)
    await db.execute(del_stmt)
    await db.commit()
    
    logger.info(json.dumps({
        "event": "document_deleted",
        "document_id": document_id,
        "user_id": user_id_str,
        "request_id": req_id
    }))
    
    return None
