from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
import asyncio
import uuid
import traceback

from app.core.logger import logger
from app.schemas.chat import ChatRequest, ChatResponse, FeedbackRequest, FlagRequest
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
from app.models.chat import FeedbackEnum
from app.models.ticket import Ticket, TicketCategory, TicketStatus
from app.repositories.ticket_repo import ticket_repo

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
    request: Request,
    chat_req: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Process a chat message using the existing RAG pipeline and return the generated answer and citations.
    """
    answer, sources = await orchestrator.process_message(chat_req.message)
    req_id = getattr(request.state, "request_id", "unknown")
    logger.info(json.dumps({
        "event": "chat_generation",
        "user_id": str(current_user.id),
        "request_id": req_id
    }))
    return ChatResponse(answer=answer, sources=sources)

@router.post("/stream", summary="Send a message to the AI assistant and stream the response")
async def chat_stream_endpoint(
    request: Request,
    chat_req: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Process a chat message using the existing RAG pipeline and stream the generated answer.
    """
    req_id = getattr(request.state, "request_id", "unknown")
    
    async def event_generator():
        try:
            async for item in orchestrator.process_message_stream(chat_req.message, regenerate=chat_req.regenerate):
                yield f"data: {json.dumps(item)}\n\n"
            
            logger.info(json.dumps({
                "event": "chat_stream_generation",
                "regenerate": chat_req.regenerate,
                "user_id": str(current_user.id),
                "request_id": req_id
            }))
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(json.dumps({
                "event": "chat_stream_error",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "request_id": req_id
            }))
            yield f"data: {json.dumps({'error': 'An error occurred during generation'})}\n\n"
            
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
    if session.user_id != current_user.id and current_user.role.lower() != "admin":
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
    if session.user_id != current_user.id and current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
    
    updated_session = await repo.update_session(session_id, request.title)
    return updated_session

@router.get("/session/{session_id}", response_model=ChatSessionWithMessagesResponse, summary="Get conversation history")
async def get_chat_session(
    session_id: uuid.UUID,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db),
):
    session = await repo.get_session_with_messages(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id and current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
        
    from sqlalchemy import select
    from app.models.ticket import Ticket, TicketMessage
    from app.schemas.chat_session import ChatMessageResponse
    
    stmt = (
        select(TicketMessage)
        .join(Ticket, Ticket.id == TicketMessage.ticket_id)
        .where(Ticket.conversation_id == session_id)
    )
    result = await db.execute(stmt)
    ticket_msgs = result.scalars().all()
    
    messages_resp = [ChatMessageResponse.model_validate(m) for m in session.messages]
    
    for tm in ticket_msgs:
        messages_resp.append(ChatMessageResponse(
            id=tm.id,
            session_id=session_id,
            created_at=tm.created_at,
            role="assistant",
            content=tm.message,
            is_support=True
        ))
        
    messages_resp.sort(key=lambda x: x.created_at)
    
    return {
        "id": session.id,
        "title": session.title,
        "user_id": session.user_id,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "messages": messages_resp
    }

@router.post("/session/{session_id}/message", response_model=ChatResponse, summary="Send a message in a session")
async def send_session_message(
    request: Request,
    session_id: uuid.UUID,
    chat_req: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    req_id = getattr(request.state, "request_id", "unknown")
    user_id_str = str(current_user.id)
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if str(session.user_id) != user_id_str and current_user.role.lower() != "admin":
        logger.warning(json.dumps({
            "event": "send_message_failed",
            "reason": "forbidden",
            "session_id": str(session_id),
            "user_id": user_id_str,
            "request_id": req_id
        }))
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
        
    answer, sources = await orchestrator.process_message(chat_req.message, session_id=session_id)
    
    logger.info(json.dumps({
        "event": "chat_generation",
        "session_id": str(session_id),
        "user_id": user_id_str,
        "request_id": req_id
    }))
    
    return ChatResponse(answer=answer, sources=sources)

@router.post("/session/{session_id}/stream", summary="Stream a message in a session")
async def stream_session_message(
    request: Request,
    session_id: uuid.UUID,
    chat_req: ChatRequest,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    req_id = getattr(request.state, "request_id", "unknown")
    user_id_str = str(current_user.id)
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if str(session.user_id) != user_id_str and current_user.role.lower() != "admin":
        logger.warning(json.dumps({
            "event": "stream_message_failed",
            "reason": "forbidden",
            "session_id": str(session_id),
            "user_id": user_id_str,
            "request_id": req_id
        }))
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")
        
    async def event_generator():
        try:
            async for item in orchestrator.process_message_stream(chat_req.message, session_id=session_id, regenerate=chat_req.regenerate):
                yield f"data: {json.dumps(item)}\n\n"
            logger.info(json.dumps({
                "event": "chat_stream_started",
                "session_id": str(session_id),
                "user_id": user_id_str,
                "request_id": req_id
            }))
        except asyncio.CancelledError:
            # Client disconnected, gracefully terminate the generator
            pass
        except Exception as e:
            logger.error(json.dumps({
                "event": "chat_stream_error",
                "error": str(e),
                "traceback": traceback.format_exc(),
                "request_id": req_id
            }))
            yield f"data: {json.dumps({'error': 'An error occurred during generation'})}\n\n"
            
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
    if session.user_id != current_user.id and current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this session")

    deleted = await repo.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return None

@router.post("/session/{session_id}/message/{message_id}/feedback", summary="Submit feedback for a message")
async def submit_message_feedback(
    session_id: uuid.UUID,
    message_id: uuid.UUID,
    feedback_req: FeedbackRequest,
    repo: ChatRepository = Depends(get_chat_repo),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id and current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    msg = await repo.get_message(message_id)
    if not msg or msg.session_id != session_id:
        raise HTTPException(status_code=404, detail="Message not found in this session")

    feedback_val = feedback_req.feedback.upper()
    if feedback_val not in [FeedbackEnum.LIKE.value, FeedbackEnum.DISLIKE.value]:
        raise HTTPException(status_code=400, detail="Invalid feedback value")

    await repo.update_message_feedback(message_id, feedback_val)

    return {
        "implemented": True,
        "message": "Feedback saved successfully."
    }

@router.post("/session/{session_id}/message/{message_id}/flag", summary="Flag a message for review")
async def flag_message(
    session_id: uuid.UUID,
    message_id: uuid.UUID,
    flag_req: FlagRequest,
    repo: ChatRepository = Depends(get_chat_repo),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    session = await repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id and current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    msg = await repo.get_message(message_id)
    if not msg or msg.session_id != session_id:
        raise HTTPException(status_code=404, detail="Message not found in this session")

    # Check for existing open reports by this customer for this message
    from sqlalchemy import select
    stmt = select(Ticket).where(
        Ticket.customer_id == current_user.id,
        Ticket.chat_message_id == message_id,
        Ticket.status == TicketStatus.OPEN
    )
    result = await db.execute(stmt)
    existing_ticket = result.scalars().first()
    
    if existing_ticket:
        raise HTTPException(status_code=400, detail="You already have an open report for this message.")

    from app.services.ticket_service import ticket_service
    from app.schemas.ticket import TicketCreate
    
    new_ticket_in = TicketCreate(
        title=f"Reported AI Response: {flag_req.reason}",
        description=flag_req.comment or "Customer flagged this message for review.",
        category=TicketCategory.REPORT,
        conversation_id=session_id,
        chat_message_id=message_id,
        report_reason=flag_req.reason,
        customer_comment=flag_req.comment
    )
    await ticket_service.create_ticket(db, ticket_in=new_ticket_in, customer_id=current_user.id)

    return {
        "implemented": True,
        "message": "Message reported successfully."
    }
