from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import utc_now

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=True)
    role = Column(String(50), default="DEVELOPER")  # PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER, QA_ENGINEER, DESIGNER
    avatar_color = Column(String(20), default="#4F46E5")
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    assigned_stories = relationship("UserStory", back_populates="assignee")
    assigned_tasks = relationship("Task", back_populates="assignee")
