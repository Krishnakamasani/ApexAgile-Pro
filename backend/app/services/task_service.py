from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.story import UserStory
from app.models.task import Task
from app.models.audit import AuditLog
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:

    @staticmethod
    def get_tasks_by_story(db: Session, story_id: int) -> List[Task]:
        """Fetch all tasks for a user story."""
        return db.query(Task).filter(Task.story_id == story_id).order_by(Task.order_idx).all()

    @staticmethod
    def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
        """Fetch single task by ID."""
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create_task(db: Session, story_id: int, task_in: TaskCreate) -> Task:
        """Create a new task under a user story with auto-increment key."""
        story = db.query(UserStory).filter(UserStory.id == story_id).first()
        if not story:
            raise ValueError(f"User Story with ID {story_id} not found.")

        existing_count = db.query(Task).filter(Task.story_id == story_id).count()
        task_key = f"{story.story_key}-T{existing_count + 1}"

        task = Task(
            story_id=story_id,
            task_key=task_key,
            title=task_in.title.strip(),
            description=task_in.description,
            attachments=[attachment.model_dump() for attachment in task_in.attachments],
            status=task_in.status,
            priority=task_in.priority,
            estimated_hours=task_in.estimated_hours,
            logged_hours=task_in.logged_hours,
            assignee_id=task_in.assignee_id,
            order_idx=existing_count
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        db.add(AuditLog(
            entity_type="TASK",
            entity_id=str(task.id),
            action="CREATED",
            details=f"Task {task.task_key} created under story {story.story_key}."
        ))
        db.commit()
        return task

    @staticmethod
    def update_task(db: Session, task_id: int, task_in: TaskUpdate) -> Optional[Task]:
        """Update task properties."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        update_data = task_in.model_dump(exclude_unset=True, mode="json")
        old_status = task.status
        for key, value in update_data.items():
            setattr(task, key, value)

        db.commit()
        db.refresh(task)

        action = "STATUS_CHANGED" if "status" in update_data and update_data["status"] != old_status else "UPDATED"
        db.add(AuditLog(
            entity_type="TASK",
            entity_id=str(task.id),
            action=action,
            details=f"Task {task.task_key} updated: {list(update_data.keys())}."
        ))
        db.commit()
        return task

    @staticmethod
    def update_status(db: Session, task_id: int, new_status: str) -> Optional[Task]:
        """Update task status."""
        valid_statuses = {"TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"}
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status '{new_status}'. Allowed: {valid_statuses}")

        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        prev = task.status
        task.status = new_status
        db.commit()
        db.refresh(task)

        db.add(AuditLog(
            entity_type="TASK",
            entity_id=str(task.id),
            action="STATUS_CHANGED",
            details=f"Task {task.task_key} moved from {prev} to {new_status}."
        ))
        db.commit()
        return task

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        """Delete task item."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False

        key = task.task_key
        db.delete(task)
        db.commit()

        db.add(AuditLog(
            entity_type="TASK",
            entity_id=str(task_id),
            action="DELETED",
            details=f"Task {key} deleted."
        ))
        db.commit()
        return True
