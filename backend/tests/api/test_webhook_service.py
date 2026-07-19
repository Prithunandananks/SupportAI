import pytest
import uuid
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.webhook_service import webhook_service
from app.models.webhook import Webhook
from app.models.webhook_delivery import WebhookDelivery
from app.db.session import tenant_id_var

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.mark.asyncio
async def test_webhook_dispatch_no_tenant(mock_db):
    tenant_id_var.set(None)
    await webhook_service.dispatch_event(mock_db, "ticket.created", {})
    mock_db.execute.assert_not_called()

@pytest.mark.asyncio
async def test_webhook_dispatch_success(mock_db):
    tenant_id = uuid.uuid4()
    tenant_id_var.set(tenant_id)
    
    mock_webhook = MagicMock()
    mock_webhook.id = uuid.uuid4()
    mock_webhook.events = ["ticket.created"]
    
    mock_result = MagicMock()
    mock_result.scalars().all.return_value = [mock_webhook]
    mock_db.execute.return_value = mock_result
    
    await webhook_service.dispatch_event(mock_db, "ticket.created", {"id": 123})
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()

@pytest.mark.asyncio
async def test_attempt_delivery_success(mock_db):
    delivery_id = uuid.uuid4()
    webhook_id = uuid.uuid4()
    
    class MockDelivery:
        pass
    mock_delivery = MockDelivery()
    mock_delivery.id = delivery_id
    mock_delivery.webhook_id = webhook_id
    mock_delivery.status = "PENDING"
    mock_delivery.attempt_count = 0
    mock_delivery.request_body = {"test": "data"}
    
    mock_webhook = MagicMock()
    mock_webhook.id = webhook_id
    mock_webhook.secret = "test_secret"
    mock_webhook.url = "https://example.com/webhook"
    
    def side_effect(stmt):
        mock_result = MagicMock()
        # if this is a query for WebhookDelivery
        if "webhook_deliveries" in str(stmt).lower():
            mock_result.scalars.return_value.first.return_value = mock_delivery
        else:
            mock_result.scalars.return_value.first.return_value = mock_webhook
        return mock_result
        
    mock_db.execute.side_effect = side_effect
    
    class MockResponse:
        status_code = 200
        text = "ok"
    
    class MockClientContext:
        async def __aenter__(self):
            client = AsyncMock()
            client.post.return_value = MockResponse()
            return client
        async def __aexit__(self, exc_type, exc, tb):
            pass

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value = MockClientContext()
        await webhook_service.attempt_delivery(mock_db, delivery_id)
        
    assert mock_delivery.status == "SUCCESS"
    assert mock_delivery.response_code == 200

@pytest.mark.asyncio
async def test_attempt_delivery_timeout(mock_db):
    delivery_id = uuid.uuid4()
    
    class MockDelivery:
        pass
    mock_delivery = MockDelivery()
    mock_delivery.id = delivery_id
    mock_delivery.webhook_id = uuid.uuid4()
    mock_delivery.status = "PENDING"
    mock_delivery.attempt_count = 0
    mock_delivery.request_body = {}
    
    mock_webhook = MagicMock()
    mock_webhook.secret = "test_secret"
    
    def side_effect(stmt):
        mock_result = MagicMock()
        if "webhook_deliveries" in str(stmt).lower():
            mock_result.scalars.return_value.first.return_value = mock_delivery
        else:
            mock_result.scalars.return_value.first.return_value = mock_webhook
        return mock_result
        
    mock_db.execute.side_effect = side_effect
    
    class MockClientContext:
        async def __aenter__(self):
            client = AsyncMock()
            client.post.side_effect = httpx.TimeoutException("Timeout")
            return client
        async def __aexit__(self, exc_type, exc, tb):
            pass

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value = MockClientContext()
        await webhook_service.attempt_delivery(mock_db, delivery_id)
        
    assert mock_delivery.status == "FAILED"
    assert mock_delivery.response_code is None
    assert "Timeout" in mock_delivery.response_body

@pytest.mark.asyncio
@patch("app.services.webhook_service.audit_service")
async def test_attempt_delivery_max_retries(mock_audit, mock_db):
    delivery_id = uuid.uuid4()
    webhook_id = uuid.uuid4()
    from unittest.mock import AsyncMock
    mock_audit.create_log = AsyncMock()
    
    class MockDelivery:
        pass
    mock_delivery = MockDelivery()
    mock_delivery.id = delivery_id
    mock_delivery.webhook_id = webhook_id
    mock_delivery.status = "PENDING"
    mock_delivery.attempt_count = 4 # next is 5 which is max
    mock_delivery.request_body = {}
    mock_delivery.event_type = "test.event"
    
    mock_webhook = MagicMock()
    mock_webhook.id = webhook_id
    mock_webhook.secret = "test_secret"
    
    def side_effect(stmt):
        mock_result = MagicMock()
        if "webhook_deliveries" in str(stmt).lower():
            mock_result.scalars.return_value.first.return_value = mock_delivery
        else:
            mock_result.scalars.return_value.first.return_value = mock_webhook
        return mock_result
        
    mock_db.execute.side_effect = side_effect
    
    class MockClientContext:
        async def __aenter__(self):
            client = AsyncMock()
            client.post.side_effect = Exception("General error")
            return client
        async def __aexit__(self, exc_type, exc, tb):
            pass

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value = MockClientContext()
        await webhook_service.attempt_delivery(mock_db, delivery_id)
        
    assert mock_delivery.status == "FAILED"
    assert mock_delivery.attempt_count == 5
    mock_db.add.assert_called() # dlq add
