import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime
from app.database import Base
from app.config import utc_now

class AsyncJob(Base):
    __tablename__ = "async_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(50), nullable=False, index=True)  # SPRINT_REPORT, WORKLOAD_AUDIT, HEALTH_CHECK
    status = Column(String(20), default="PENDING", index=True)  # PENDING, PROCESSING, COMPLETED, FAILED, RETRYING
    progress = Column(Integer, default=0)  # 0 to 100 percentage
    payload = Column(Text, nullable=True)  # JSON input arguments
    result = Column(Text, nullable=True)   # JSON completed report/results
    error_message = Column(Text, nullable=True)  # Full traceback / error notes if failed
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=utc_now)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
