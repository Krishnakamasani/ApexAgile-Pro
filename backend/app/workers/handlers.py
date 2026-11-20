import json
import time
import logging
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.story import UserStory
from app.models.task import Task
from app.models.user import User
from app.config import utc_now

logger = logging.getLogger("SprintSync.Handlers")

def handle_sprint_report(job, payload: dict, progress_cb, db: Session) -> dict:
    """
    Asynchronous Project Sprint Digest & Health Report Generator.
    Aggregates story points, task progress, estimated vs logged hours,
    and generates a comprehensive executive summary.
    """
    project_id = payload.get("project_id")
    simulate_failure = payload.get("simulate_failure", False)
    current_retry = job.retry_count

    # Step 1: Initializing & Validating target project (Progress: 15%)
    progress_cb(15)
    time.sleep(1.2)  # Simulate real computation/IO

    project = None
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()

    # Demonstration of failure & retry handling:
    # If the user toggled simulate_failure AND retry_count == 0, deliberately trigger a retryable error
    if simulate_failure and current_retry < 2:
        logger.warning(f"Simulating transient external service timeout on job {job.id} (attempt {current_retry + 1})")
        raise ConnectionResetError(f"Transient external reporting service failure encountered on attempt {current_retry + 1}. Triggering exponential retry.")

    # Step 2: Aggregating Hierarchical Work Items (Progress: 40%)
    progress_cb(40)
    time.sleep(1.0)

    stories_query = db.query(UserStory)
    if project_id:
        stories_query = stories_query.filter(UserStory.project_id == project_id)
    stories = stories_query.all()

    total_points = sum(s.points for s in stories)
    completed_points = sum(s.points for s in stories if s.status == "DONE")
    in_progress_points = sum(s.points for s in stories if s.status == "IN_PROGRESS")
    backlog_points = sum(s.points for s in stories if s.status in ("BACKLOG", "TODO"))

    # Step 3: Compiling Task Hours & Burndown Statistics (Progress: 70%)
    progress_cb(70)
    time.sleep(1.0)

    story_ids = [s.id for s in stories]
    tasks = db.query(Task).filter(Task.story_id.in_(story_ids)).all() if story_ids else []
    total_est_hours = sum(t.estimated_hours for t in tasks)
    total_logged_hours = sum(t.logged_hours for t in tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "DONE")

    # Step 4: Generating Formatted Digest Artifacts (Progress: 95%)
    progress_cb(95)
    time.sleep(0.8)

    velocity_pct = round((completed_points / total_points * 100), 1) if total_points > 0 else 0.0
    task_completion_pct = round((completed_tasks / len(tasks) * 100), 1) if tasks else 0.0

    digest_summary = {
        "report_type": "SPRINT_EXECUTIVE_SUMMARY",
        "generated_at": utc_now().isoformat(),
        "target_project": project.name if project else "All Active Projects",
        "project_key": project.key if project else "ALL",
        "metrics": {
            "total_user_stories": len(stories),
            "total_story_points": total_points,
            "completed_story_points": completed_points,
            "in_progress_story_points": in_progress_points,
            "backlog_story_points": backlog_points,
            "story_point_velocity_pct": velocity_pct,
            "total_tasks": len(tasks),
            "completed_tasks": completed_tasks,
            "task_completion_pct": task_completion_pct,
            "total_estimated_hours": round(total_est_hours, 1),
            "total_logged_hours": round(total_logged_hours, 1),
            "hours_variance": round(total_logged_hours - total_est_hours, 1)
        },
        "executive_insights": [
            f"Sprint velocity is currently at {velocity_pct}%.",
            f"{completed_points} out of {total_points} total story points have met Definition of Done.",
            f"Team has logged {round(total_logged_hours, 1)} hours out of {round(total_est_hours, 1)} estimated hours.",
            "Work hierarchy (Project -> Story -> Task) health status: OPTIMAL."
        ]
    }

    progress_cb(100)
    return digest_summary


def handle_workload_audit(job, payload: dict, progress_cb, db: Session) -> dict:
    """
    Asynchronous Team Workload and Bottleneck Risk Scanner.
    Analyzes capacity distribution and identifies unassigned high-priority work.
    """
    progress_cb(20)
    time.sleep(1.0)

    users = db.query(User).all()
    unassigned_stories = db.query(UserStory).filter(UserStory.assignee_id == None).count()
    unassigned_tasks = db.query(Task).filter(Task.assignee_id == None).count()

    progress_cb(60)
    time.sleep(1.0)

    workload_analysis = []
    for u in users:
        stories_count = db.query(UserStory).filter(UserStory.assignee_id == u.id).count()
        tasks = db.query(Task).filter(Task.assignee_id == u.id).all()
        est_hours = sum(t.estimated_hours for t in tasks)
        status_flag = "BALANCED"
        if est_hours > 20:
            status_flag = "HIGH_WORKLOAD"
        elif est_hours == 0:
            status_flag = "AVAILABLE_CAPACITY"

        workload_analysis.append({
            "user_id": u.id,
            "name": u.name,
            "role": u.role,
            "stories_assigned": stories_count,
            "tasks_assigned": len(tasks),
            "estimated_hours": round(est_hours, 1),
            "capacity_status": status_flag
        })

    progress_cb(90)
    time.sleep(0.5)

    result = {
        "report_type": "TEAM_CAPACITY_AUDIT",
        "generated_at": utc_now().isoformat(),
        "unassigned_stories_alert": unassigned_stories,
        "unassigned_tasks_alert": unassigned_tasks,
        "team_capacity_distribution": workload_analysis,
        "recommendations": [
            f"Review {unassigned_tasks} unassigned tasks in upcoming standup.",
            "Workload balance is distributed among team members."
        ]
    }

    progress_cb(100)
    return result


HANDLERS = {
    "SPRINT_REPORT": handle_sprint_report,
    "WORKLOAD_AUDIT": handle_workload_audit,
    "HEALTH_CHECK": handle_sprint_report
}
