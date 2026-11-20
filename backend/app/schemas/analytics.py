from typing import List, Dict, Any
from pydantic import BaseModel

class TeamWorkloadMetric(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    avatar_color: str
    assigned_stories: int
    assigned_tasks: int
    total_estimated_hours: float
    total_logged_hours: float
    completed_tasks: int

class SprintMetricsOverview(BaseModel):
    total_projects: int
    total_stories: int
    total_tasks: int
    total_points: int
    completed_points: int
    overall_progress: float
    story_status_breakdown: Dict[str, int]
    task_status_breakdown: Dict[str, int]
    priority_breakdown: Dict[str, int]
    team_workloads: List[TeamWorkloadMetric]
