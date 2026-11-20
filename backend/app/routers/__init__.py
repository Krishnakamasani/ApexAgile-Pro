from app.routers.projects import router as projects_router
from app.routers.stories import router as stories_router
from app.routers.tasks import router as tasks_router
from app.routers.users import router as users_router
from app.routers.jobs import router as jobs_router
from app.routers.analytics import router as analytics_router
from app.routers.audit import router as audit_router
from app.routers.auth import router as auth_router

__all__ = [
    "projects_router",
    "stories_router",
    "tasks_router",
    "users_router",
    "jobs_router",
    "analytics_router",
    "audit_router",
    "auth_router"
]
