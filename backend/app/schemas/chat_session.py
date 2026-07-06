from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class ChatMessageBase(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: Optional[str] = Field(None, description="Optional title for the session")

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatSessionWithMessagesResponse(ChatSessionResponse):
    messages: List[ChatMessageResponse] = []
