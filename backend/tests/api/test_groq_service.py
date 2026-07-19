import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.llm.groq_service import GroqService
import groq

@pytest.fixture
def mock_groq():
    with patch("app.services.llm.groq_service.AsyncGroq") as mock:
        yield mock

@pytest.mark.asyncio
async def test_groq_generate_success(mock_groq):
    mock_instance = mock_groq.return_value
    
    mock_choice = MagicMock()
    mock_choice.message.content = "Test response"
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    
    mock_instance.chat.completions.create = AsyncMock(return_value=mock_response)
    
    service = GroqService()
    result = await service.generate("Hello")
    assert result == "Test response"

@pytest.mark.asyncio
async def test_groq_generate_timeout(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=groq.APITimeoutError(request=MagicMock()))
    
    service = GroqService()
    with pytest.raises(TimeoutError, match="Request to Groq API timed out"):
        await service.generate("Hello")

@pytest.mark.asyncio
async def test_groq_generate_auth_error(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=groq.AuthenticationError("err", response=MagicMock(), body=None))
    
    service = GroqService()
    with pytest.raises(ValueError, match="Invalid Groq API key"):
        await service.generate("Hello")

@pytest.mark.asyncio
async def test_groq_generate_rate_limit(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=groq.RateLimitError("err", response=MagicMock(), body=None))
    
    service = GroqService()
    with pytest.raises(RuntimeError, match="Groq API rate limit exceeded"):
        await service.generate("Hello")

@pytest.mark.asyncio
async def test_groq_generate_internal_error(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=groq.InternalServerError("err", response=MagicMock(), body=None))
    
    service = GroqService()
    with pytest.raises(RuntimeError, match="Groq encountered an internal server error"):
        await service.generate("Hello")

@pytest.mark.asyncio
async def test_groq_generate_api_error(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=groq.APIError("err", request=MagicMock(), body={}))
    
    service = GroqService()
    with pytest.raises(RuntimeError, match="Groq API returned an error"):
        await service.generate("Hello")

@pytest.mark.asyncio
async def test_groq_generate_generic_error(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=Exception("unknown"))
    
    service = GroqService()
    with pytest.raises(RuntimeError, match="Unexpected error"):
        await service.generate("Hello")

@pytest.mark.asyncio
async def test_groq_generate_stream(mock_groq):
    mock_instance = mock_groq.return_value
    
    class AsyncIteratorMock:
        def __init__(self, items):
            self.items = items
            
        def __aiter__(self):
            return self
            
        async def __anext__(self):
            if not self.items:
                raise StopAsyncIteration
            return self.items.pop(0)

    mock_chunk1 = MagicMock()
    mock_chunk1.choices = [MagicMock()]
    mock_chunk1.choices[0].delta.content = "Part 1 "
    
    mock_chunk2 = MagicMock()
    mock_chunk2.choices = [MagicMock()]
    mock_chunk2.choices[0].delta.content = "Part 2"
    
    mock_instance.chat.completions.create = AsyncMock(return_value=AsyncIteratorMock([mock_chunk1, mock_chunk2]))
    
    service = GroqService()
    chunks = []
    async for chunk in service.generate_stream("Hello"):
        chunks.append(chunk)
        
    assert chunks == ["Part 1 ", "Part 2"]

@pytest.mark.asyncio
async def test_groq_generate_stream_error(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.chat.completions.create = AsyncMock(side_effect=Exception("unknown"))
    
    service = GroqService()
    with pytest.raises(RuntimeError, match="Unexpected streaming error"):
        async for _ in service.generate_stream("Hello"):
            pass

@pytest.mark.asyncio
async def test_groq_health_check_success(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.models.retrieve = AsyncMock()
    
    service = GroqService()
    is_healthy = await service.health_check()
    assert is_healthy is True

@pytest.mark.asyncio
async def test_groq_health_check_failure(mock_groq):
    mock_instance = mock_groq.return_value
    mock_instance.models.retrieve = AsyncMock(side_effect=Exception("unknown"))
    
    service = GroqService()
    is_healthy = await service.health_check()
    assert is_healthy is False
