import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.retrieval.rag_pipeline import RAGPipeline
from app.schemas.chat import SourceCitation
import uuid

@pytest.fixture
def mock_search_service():
    service = AsyncMock()
    return service

@pytest.fixture
def mock_memory_provider():
    provider = AsyncMock()
    return provider

@pytest.fixture
def mock_llm():
    with patch("app.services.retrieval.rag_pipeline.LLMFactory.get_llm") as mock:
        llm = AsyncMock()
        mock.return_value = llm
        yield llm

@pytest.fixture
def mock_query_rewriter():
    with patch("app.services.retrieval.rag_pipeline.QueryRewriter") as mock_cls:
        mock = AsyncMock()
        mock_cls.return_value = mock
        yield mock

@pytest.mark.asyncio
async def test_rag_pipeline_run_no_contexts(mock_search_service, mock_memory_provider, mock_query_rewriter, mock_llm):
    mock_query_rewriter.rewrite_and_generate_queries.return_value = ["test query"]
    
    # Empty search results
    mock_search_results = MagicMock()
    mock_search_results.points = []
    mock_search_service.search.return_value = mock_search_results
    
    pipeline = RAGPipeline(search_service=mock_search_service, memory_provider=mock_memory_provider)
    answer, sources, attribution = await pipeline.run("test question")
    
    assert "couldn't find relevant information" in answer
    assert sources == []
    assert attribution == []

@pytest.mark.asyncio
async def test_rag_pipeline_run_with_contexts(mock_search_service, mock_memory_provider, mock_query_rewriter, mock_llm):
    mock_query_rewriter.rewrite_and_generate_queries.return_value = ["test query"]
    
    mock_point = MagicMock()
    mock_point.payload = {
        "text": "Context text",
        "document_id": "doc123",
        "chunk_index": 0,
        "filename": "test.txt"
    }
    mock_point.score = 0.95
    
    mock_search_results = MagicMock()
    mock_search_results.points = [mock_point]
    mock_search_service.search.return_value = mock_search_results
    
    mock_llm.generate.return_value = "Generated answer"
    
    pipeline = RAGPipeline(search_service=mock_search_service, memory_provider=mock_memory_provider)
    answer, sources, attribution = await pipeline.run("test question", session_id=uuid.uuid4())
    
    assert answer == "Generated answer"
    assert len(sources) == 1
    assert sources[0].filename == "test.txt"
    assert sources[0].retrieval_score == 0.95
    assert len(attribution) == 1

@pytest.mark.asyncio
async def test_rag_pipeline_stream_no_contexts(mock_search_service, mock_memory_provider, mock_query_rewriter, mock_llm):
    mock_query_rewriter.rewrite_and_generate_queries.return_value = ["test query"]
    
    mock_search_results = MagicMock()
    mock_search_results.points = []
    mock_search_service.search.return_value = mock_search_results
    
    pipeline = RAGPipeline(search_service=mock_search_service, memory_provider=mock_memory_provider)
    
    chunks = []
    async for chunk in pipeline.run_stream("test question"):
        chunks.append(chunk)
        
    assert len(chunks) == 1
    assert "couldn't find relevant information" in chunks[0]["content"]

@pytest.mark.asyncio
async def test_rag_pipeline_stream_with_contexts(mock_search_service, mock_memory_provider, mock_query_rewriter, mock_llm):
    mock_query_rewriter.rewrite_and_generate_queries.return_value = ["test query"]
    
    mock_point = MagicMock()
    mock_point.payload = {
        "text": "Context text",
        "document_id": "doc123",
        "chunk_index": 0,
        "filename": "test.txt"
    }
    mock_point.score = 0.95
    
    mock_search_results = MagicMock()
    mock_search_results.points = [mock_point]
    mock_search_service.search.return_value = mock_search_results
    
    async def mock_generate_stream(*args, **kwargs):
        for chunk in ["Chunk 1", " Chunk 2"]:
            yield chunk
            
    mock_llm.generate_stream = mock_generate_stream
    
    pipeline = RAGPipeline(search_service=mock_search_service, memory_provider=mock_memory_provider)
    
    chunks = []
    async for chunk in pipeline.run_stream("test question", session_id=uuid.uuid4()):
        chunks.append(chunk)
        
    assert len(chunks) == 3 # 2 text chunks + 1 metadata chunk
    assert chunks[0]["content"] == "Chunk 1"
    assert chunks[1]["content"] == " Chunk 2"
    assert "sources" in chunks[2]
