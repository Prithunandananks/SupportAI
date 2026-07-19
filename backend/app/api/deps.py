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
    db: AsyncSession = Depends(get_db),
) -> IngestionService:
    return IngestionService(
        extraction=_extraction_service,
        chunking=_chunking_service,
        embedding=_embedding_service,
        repo=repo,
        db=db,
    )


def get_search_service(
    repo: DocumentRepository = Depends(get_document_repo),
) -> SearchService:
    return SearchService(embedding=_embedding_service, repo=repo)


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise credentials_exception

    if token_data.type != "access":
        raise credentials_exception

    import uuid
    from app.db.session import tenant_id_var
    if getattr(token_data, "tenant_id", None):
        tenant_id_var.set(uuid.UUID(token_data.tenant_id))
        
    user = await user_repo.get(db, id=uuid.UUID(token_data.sub))
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_membership(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from app.db.session import tenant_id_var
    from app.repositories.tenant_membership_repo import tenant_membership_repo
    from app.models.tenant_membership import MembershipStatus

    tenant_id = tenant_id_var.get(None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenant context in current session"
        )
        
    membership = await tenant_membership_repo.get_by_user_and_tenant(db, current_user.id, tenant_id)
    
    if not membership or membership.status != MembershipStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an active member of this organization"
        )
        
    return membership


def require_role(role: str):
    async def role_dependency(
        membership = Depends(get_current_membership),
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        allowed = [role.lower()]
        if role.lower() == "admin":
            allowed.append("owner")
            
        if membership.role.value.lower() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {role} role",
            )
        return current_user

    return role_dependency

def require_permission(permission):
    async def permission_dependency(
        membership = Depends(get_current_membership),
        current_user: User = Depends(get_current_active_user)
    ):
        from app.core.rbac import has_permission, Permission
        # ensure permission is enum
        perm = permission if isinstance(permission, Permission) else Permission(permission)
        
        if not has_permission(membership.role, perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {perm.value} permission",
            )
        return membership

    return permission_dependency
