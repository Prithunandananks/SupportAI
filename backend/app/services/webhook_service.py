import hmac
import hashlib
import json
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.webhook import Webhook
from app.models.webhook_delivery import WebhookDelivery
from app.models.webhook_dead_letter import WebhookDeadLetter
from app.db.session import tenant_id_var
from app.services.audit_service import audit_service

class WebhookService:
    def __init__(self):
        self.retry_delays = [1, 2, 4, 8, 16] # minutes
        self.max_attempts = 5
        
    def generate_signature(self, payload: str, secret: str) -> str:
        return hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

    async def dispatch_event(self, db: AsyncSession, event_type: str, payload: dict) -> None:
        tenant_id = tenant_id_var.get()
        if not tenant_id:
            return
            
        stmt = select(Webhook).where(
            Webhook.tenant_id == tenant_id,
            Webhook.is_active == True
        )
        result = await db.execute(stmt)
        webhooks = result.scalars().all()
        
        for wh in webhooks:
            # Check if webhook subscribes to this event
            # events could be list of strings or wildcard
            if event_type in wh.events or "*" in wh.events:
                # Create initial delivery record
                delivery = WebhookDelivery(
                    webhook_id=wh.id,
                    event_type=event_type,
                    status="PENDING",
                    request_body=payload,
                    attempt_count=0
                )
                db.add(delivery)
                await db.commit()
                await db.refresh(delivery)
                
                # In a real system, this would queue to Celery/Redis
                # For this implementation we'll run the first attempt synchronously or spawn a background task
                # We will mock the queueing by just executing attempt delivery directly here for simplicity
                from fastapi import BackgroundTasks
                # Actually, to avoid circular dependencies we just provide an async method to run delivery
                
    async def attempt_delivery(self, db: AsyncSession, delivery_id: uuid.UUID) -> None:
        stmt = select(WebhookDelivery).where(WebhookDelivery.id == delivery_id)
        result = await db.execute(stmt)
        delivery = result.scalars().first()
        
        if not delivery or delivery.status == "SUCCESS":
            return
            
        stmt = select(Webhook).where(Webhook.id == delivery.webhook_id)
        result = await db.execute(stmt)
        webhook = result.scalars().first()
        
        if not webhook:
            return

        delivery.attempt_count += 1
        payload_str = json.dumps(delivery.request_body)
        signature = self.generate_signature(payload_str, webhook.secret)
        
        headers = {
            "Content-Type": "application/json",
            "X-SupportAI-Signature": signature
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(webhook.url, content=payload_str, headers=headers)
                
            delivery.response_code = response.status_code
            delivery.response_body = response.text[:2000] # Cap length
            
            if 200 <= response.status_code < 300:
                delivery.status = "SUCCESS"
                delivery.delivered_at = datetime.now(timezone.utc)
            else:
                delivery.status = "FAILED"
                
        except httpx.TimeoutException as e:
            from app.core.logger import logger
            logger.warning(f"WEBHOOK_TIMEOUT: Webhook delivery timed out for {webhook.url}")
            delivery.response_code = None
            delivery.response_body = "WEBHOOK_TIMEOUT: " + str(e)[:1900]
            delivery.status = "FAILED"
        except Exception as e:
            delivery.response_code = None
            delivery.response_body = str(e)[:2000]
            delivery.status = "FAILED"
            
        if delivery.status == "FAILED":
            if delivery.attempt_count >= self.max_attempts:
                # Move to Dead Letter Queue
                dlq = WebhookDeadLetter(
                    webhook_id=webhook.id,
                    event_type=delivery.event_type,
                    payload=delivery.request_body,
                    failure_reason=f"Max attempts reached. Last error: {delivery.response_body}",
                    last_attempt=datetime.now(timezone.utc)
                )
                db.add(dlq)
                
                # Audit log
                await audit_service.create_log(
                    db=db,
                    action="WEBHOOK_FAILED",
                    resource_type="Webhook",
                    resource_id=str(webhook.id)
                )
        
        await db.commit()

webhook_service = WebhookService()
