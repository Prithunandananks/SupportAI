from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.schemas.token import TokenPayload
from app.repositories.user_repo import user_repo

from app.db.qdrant import qdrant_db
from app.repositories.document_repo import DocumentRepository
from app.services.embedding import EmbeddingProviderFactory, EmbeddingService
from app.services.extraction import ExtractionService
from app.services.chunking import ChunkingService
from app.services.ingestion import IngestionService
from app.services.search import SearchService

# --- Database & Auth Dependencies ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def get_qdrant_client():
    return qdrant_db.client


def get_document_repo(client=Depends(get_qdrant_client)) -> DocumentRepository:
    return DocumentRepository(
        client=client, collection_name=settings.QDRANT_COLLECTION_NAME
    )


# --- Service Dependencies ---
# Singletons for stateless services
_embedding_provider = EmbeddingProviderFactory.create(
    provider_name=settings.EMBEDDING_PROVIDER, model_name=settings.EMBEDDING_MODEL
)
_embedding_service = EmbeddingService(provider=_embedding_provider)
_extraction_service = ExtractionService()
_chunking_service = ChunkingService(
    chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP
)


def get_ingestion_service(
    repo: DocumentRepository = Depends(get_document_repo),
) -> IngestionService:
    return IngestionService(
        extraction=_extraction_service,
        chunking=_chunking_service,
        embedding=_embedding_service,
        repo=repo,
    )


def get_search_service(
    repo: DocumentRepository = Depends(get_document_repo),
) -> SearchService:
    return SearchService(embedding=_embedding_service, repo=repo)


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token type",
        )

    user = await user_repo.get(db, id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_role(role: str):
    async def role_dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {role} role",
            )
        return current_user

    return role_dependency
