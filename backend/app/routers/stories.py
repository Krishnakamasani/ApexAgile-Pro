from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.story import UserStoryUpdate, UserStoryStatusUpdate, UserStoryResponse, UserStoryWithTasksResponse
from app.schemas.task import TaskCreate, TaskResponse
from app.services.story_service import StoryService
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/v1/stories", tags=["User Stories"])

@router.get("/{story_id}", response_model=UserStoryWithTasksResponse, summary="Get user story with nested tasks")
def get_story(story_id: int, db: Session = Depends(get_db)):
    story = StoryService.get_story_by_id(db, story_id)
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Story {story_id} not found")

    tasks = story.tasks
    task_count = len(tasks)
    done_count = sum(1 for t in tasks if t.status == "DONE")
    prog = round((done_count / task_count * 100), 1) if task_count > 0 else (100.0 if story.status == "DONE" else 0.0)

    return {
        "id": story.id,
        "project_id": story.project_id,
        "story_key": story.story_key,
        "title": story.title,
        "description": story.description,
        "acceptance_criteria": story.acceptance_criteria,
        "attachments": story.attachments or [],
        "points": story.points,
        "priority": story.priority,
        "status": story.status,
        "assignee_id": story.assignee_id,
        "order_idx": story.order_idx,
        "created_at": story.created_at,
        "updated_at": story.updated_at,
        "assignee": story.assignee,
        "tasks": tasks,
        "task_count": task_count,
        "completed_task_count": done_count,
        "progress_percentage": prog
    }

@router.put("/{story_id}", response_model=UserStoryResponse, summary="Update user story")
def update_story(story_id: int, story_in: UserStoryUpdate, db: Session = Depends(get_db)):
    updated = StoryService.update_story(db, story_id, story_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Story {story_id} not found")
    return updated

@router.patch("/{story_id}/status", response_model=UserStoryResponse, summary="Update user story status")
def update_story_status(story_id: int, status_in: UserStoryStatusUpdate, db: Session = Depends(get_db)):
    try:
        updated = StoryService.update_status(db, story_id, status_in.status)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Story {story_id} not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user story (cascade removes tasks)")
def delete_story(story_id: int, db: Session = Depends(get_db)):
    deleted = StoryService.delete_story(db, story_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Story {story_id} not found")
    return None

@router.post("/{story_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, summary="Create task under user story")
def create_task_for_story(story_id: int, task_in: TaskCreate, db: Session = Depends(get_db)):
    try:
        return TaskService.create_task(db, story_id, task_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
