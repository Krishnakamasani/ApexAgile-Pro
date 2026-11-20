from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.story import UserStoryWithTasksResponse

class ProjectBase(BaseModel):
    key: str = Field(..., min_length=2, max_length=10, description="Project short key, e.g. CORE, APM")
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    status: str = Field(default="ACTIVE", description="PLANNING, ACTIVE, ON_HOLD, COMPLETED")
    target_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[datetime] = None

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

class ProjectSummaryResponse(ProjectResponse):
    total_stories: int = 0
    done_stories: int = 0
    total_points: int = 0
    completed_points: int = 0
    total_tasks: int = 0
    done_tasks: int = 0
    progress_percentage: float = 0.0

class ProjectDetailResponse(ProjectSummaryResponse):
    stories: List[UserStoryWithTasksResponse] = []
