import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
import asyncio

# Overwrite config for testing
from app.core.config import settings
settings.DATABASE_URL = "sqlite+aiosqlite:///:memory:"
settings.REDIS_URL = "redis://localhost:6379/15" # won't be connected in mocked tests

from app.core.security import pwd_context  # noqa: E402
pwd_context.update(bcrypt__rounds=4)

# Patch EmbeddingProviderFactory before importing app to avoid HuggingFace model download
mock_embed_provider = MagicMock()
mock_embed_provider.dimension = 384
mock_embed_provider_factory = patch("app.services.embedding.EmbeddingProviderFactory.create", return_value=mock_embed_provider)
mock_embed_provider_factory.start()

# Patch QdrantClient before import to avoid local memory deadlocks on Windows
qdrant_patcher = patch("qdrant_client.AsyncQdrantClient", return_value=AsyncMock())
qdrant_patcher.start()

from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.api.deps import get_db  # noqa: E402
from app.models import user, chat, document  # noqa: E402, F401

@pytest.fixture(autouse=True)
async def db_session() -> AsyncGenerator:
    # Setup test DB
    engine = create_async_engine(
        settings.DATABASE_URL, 
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    async def override_get_db():
        async with TestingSessionLocal() as session:
            yield session
            
    app.dependency_overrides[get_db] = override_get_db
    
    async with TestingSessionLocal() as session:
        yield session
        
    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

@pytest.fixture
async def user_token(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "docuser@example.com",
        "password": "Password123!",
        "first_name": "Doc",
        "last_name": "User"
    })
    login_res = await client.post("/api/v1/auth/login", data={
        "username": "docuser@example.com",
        "password": "Password123!"
    })
    return login_res.json()["access_token"]

async def _mock_stream():
    words = ["This", " is", " a", " mocked", " response."]
    for word in words:
        yield {"chunk": word}
        await asyncio.sleep(0.01)

@pytest.fixture(autouse=True)
def mock_external_services():
    with patch("app.api.deps.get_qdrant_client") as mock_qdrant, \
         patch("app.services.embedding.EmbeddingService.embed_text") as mock_embed_text, \
         patch("app.services.embedding.EmbeddingService.embed_documents") as mock_embed_docs, \
         patch("app.services.llm.llm_factory.LLMFactory.get_llm") as mock_llm, \
         patch("app.services.ingestion.IngestionService.process_file", new_callable=AsyncMock) as mock_process_file:
         
        # Mock Qdrant
        qdrant_instance = AsyncMock()
        qdrant_instance.search.return_value = [
            MagicMock(id="doc1", score=0.9, payload={"text": "Mock document context", "metadata": {}})
        ]
        mock_qdrant.return_value = qdrant_instance
        
        # Mock Embeddings
        mock_embed_text.return_value = [0.1] * 384
        mock_embed_docs.return_value = [[0.1] * 384]
        
        # Mock LLM
        llm_instance = AsyncMock()
        llm_instance.generate_stream.return_value = _mock_stream()
        llm_instance.generate.return_value = "This is a mocked response."
        mock_llm.return_value = llm_instance
        
        # Mock IngestionService.process_file
        from app.schemas.document import UploadResponse
        mock_process_file.return_value = UploadResponse(
            document_id="doc-123",
            filename="test.txt",
            total_chunks=1,
            message="Document processing started"
        )
        
        yield
