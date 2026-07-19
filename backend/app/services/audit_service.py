import uuid
import csv
import io
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.audit_log import AuditLog
from app.db.session import tenant_id_var

class AuditService:
    async def create_log(
        self,
        db: AsyncSession,
        action: str,
        actor_user_id: Optional[uuid.UUID] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        tenant_id = tenant_id_var.get()
        if not tenant_id:
            raise ValueError("Tenant context required for audit logging")
            
        log = AuditLog(
            tenant_id=tenant_id,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc)
        )
        db.add(log)
        # We don't commit here to allow it to be part of the caller's transaction
        return log
        
    async def search_logs(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        actor_user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AuditLog]:
        tenant_id = tenant_id_var.get()
        if not tenant_id:
            raise ValueError("Tenant context required for audit search")
            
        stmt = select(AuditLog).where(AuditLog.tenant_id == tenant_id)
        
        if actor_user_id:
            stmt = stmt.where(AuditLog.actor_user_id == actor_user_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if resource_type:
            stmt = stmt.where(AuditLog.resource_type == resource_type)
        if start_date:
            stmt = stmt.where(AuditLog.created_at >= start_date)
        if end_date:
            stmt = stmt.where(AuditLog.created_at <= end_date)
            
        stmt = stmt.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def export_logs_csv(
        self,
        db: AsyncSession,
        actor_user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> str:
        logs = await self.search_logs(
            db, 0, 10000, actor_user_id, action, resource_type, start_date, end_date
        )
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Timestamp", "Actor ID", "Action", "Resource Type", 
            "Resource ID", "IP Address", "User Agent"
        ])
        
        for log in logs:
            writer.writerow([
                str(log.id),
                log.created_at.isoformat(),
                str(log.actor_user_id) if log.actor_user_id else "",
                log.action,
                log.resource_type or "",
                log.resource_id or "",
                log.ip_address or "",
                log.user_agent or ""
            ])
            
        return output.getvalue()

audit_service = AuditService()
