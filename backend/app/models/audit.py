from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base
from app.config import utc_now

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), index=True, nullable=False)  # PROJECT, STORY, TASK, JOB
    entity_id = Column(String(50), index=True, nullable=False)
    action = Column(String(50), index=True, nullable=False)        # CREATED, UPDATED, DELETED, STATUS_CHANGED
    details = Column(Text, nullable=True)                        # JSON details of change
    timestamp = Column(DateTime, default=utc_now, index=True)
