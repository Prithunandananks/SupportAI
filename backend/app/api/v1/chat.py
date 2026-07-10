from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
import asyncio
import uuid

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat.orchestrator import ChatOrchestrator
from app.services.retrieval.rag_pipeline import RAGPipeline
from app.api import deps
from app.services.search import SearchService
from app.repositories.chat_repo import ChatRepository
from app.services.chat.memory_provider import WindowedMemoryProvider
from app.core.config import settings
from app.schemas.chat_session import (
    ChatSessionCreate, 
    ChatSessionResponse, 
    ChatSessionWithMessagesResponse, 
    ChatSessionUpdate
)
from app.models.user import User

router = APIRouter()

async def get_chat_repo(db: AsyncSession = Depends(deps.get_db)) -> ChatRepository:
    return ChatRepository(session=db)

def get_rag_pipeline(
    search_service: SearchService = Depends(deps.get_search_service),
    chat_repo: ChatRepository = Depends(get_chat_repo),
) -> RAGPipeline:
    memory_provider = WindowedMemoryProvider(chat_repo=chat_repo, max_messages=settings.MAX_HISTORY_MESSAGES)
    return RAGPipeline(search_service=search_service, memory_provider=memory_provider)

def get_chat_orchestrator(
    rag_pipeline: RAGPipeline = Depends(get_rag_pipeline),
    chat_repo: ChatRepository = Depends(get_chat_repo),
) -> ChatOrchestrator:
    return ChatOrchestrator(rag_pipeline=rag_pipeline, chat_repo=chat_repo)



@router.post("", response_model=ChatResponse, summary="Send a message to the AI assistant")
async def chat_endpoint(
    request: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
):
    """
    Process a chat message using the existing RAG pipeline and return the generated answer and citations.
    """
    answer, sources = await orchestrator.process_message(request.message)
    return ChatResponse(answer=answer, sources=sources)

@router.post("/stream", summary="Send a message to the AI assistant and stream the response")
async def chat_stream_endpoint(
    request: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
):
    """
    Process a chat message using the existing RAG pipeline and stream the generated answer.
    """
    async def event_generator():
        try:
            async for chunk in orchestrator.process_message_stream(request.message):
                # Format as Server-Sent Events
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except asyncio.CancelledError:
            pass
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/session", response_model=ChatSessionResponse, summary="Create a new chat session", status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    request: ChatSessionCreate,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.create_session(user_id=current_user.id, title=request.title)
    return session

@router.get("/session", response_model=List[ChatSessionResponse], summary="Get all chat sessions for user")
async def get_user_sessions(
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    sessions = await repo.get_user_sessions(current_user.id)
    return sessions

@router.put("/session/{session_id}", response_model=ChatSessionResponse, summary="Rename a chat session")
async def rename_chat_session(
    session_id: uuid.UUID,
    request: ChatSessionUpdate,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
    
    updated_session = await repo.update_session(session_id, request.title)
    return updated_session

@router.patch("/session/{session_id}", response_model=ChatSessionResponse, summary="Partially update a chat session")
async def patch_chat_session(
    session_id: uuid.UUID,
    request: ChatSessionUpdate,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
    
    updated_session = await repo.update_session(session_id, request.title)
    return updated_session

@router.get("/session/{session_id}", response_model=ChatSessionWithMessagesResponse, summary="Get conversation history")
async def get_chat_session(
    session_id: uuid.UUID,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session_with_messages(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
    return session

@router.post("/session/{session_id}/message", response_model=ChatResponse, summary="Send a message in a session")
async def send_session_message(
    session_id: uuid.UUID,
    request: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
        
    answer, sources = await orchestrator.process_message(request.message, session_id=session_id)
    return ChatResponse(answer=answer, sources=sources)

@router.post("/session/{session_id}/stream", summary="Stream a message in a session")
async def stream_session_message(
    session_id: uuid.UUID,
    request: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
        
    async def event_generator():
        try:
            async for chunk in orchestrator.process_message_stream(request.message, session_id=session_id):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except asyncio.CancelledError:
            # Client disconnected, gracefully terminate the generator
            pass
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a chat session")
async def delete_chat_session(
    session_id: uuid.UUID,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")

    deleted = await repo.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return None
