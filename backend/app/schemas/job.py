from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class JobCreateRequest(BaseModel):
    type: str = Field(..., description="Job type: SPRINT_REPORT, WORKLOAD_AUDIT, HEALTH_CHECK")
    project_id: Optional[int] = Field(None, description="Optional target project ID")
    simulate_failure: bool = Field(default=False, description="Simulate job failure to verify retry policy and backoff behavior")
    custom_params: Optional[Dict[str, Any]] = None

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: str
    status: str
    progress: int
    payload: Optional[str] = None
    result: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    max_retries: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class JobRetryRequest(BaseModel):
    max_retries: Optional[int] = Field(None, ge=1, le=10)
