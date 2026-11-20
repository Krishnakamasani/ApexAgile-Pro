from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse
from app.schemas.task import TaskResponse
from app.schemas.attachment import ImageAttachment

class UserStoryBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    attachments: List[ImageAttachment] = Field(default_factory=list, max_length=3)
    points: int = Field(default=3, ge=1, le=100, description="Agile Story points (e.g., 1, 2, 3, 5, 8, 13)")
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    status: str = Field(default="BACKLOG", description="BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE")
    assignee_id: Optional[int] = None
    order_idx: int = Field(default=0)

class UserStoryCreate(UserStoryBase):
    pass

class UserStoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    attachments: Optional[List[ImageAttachment]] = Field(None, max_length=3)
    points: Optional[int] = Field(None, ge=1, le=100)
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[int] = None
    order_idx: Optional[int] = None

class UserStoryStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE")

class UserStoryResponse(UserStoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    story_key: str
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserResponse] = None

class UserStoryWithTasksResponse(UserStoryResponse):
    tasks: List[TaskResponse] = []
    task_count: int = 0
    completed_task_count: int = 0
    progress_percentage: float = 0.0
