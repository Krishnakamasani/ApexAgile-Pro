from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.story import UserStory
from app.models.audit import AuditLog
from app.schemas.story import UserStoryCreate, UserStoryUpdate

class StoryService:

    @staticmethod
    def get_stories_by_project(db: Session, project_id: int) -> List[UserStory]:
        """Fetch all user stories belonging to a project."""
        return db.query(UserStory).filter(UserStory.project_id == project_id).order_by(UserStory.order_idx).all()

    @staticmethod
    def get_story_by_id(db: Session, story_id: int) -> Optional[UserStory]:
        """Fetch single story by ID."""
        return db.query(UserStory).filter(UserStory.id == story_id).first()

    @staticmethod
    def create_story(db: Session, project_id: int, story_in: UserStoryCreate) -> UserStory:
        """Create a user story under a parent project with auto-generated key."""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} not found.")

        # Determine next story index for project key
        existing_count = db.query(UserStory).filter(UserStory.project_id == project_id).count()
        story_key = f"{project.key}-{existing_count + 1}"

        story = UserStory(
            project_id=project_id,
            story_key=story_key,
            title=story_in.title.strip(),
            description=story_in.description,
            acceptance_criteria=story_in.acceptance_criteria,
            attachments=[attachment.model_dump() for attachment in story_in.attachments],
            points=story_in.points,
            priority=story_in.priority,
            status=story_in.status,
            assignee_id=story_in.assignee_id,
            order_idx=existing_count
        )
        db.add(story)
        db.commit()
        db.refresh(story)

        db.add(AuditLog(
            entity_type="STORY",
            entity_id=str(story.id),
            action="CREATED",
            details=f"Story {story.story_key} created under {project.key}."
        ))
        db.commit()
        return story

    @staticmethod
    def update_story(db: Session, story_id: int, story_in: UserStoryUpdate) -> Optional[UserStory]:
        """Update user story fields."""
        story = db.query(UserStory).filter(UserStory.id == story_id).first()
        if not story:
            return None

        update_data = story_in.model_dump(exclude_unset=True, mode="json")
        old_status = story.status
        for key, value in update_data.items():
            setattr(story, key, value)

        db.commit()
        db.refresh(story)

        action = "STATUS_CHANGED" if "status" in update_data and update_data["status"] != old_status else "UPDATED"
        db.add(AuditLog(
            entity_type="STORY",
            entity_id=str(story.id),
            action=action,
            details=f"Story {story.story_key} updated: {list(update_data.keys())}."
        ))
        db.commit()
        return story

    @staticmethod
    def update_status(db: Session, story_id: int, new_status: str) -> Optional[UserStory]:
        """Update story status column."""
        valid_statuses = {"BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"}
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status '{new_status}'. Allowed: {valid_statuses}")

        story = db.query(UserStory).filter(UserStory.id == story_id).first()
        if not story:
            return None

        prev = story.status
        story.status = new_status
        db.commit()
        db.refresh(story)

        db.add(AuditLog(
            entity_type="STORY",
            entity_id=str(story.id),
            action="STATUS_CHANGED",
            details=f"Story {story.story_key} moved from {prev} to {new_status}."
        ))
        db.commit()
        return story

    @staticmethod
    def delete_story(db: Session, story_id: int) -> bool:
        """Delete story and cascade delete child tasks."""
        story = db.query(UserStory).filter(UserStory.id == story_id).first()
        if not story:
            return False

        key = story.story_key
        db.delete(story)
        db.commit()

        db.add(AuditLog(
            entity_type="STORY",
            entity_id=str(story_id),
            action="DELETED",
            details=f"Story {key} and its child tasks were removed."
        ))
        db.commit()
        return True
