from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.database import get_db
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Logs"])

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: str
    action: str
    details: str | None
    timestamp: datetime

@router.get("", response_model=List[AuditLogResponse], summary="List recent audit log entries")
def list_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
