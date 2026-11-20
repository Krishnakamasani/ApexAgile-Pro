import pytest
from app.models.project import Project
from app.models.story import UserStory
from app.models.task import Task
from app.services.project_service import ProjectService
from app.services.story_service import StoryService
from app.services.task_service import TaskService
from app.schemas.project import ProjectCreate
from app.schemas.story import UserStoryCreate
from app.schemas.task import TaskCreate

def test_hierarchy_creation_and_cascade(db_session):
    """Verify that Project -> Story -> Task hierarchy creates correctly and cascade delete works."""
    # 1. Create Project
    p_in = ProjectCreate(key="TEST", name="Test Agile Project", description="Testing hierarchy")
    project = ProjectService.create_project(db_session, p_in)
    assert project.id is not None
    assert project.key == "TEST"

    # 2. Create User Story under Project
    s_in = UserStoryCreate(title="First Test Story", points=5, priority="HIGH", status="BACKLOG")
    story = StoryService.create_story(db_session, project.id, s_in)
    assert story.id is not None
    assert story.story_key == "TEST-1"
    assert story.project_id == project.id

    # 3. Create Task under Story
    t_in = TaskCreate(title="First Sub-task", estimated_hours=4.0, status="TODO")
    task = TaskService.create_task(db_session, story.id, t_in)
    assert task.id is not None
    assert task.task_key == "TEST-1-T1"
    assert task.story_id == story.id

    # 4. Verify rollup
    summary = ProjectService.get_project_detail(db_session, project.id)
    assert summary["total_stories"] == 1
    assert summary["total_tasks"] == 1
    assert summary["total_points"] == 5

    # 5. Delete project and verify cascade deletion of story and task
    deleted = ProjectService.delete_project(db_session, project.id)
    assert deleted is True

    # Check child items in DB
    remaining_story = db_session.query(UserStory).filter(UserStory.id == story.id).first()
    remaining_task = db_session.query(Task).filter(Task.id == task.id).first()
    assert remaining_story is None
    assert remaining_task is None

def test_story_status_transition(db_session):
    """Test updating user story status."""
    project = db_session.query(Project).first()
    story = db_session.query(UserStory).filter(UserStory.project_id == project.id).first()

    updated = StoryService.update_status(db_session, story.id, "DONE")
    assert updated.status == "DONE"

    # Invalid status should raise ValueError
    with pytest.raises(ValueError):
        StoryService.update_status(db_session, story.id, "INVALID_STATUS")
