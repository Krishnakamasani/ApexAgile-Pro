from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.task import TaskUpdate, TaskStatusUpdate, TaskResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])

@router.get("/{task_id}", response_model=TaskResponse, summary="Get task by ID")
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = TaskService.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse, summary="Update task details")
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    updated = TaskService.update_task(db, task_id, task_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found")
    return updated

@router.patch("/{task_id}/status", response_model=TaskResponse, summary="Update task status")
def update_task_status(task_id: int, status_in: TaskStatusUpdate, db: Session = Depends(get_db)):
    try:
        updated = TaskService.update_status(db, task_id, status_in.status)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete task")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    deleted = TaskService.delete_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found")
    return None
