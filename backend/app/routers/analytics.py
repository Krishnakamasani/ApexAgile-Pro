from collections import Counter
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project
from app.models.story import UserStory
from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import SprintMetricsOverview, TeamWorkloadMetric
from app.services.seed_service import seed_database_if_empty

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Health"])

@router.get("/overview", response_model=SprintMetricsOverview, summary="Get sprint overview metrics and team workloads")
def get_sprint_overview(project_id: int = Query(None, description="Filter by project ID"), db: Session = Depends(get_db)):
    stories_q = db.query(UserStory)
    if project_id:
        stories_q = stories_q.filter(UserStory.project_id == project_id)
    stories = stories_q.all()
    story_ids = [s.id for s in stories]

    tasks = db.query(Task).filter(Task.story_id.in_(story_ids)).all() if story_ids else []
    projects_count = 1 if project_id else db.query(Project).count()

    total_points = sum(s.points for s in stories)
    completed_points = sum(s.points for s in stories if s.status == "DONE")
    overall_progress = round((completed_points / total_points * 100), 1) if total_points > 0 else 0.0

    # Status breakdowns
    story_status_map = Counter([s.status for s in stories])
    task_status_map = Counter([t.status for t in tasks])
    priority_map = Counter([s.priority for s in stories])

    # Workloads per team member
    users = db.query(User).all()
    workloads = []
    for u in users:
        u_stories = [s for s in stories if s.assignee_id == u.id]
        u_tasks = [t for t in tasks if t.assignee_id == u.id]
        est = sum(t.estimated_hours for t in u_tasks)
        logged = sum(t.logged_hours for t in u_tasks)
        done_t = sum(1 for t in u_tasks if t.status == "DONE")

        workloads.append(TeamWorkloadMetric(
            user_id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            avatar_color=u.avatar_color,
            assigned_stories=len(u_stories),
            assigned_tasks=len(u_tasks),
            total_estimated_hours=round(est, 1),
            total_logged_hours=round(logged, 1),
            completed_tasks=done_t
        ))

    return SprintMetricsOverview(
        total_projects=projects_count,
        total_stories=len(stories),
        total_tasks=len(tasks),
        total_points=total_points,
        completed_points=completed_points,
        overall_progress=overall_progress,
        story_status_breakdown=dict(story_status_map),
        task_status_breakdown=dict(task_status_map),
        priority_breakdown=dict(priority_map),
        team_workloads=workloads
    )

@router.post("/seed", summary="Seed database with demo agile project data")
def seed_data(force: bool = Query(False, description="Wipe and recreate demo data"), db: Session = Depends(get_db)):
    return seed_database_if_empty(db, force=force)
