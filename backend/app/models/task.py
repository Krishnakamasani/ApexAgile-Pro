from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import utc_now

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False, index=True)
    task_key = Column(String(30), index=True, nullable=False)  # e.g., 'CORE-101-T1'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=False, default=list)
    status = Column(String(30), default="TODO", index=True)  # TODO, IN_PROGRESS, IN_REVIEW, DONE
    priority = Column(String(20), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    estimated_hours = Column(Float, default=2.0)
    logged_hours = Column(Float, default=0.0)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    order_idx = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    story = relationship("UserStory", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
