from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectSummaryResponse, ProjectDetailResponse
from app.schemas.story import UserStoryCreate, UserStoryResponse
from app.services.project_service import ProjectService
from app.services.story_service import StoryService

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectSummaryResponse], summary="List all projects with rollup statistics")
def list_projects(db: Session = Depends(get_db)):
    return ProjectService.get_all_projects_summary(db)

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, summary="Create a new project")
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    try:
        return ProjectService.create_project(db, project_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{project_id}", response_model=ProjectDetailResponse, summary="Get project hierarchy with stories & tasks")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = ProjectService.get_project_detail(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse, summary="Update project")
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    updated = ProjectService.update_project(db, project_id, project_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return updated

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete project (cascade removes stories & tasks)")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    deleted = ProjectService.delete_project(db, project_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")
    return None

@router.post("/{project_id}/stories", response_model=UserStoryResponse, status_code=status.HTTP_201_CREATED, summary="Create user story under project")
def create_story_for_project(project_id: int, story_in: UserStoryCreate, db: Session = Depends(get_db)):
    try:
        return StoryService.create_story(db, project_id, story_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
