from datetime import timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.project import Project
from app.models.story import UserStory
from app.models.task import Task
from app.models.audit import AuditLog
from app.config import utc_now
from app.services.auth_service import hash_password

def seed_database_if_empty(db: Session, force: bool = False):
    """Seed realistic agile team and hierarchical project data."""
    if not force and db.query(Project).count() > 0:
        return {"status": "skipped", "message": "Database already contains project data."}

    if force:
        # Clear existing data in cascade order
        db.query(Task).delete()
        db.query(UserStory).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.query(AuditLog).delete()
        db.commit()

    # 1. Create Agile Team (Small team: 6 members)
    users_data = [
        {"name": "Sarah Connor", "email": "sarah.connor@sprintsync.io", "role": "PRODUCT_OWNER", "avatar_color": "#8B5CF6"},
        {"name": "Alex Rivera", "email": "alex.rivera@sprintsync.io", "role": "SCRUM_MASTER", "avatar_color": "#EC4899"},
        {"name": "David Chen", "email": "david.chen@sprintsync.io", "role": "DEVELOPER", "avatar_color": "#3B82F6"},
        {"name": "Elena Rostova", "email": "elena.rostova@sprintsync.io", "role": "DEVELOPER", "avatar_color": "#10B981"},
        {"name": "Marcus Vance", "email": "marcus.vance@sprintsync.io", "role": "QA_ENGINEER", "avatar_color": "#F59E0B"},
        {"name": "Priya Sharma", "email": "priya.sharma@sprintsync.io", "role": "DESIGNER", "avatar_color": "#6366F1"}
    ]
    created_users = []
    for u in users_data:
        user = User(
            name=u["name"],
            email=u["email"],
            password_hash=hash_password("password123"),
            role=u["role"],
            avatar_color=u["avatar_color"]
        )
        db.add(user)
        created_users.append(user)
    db.commit()
    for u in created_users:
        db.refresh(u)

    u_po, u_sm, u_dev1, u_dev2, u_qa, u_des = created_users

    # 2. Create Projects
    p1 = Project(
        key="CORE",
        name="SprintSync Cloud Platform",
        description="Core multi-tenant web application supporting agile sprint planning, real-time board, and analytics.",
        status="ACTIVE",
        target_date=utc_now() + timedelta(days=21)
    )
    p2 = Project(
        key="MOB",
        name="Mobile Companion App (iOS & Android)",
        description="Cross-platform lightweight mobile client for fast standup updates and push notifications.",
        status="ACTIVE",
        target_date=utc_now() + timedelta(days=45)
    )
    db.add_all([p1, p2])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)

    # 3. Create User Stories for Project 1 (CORE)
    s1 = UserStory(
        project_id=p1.id,
        story_key=f"{p1.key}-1",
        title="Interactive Kanban Board with Drag & Drop Transitions",
        description="As a developer, I want to visualize and update task status columns smoothly so the team has clear work visibility.",
        acceptance_criteria="1. Columns for Backlog, In Progress, In Review, Done.\n2. Story points total calculated dynamically per column.\n3. Responsive on desktop and tablet viewport.",
        points=5,
        priority="HIGH",
        status="IN_PROGRESS",
        assignee_id=u_dev1.id,
        order_idx=0
    )
    s2 = UserStory(
        project_id=p1.id,
        story_key=f"{p1.key}-2",
        title="Asynchronous Sprint Digest & PDF Report Worker",
        description="As a Scrum Master, I want to trigger async report generation that compiles story progress and team velocity in the background.",
        acceptance_criteria="1. Non-blocking asynchronous job dispatch.\n2. Progress polling with exponential backoff on retry.\n3. Downloadable JSON/HTML sprint summary.",
        points=8,
        priority="CRITICAL",
        status="IN_PROGRESS",
        assignee_id=u_dev2.id,
        order_idx=1
    )
    s3 = UserStory(
        project_id=p1.id,
        story_key=f"{p1.key}-3",
        title="Role-Based Team Assignment and Workload Meter",
        description="As a Product Owner, I want to see assigned story points and logged hours across all team members to balance workloads.",
        acceptance_criteria="1. Breakdown of assigned stories and tasks per user.\n2. Visual progress bars comparing estimated vs logged hours.\n3. Highlight overloaded developers.",
        points=3,
        priority="MEDIUM",
        status="DONE",
        assignee_id=u_po.id,
        order_idx=2
    )
    s4 = UserStory(
        project_id=p1.id,
        story_key=f"{p1.key}-4",
        title="Hierarchical Work Item Tree View",
        description="As a team member, I want to view the full hierarchy (Project -> Story -> Task) in an expandable accordion tree with quick inline creation.",
        acceptance_criteria="1. Expand/collapse individual stories.\n2. Show nested tasks with status badges.\n3. Quick task creation directly under target story.",
        points=5,
        priority="HIGH",
        status="DONE",
        assignee_id=u_dev1.id,
        order_idx=3
    )
    s5 = UserStory(
        project_id=p1.id,
        story_key=f"{p1.key}-5",
        title="Automated Sprint Bottleneck & Overdue Risk Detector",
        description="As a Scrum Master, I want automated background alerts when high-priority tasks remain in progress near sprint deadlines.",
        acceptance_criteria="1. Automated scanner identifies stalled in-progress items.\n2. Dispatches notifications to assigned owners.\n3. Logs audit trail.",
        points=3,
        priority="LOW",
        status="BACKLOG",
        assignee_id=u_sm.id,
        order_idx=4
    )

    db.add_all([s1, s2, s3, s4, s5])
    db.commit()
    for s in [s1, s2, s3, s4, s5]:
        db.refresh(s)

    # 4. Create Tasks under Stories
    tasks = [
        # Under Story 1 (Kanban Board)
        Task(story_id=s1.id, task_key=f"{s1.story_key}-T1", title="Build multi-column grid layout with status counters", status="DONE", priority="MEDIUM", estimated_hours=4.0, logged_hours=4.0, assignee_id=u_dev1.id, order_idx=0),
        Task(story_id=s1.id, task_key=f"{s1.story_key}-T2", title="Implement quick status transition buttons and optimistic UI update", status="IN_PROGRESS", priority="HIGH", estimated_hours=6.0, logged_hours=3.5, assignee_id=u_dev1.id, order_idx=1),
        Task(story_id=s1.id, task_key=f"{s1.story_key}-T3", title="Perform QA testing on board drag interactions and keyboard navigation", status="TODO", priority="MEDIUM", estimated_hours=3.0, logged_hours=0.0, assignee_id=u_qa.id, order_idx=2),

        # Under Story 2 (Async Worker)
        Task(story_id=s2.id, task_key=f"{s2.story_key}-T1", title="Design AsyncJob SQLite schema and thread pool worker queue", status="DONE", priority="CRITICAL", estimated_hours=5.0, logged_hours=5.0, assignee_id=u_dev2.id, order_idx=0),
        Task(story_id=s2.id, task_key=f"{s2.story_key}-T2", title="Implement retry handler with exponential backoff delay calculation", status="IN_PROGRESS", priority="CRITICAL", estimated_hours=4.0, logged_hours=2.0, assignee_id=u_dev2.id, order_idx=1),
        Task(story_id=s2.id, task_key=f"{s2.story_key}-T3", title="Add job status polling endpoint and UI live progress drawer", status="TODO", priority="HIGH", estimated_hours=4.0, logged_hours=1.0, assignee_id=u_dev1.id, order_idx=2),

        # Under Story 3 (Workload Meter)
        Task(story_id=s3.id, task_key=f"{s3.story_key}-T1", title="Write SQL aggregation query for team member story and task counts", status="DONE", priority="MEDIUM", estimated_hours=3.0, logged_hours=2.5, assignee_id=u_dev2.id, order_idx=0),
        Task(story_id=s3.id, task_key=f"{s3.story_key}-T2", title="Design team workload card component with capacity indicators", status="DONE", priority="LOW", estimated_hours=3.0, logged_hours=3.0, assignee_id=u_des.id, order_idx=1),

        # Under Story 4 (Hierarchy Tree View)
        Task(story_id=s4.id, task_key=f"{s4.story_key}-T1", title="Create recursive tree node component for Project -> Story -> Task", status="DONE", priority="HIGH", estimated_hours=4.0, logged_hours=4.0, assignee_id=u_dev1.id, order_idx=0),
        Task(story_id=s4.id, task_key=f"{s4.story_key}-T2", title="Add modal trigger for inline task creation under specific story node", status="DONE", priority="MEDIUM", estimated_hours=2.5, logged_hours=2.5, assignee_id=u_dev1.id, order_idx=1),

        # Under Story 5 (Bottleneck Risk Detector)
        Task(story_id=s5.id, task_key=f"{s5.story_key}-T1", title="Define risk threshold heuristic based on remaining days vs uncompleted hours", status="TODO", priority="MEDIUM", estimated_hours=3.0, logged_hours=0.0, assignee_id=u_sm.id, order_idx=0)
    ]
    db.add_all(tasks)

    # 5. Add initial Audit Log
    db.add(AuditLog(
        entity_type="SYSTEM",
        entity_id="INIT",
        action="SEEDED_DATA",
        details="Generated production demo dataset with small agile team, hierarchical projects, user stories, and tasks."
    ))

    db.commit()
    return {
        "status": "success",
        "message": f"Seeded {len(created_users)} users, 2 projects, 5 user stories, and {len(tasks)} tasks."
    }
