from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120, description="User email address")
    role: str = Field(default="DEVELOPER", description="Team role: PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER, QA_ENGINEER, DESIGNER")
    avatar_color: Optional[str] = "#4F46E5"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
