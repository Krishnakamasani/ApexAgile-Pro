from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import utc_now

class UserStory(Base):
    __tablename__ = "user_stories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    story_key = Column(String(20), index=True, nullable=False)  # e.g., 'CORE-101'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    acceptance_criteria = Column(Text, nullable=True)  # Formatted checklist or criteria
    attachments = Column(JSON, nullable=False, default=list)
    points = Column(Integer, default=3)  # Fibonacci: 1, 2, 3, 5, 8, 13
    priority = Column(String(20), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="BACKLOG", index=True)  # BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    order_idx = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    project = relationship("Project", back_populates="stories")
    assignee = relationship("User", back_populates="assigned_stories")
    tasks = relationship("Task", back_populates="story", cascade="all, delete-orphan", order_by="Task.order_idx")
