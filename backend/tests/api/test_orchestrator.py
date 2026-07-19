import pytest
import uuid
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.chat.orchestrator import ChatOrchestrator
from app.services.retrieval.rag_pipeline import RAGPipeline
from fastapi import HTTPException

@pytest.fixture
def mock_rag_pipeline():
    return AsyncMock(spec=RAGPipeline)

@pytest.fixture
def mock_chat_repo():
    return AsyncMock()

@pytest.fixture
def orchestrator(mock_rag_pipeline, mock_chat_repo):
    return ChatOrchestrator(rag_pipeline=mock_rag_pipeline, chat_repo=mock_chat_repo)

@pytest.mark.asyncio
async def test_process_message_success(orchestrator, mock_rag_pipeline, mock_chat_repo):
    session_id = uuid.uuid4()
    mock_rag_pipeline.run.return_value = ("Test answer", [], [])
    
    mock_chat_repo.session = AsyncMock()
    mock_chat_repo.append_exchange.return_value = (uuid.uuid4(), uuid.uuid4())
    
    with patch("app.services.chat.orchestrator.MessageSourceRepository") as mock_source_repo:
        mock_source_repo_instance = mock_source_repo.return_value
        mock_source_repo_instance.create_sources_bulk = AsyncMock()
        
        answer, sources = await orchestrator.process_message("Test message", session_id)
        
        assert answer == "Test answer"
        assert sources == []
        mock_rag_pipeline.run.assert_called_once_with(question="Test message", session_id=session_id)
        mock_chat_repo.append_exchange.assert_called_once()
        mock_source_repo_instance.create_sources_bulk.assert_called_once()

@pytest.mark.asyncio
async def test_process_message_error(orchestrator, mock_rag_pipeline):
    mock_rag_pipeline.run.side_effect = Exception("Unknown")
    
    with pytest.raises(HTTPException) as exc:
        await orchestrator.process_message("Test message")
        
    assert exc.value.status_code == 500

@pytest.mark.asyncio
async def test_process_message_stream_error(orchestrator, mock_rag_pipeline):
    mock_rag_pipeline.run_stream.side_effect = Exception("Unknown")
    
    with pytest.raises(HTTPException) as exc:
        async for _ in orchestrator.process_message_stream("Test message"):
            pass
            
    assert exc.value.status_code == 500
