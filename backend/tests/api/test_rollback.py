import pytest
from httpx import AsyncClient
from qdrant_client.http import models

from app.core.config import settings
from app.db.qdrant import qdrant_db

@pytest.mark.asyncio
async def test_upload_rollback_on_db_failure(client: AsyncClient, admin_token: str, db_session):
    from app.main import app
    from app.api.deps import get_db
    
    # We will upload a file and expect it to fail and rollback
    # We override get_db to yield a session that raises an error on commit
    async def override_get_db_failure():
        original_commit = db_session.commit
        async def mock_commit(*args, **kwargs):
            raise Exception("Forced DB failure for testing rollback")
        
        db_session.commit = mock_commit
        try:
            yield db_session
        finally:
            db_session.commit = original_commit
            
    app.dependency_overrides[get_db] = override_get_db_failure
    
    try:
        # Upload a file
        files = {
            "file": ("test_rollback.txt", b"This is a test document for rollback.", "text/plain")
        }
        
        response = await client.post(
            "/api/v1/documents/upload",
            files=files,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 500
        
        # Verify Qdrant deletion was triggered as rollback
        assert qdrant_db.client.delete.called, "Qdrant delete should have been called during rollback"
    finally:
        app.dependency_overrides.pop(get_db, None)

