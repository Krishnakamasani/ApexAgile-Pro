from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.project import Project
from app.models.story import UserStory
from app.models.task import Task
from app.models.audit import AuditLog
from app.schemas.project import ProjectCreate, ProjectUpdate

class ProjectService:

    @staticmethod
    def get_all_projects_summary(db: Session) -> List[dict]:
        """Fetch all projects with calculated rollup metrics."""
        projects = db.query(Project).order_by(Project.created_at.desc()).all()
        results = []
        for p in projects:
            stories = p.stories
            total_stories = len(stories)
            done_stories = sum(1 for s in stories if s.status == "DONE")
            total_points = sum(s.points for s in stories)
            completed_points = sum(s.points for s in stories if s.status == "DONE")

            all_tasks = []
            for s in stories:
                all_tasks.extend(s.tasks)
            total_tasks = len(all_tasks)
            done_tasks = sum(1 for t in all_tasks if t.status == "DONE")

            # Progress calculation based on story points (or story count if points are 0)
            if total_points > 0:
                progress = round((completed_points / total_points) * 100, 1)
            elif total_stories > 0:
                progress = round((done_stories / total_stories) * 100, 1)
            else:
                progress = 0.0

            results.append({
                "id": p.id,
                "key": p.key,
                "name": p.name,
                "description": p.description,
                "status": p.status,
                "target_date": p.target_date,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
                "total_stories": total_stories,
                "done_stories": done_stories,
                "total_points": total_points,
                "completed_points": completed_points,
                "total_tasks": total_tasks,
                "done_tasks": done_tasks,
                "progress_percentage": progress
            })
        return results

    @staticmethod
    def get_project_detail(db: Session, project_id: int) -> Optional[dict]:
        """Fetch detailed project hierarchy with nested stories and tasks."""
        p = db.query(Project).filter(Project.id == project_id).first()
        if not p:
            return None

        stories = p.stories
        stories_data = []
        total_points = sum(s.points for s in stories)
        completed_points = sum(s.points for s in stories if s.status == "DONE")
        all_tasks = []

        for s in stories:
            tasks = s.tasks
            all_tasks.extend(tasks)
            task_cnt = len(tasks)
            done_task_cnt = sum(1 for t in tasks if t.status == "DONE")
            task_prog = round((done_task_cnt / task_cnt * 100), 1) if task_cnt > 0 else (100.0 if s.status == "DONE" else 0.0)

            stories_data.append({
                "id": s.id,
                "project_id": s.project_id,
                "story_key": s.story_key,
                "title": s.title,
                "description": s.description,
                "acceptance_criteria": s.acceptance_criteria,
                "attachments": s.attachments or [],
                "points": s.points,
                "priority": s.priority,
                "status": s.status,
                "assignee_id": s.assignee_id,
                "order_idx": s.order_idx,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "assignee": s.assignee,
                "tasks": tasks,
                "task_count": task_cnt,
                "completed_task_count": done_task_cnt,
                "progress_percentage": task_prog
            })

        total_tasks = len(all_tasks)
        done_tasks = sum(1 for t in all_tasks if t.status == "DONE")
        progress = round((completed_points / total_points) * 100, 1) if total_points > 0 else 0.0

        return {
            "id": p.id,
            "key": p.key,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "target_date": p.target_date,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "total_stories": len(stories),
            "done_stories": sum(1 for s in stories if s.status == "DONE"),
            "total_points": total_points,
            "completed_points": completed_points,
            "total_tasks": total_tasks,
            "done_tasks": done_tasks,
            "progress_percentage": progress,
            "stories": stories_data
        }

    @staticmethod
    def create_project(db: Session, project_in: ProjectCreate) -> Project:
        """Create new project with unique key check."""
        clean_key = project_in.key.strip().upper()
        existing = db.query(Project).filter(Project.key == clean_key).first()
        if existing:
            raise ValueError(f"Project key '{clean_key}' is already in use.")

        project = Project(
            key=clean_key,
            name=project_in.name.strip(),
            description=project_in.description,
            status=project_in.status,
            target_date=project_in.target_date
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        db.add(AuditLog(
            entity_type="PROJECT",
            entity_id=str(project.id),
            action="CREATED",
            details=f"Project {project.key} - {project.name} created."
        ))
        db.commit()
        return project

    @staticmethod
    def update_project(db: Session, project_id: int, project_in: ProjectUpdate) -> Optional[Project]:
        """Update existing project fields."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None

        update_data = project_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)

        db.commit()
        db.refresh(project)

        db.add(AuditLog(
            entity_type="PROJECT",
            entity_id=str(project.id),
            action="UPDATED",
            details=f"Project updated: {list(update_data.keys())}"
        ))
        db.commit()
        return project

    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        """Delete project with cascade removal of all child user stories and tasks."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False

        p_key = project.key
        db.delete(project)
        db.commit()

        db.add(AuditLog(
            entity_type="PROJECT",
            entity_id=str(project_id),
            action="DELETED",
            details=f"Project {p_key} deleted along with cascade work items."
        ))
        db.commit()
        return True
