
import pytest
import uuid
from httpx import AsyncClient

@pytest.fixture
async def tenant_b_admin_token(client: AsyncClient, db_session):
    # Register user B
    await client.post("/api/v1/auth/register", json={
        "email": "admin_b@example.com",
        "password": "Password123!",
        "first_name": "Admin",
        "last_name": "B"
    })
    
    # Promote to Admin and create Tenant + Membership
    from app.repositories.user_repo import user_repo
    from app.models.tenant import Tenant
    from app.models.tenant_membership import TenantMembership, MembershipRole, MembershipStatus
    user = await user_repo.get_by_email(db_session, email="admin_b@example.com")
    if user:
        user.role = "Admin"
        
        tenant_b = Tenant(name="Tenant B", slug=f"tenant-b-{uuid.uuid4().hex[:8]}")
        db_session.add(tenant_b)
        await db_session.flush()
        
        user.tenant_id = tenant_b.id
        
        membership = TenantMembership(
            tenant_id=tenant_b.id,
            user_id=user.id,
            role=MembershipRole.OWNER,
            status=MembershipStatus.ACTIVE
        )
        db_session.add(membership)
        await db_session.commit()
    
    # Login
    login_res = await client.post("/api/v1/auth/login", data={
        "username": "admin_b@example.com",
        "password": "Password123!"
    })
    return login_res.json()["access_token"]

@pytest.mark.asyncio
async def test_analytics_isolation(client: AsyncClient, admin_token, tenant_b_admin_token, db_session):
    # admin_token is for Tenant A
    headers_a = {"Authorization": f"Bearer {admin_token}"}
    
    # Create data in Tenant A
    from app.models.document import Document
    from app.models.chat import ChatSession, ChatMessage, FeedbackEnum
    from app.models.ticket import Ticket, TicketCategory, TicketStatus, TicketPriority
    from app.models.message_source import MessageSource
    from app.repositories.user_repo import user_repo
    
    user_a = await user_repo.get_by_email(db_session, email="admin@example.com")
    tenant_a_id = user_a.tenant_id
    user_a_id = user_a.id
    
    doc_a = Document(tenant_id=tenant_a_id, user_id=user_a_id, filename="doc_a.pdf", file_size=1024, content_type="application/pdf")
    db_session.add(doc_a)
    chat_a = ChatSession(tenant_id=tenant_a_id, user_id=user_a_id, title="Chat A")
    db_session.add(chat_a)
    await db_session.commit()
    await db_session.refresh(doc_a)
    await db_session.refresh(chat_a)
    doc_a_id = doc_a.id
    chat_a_id = chat_a.id
    
    msg_a = ChatMessage(tenant_id=tenant_a_id, session_id=chat_a_id, role="assistant", content="Response A", feedback=FeedbackEnum.LIKE)
    db_session.add(msg_a)
    await db_session.commit()
    await db_session.refresh(msg_a)
    msg_a_id = msg_a.id
    
    ticket_a = Ticket(
        tenant_id=tenant_a_id, 
        customer_id=user_a_id, 
        chat_message_id=msg_a_id, 
        category=TicketCategory.REPORT, 
        status=TicketStatus.OPEN, 
        title="Report A", 
        description="Desc", 
        ticket_number="T-1234",
        priority=TicketPriority.HIGH
    )
    db_session.add(ticket_a)
    
    src_a = MessageSource(tenant_id=tenant_a_id, chat_message_id=msg_a_id, document_id=doc_a_id, chunk_index=0, retrieval_score=0.99, rank=1)
    db_session.add(src_a)
    await db_session.commit()
    
    # Verify Tenant A sees their data
    res_a = await client.get("/api/v1/admin/stats", headers=headers_a)
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["total_documents"] >= 1
    
    # Authenticate as Tenant B Admin
    headers_b = {"Authorization": f"Bearer {tenant_b_admin_token}"}
    
    # Verify Stats are empty for Tenant B
    from sqlalchemy import select, func
    from app.models.user import User
    from jose import jwt
    from app.core.config import settings
    import uuid
    payload = jwt.decode(tenant_b_admin_token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
    print("TENANT B TOKEN PAYLOAD:", payload)
    user_b_db = await db_session.execute(select(User).where(User.id == uuid.UUID(payload.get("sub"))))
    print("USER B IN DB:", user_b_db.scalar_one_or_none())
    
    response = await client.get("/api/v1/admin/stats", headers=headers_b)
    if response.status_code != 200:
        print(f"FAILED TENANT B STATS: {response.status_code} {response.text}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_documents"] == 0
    assert data["total_conversations"] == 0
    assert data["total_ai_messages"] == 0
    assert data["flagged_questions"] == 0
    assert data["likes"] == 0

@pytest.mark.asyncio
async def test_knowledge_impact_isolation(client: AsyncClient, admin_token, tenant_b_admin_token, db_session):
    headers_a = {"Authorization": f"Bearer {admin_token}"}
    headers_b = {"Authorization": f"Bearer {tenant_b_admin_token}"}
    
    from app.models.document import Document
    from app.models.chat import ChatSession, ChatMessage
    from app.models.ticket import Ticket, TicketCategory, TicketStatus, TicketPriority
    from app.models.message_source import MessageSource
    from app.repositories.user_repo import user_repo
    
    user_a = await user_repo.get_by_email(db_session, email="admin@example.com")
    tenant_a_id = user_a.tenant_id
    user_a_id = user_a.id
    
    doc_a = Document(tenant_id=tenant_a_id, user_id=user_a_id, filename="doc_a2.pdf", file_size=1024, content_type="application/pdf")
    db_session.add(doc_a)
    chat_a = ChatSession(tenant_id=tenant_a_id, user_id=user_a_id, title="Chat A")
    db_session.add(chat_a)
    await db_session.commit()
    await db_session.refresh(doc_a)
    await db_session.refresh(chat_a)
    doc_a_id = doc_a.id
    chat_a_id = chat_a.id
    
    msg_a = ChatMessage(tenant_id=tenant_a_id, session_id=chat_a_id, role="assistant", content="Response A")
    db_session.add(msg_a)
    await db_session.commit()
    await db_session.refresh(msg_a)
    msg_a_id = msg_a.id
    
    ticket_a = Ticket(
        tenant_id=tenant_a_id, 
        customer_id=user_a_id, 
        chat_message_id=msg_a_id, 
        category=TicketCategory.REPORT, 
        status=TicketStatus.OPEN, 
        title="Report A",
        description="Desc",
        ticket_number="T-1235",
        priority=TicketPriority.HIGH
    )
    db_session.add(ticket_a)
    
    src_a = MessageSource(tenant_id=tenant_a_id, chat_message_id=msg_a_id, document_id=doc_a_id, chunk_index=0, retrieval_score=0.99, rank=1)
    db_session.add(src_a)
    await db_session.commit()
    
    # Verify Knowledge Impact Analytics are empty for Tenant B
    response = await client.get("/api/v1/admin/knowledge-impact", headers=headers_b)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["top_flagged_documents"]) == 0
    assert len(data["top_referenced_documents"]) == 0
    assert len(data["document_health_ranking"]) == 0
    
    # Verify Tenant A Admin sees their data
    response_a = await client.get("/api/v1/admin/knowledge-impact", headers=headers_a)
    assert response_a.status_code == 200
    data_a = response_a.json()
    
    assert len(data_a["top_referenced_documents"]) > 0
