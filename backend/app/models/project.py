from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.config import utc_now

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(10), unique=True, index=True, nullable=False)  # e.g., 'CORE', 'SYNC'
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="ACTIVE", index=True)  # PLANNING, ACTIVE, ON_HOLD, COMPLETED
    target_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships: Project -> User Stories (1-to-many with cascade delete)
    stories = relationship("UserStory", back_populates="project", cascade="all, delete-orphan", order_by="UserStory.order_idx")
