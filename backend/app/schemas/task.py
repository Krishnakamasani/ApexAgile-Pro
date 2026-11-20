from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse
from app.schemas.attachment import ImageAttachment

class TaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    attachments: list[ImageAttachment] = Field(default_factory=list, max_length=3)
    status: str = Field(default="TODO", description="TODO, IN_PROGRESS, IN_REVIEW, DONE")
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    estimated_hours: float = Field(default=2.0, ge=0.0)
    logged_hours: float = Field(default=0.0, ge=0.0)
    assignee_id: Optional[int] = None
    order_idx: int = Field(default=0)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    attachments: Optional[list[ImageAttachment]] = Field(None, max_length=3)
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0.0)
    logged_hours: Optional[float] = Field(None, ge=0.0)
    assignee_id: Optional[int] = None
    order_idx: Optional[int] = None

class TaskStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: TODO, IN_PROGRESS, IN_REVIEW, DONE")

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    story_id: int
    task_key: str
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserResponse] = None
