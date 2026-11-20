import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import inspect, text
from fastapi import Depends

from app.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION, CORS_ORIGINS
from app.database import engine, Base, SessionLocal
from app.services.auth_service import hash_password
from app.services.auth_service import get_current_user
from app.services.seed_service import seed_database_if_empty
from app.routers import (
    projects_router,
    stories_router,
    tasks_router,
    users_router,
    jobs_router,
    analytics_router,
    audit_router,
    auth_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create SQLite tables and initialize seed data if empty
    Base.metadata.create_all(bind=engine)
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "password_hash" not in user_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(256)"))
            connection.execute(
                text("UPDATE users SET password_hash = :password_hash WHERE password_hash IS NULL"),
                {"password_hash": hash_password("password123")}
            )
    with engine.begin() as connection:
        for table_name in ("user_stories", "tasks"):
            columns = {column["name"] for column in inspect(engine).get_columns(table_name)}
            if "attachments" not in columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN attachments JSON"))
            connection.execute(
                text(f"UPDATE {table_name} SET attachments = '[]' WHERE attachments IS NULL")
            )
    db = SessionLocal()
    try:
        seed_database_if_empty(db, force=False)
    finally:
        db.close()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router)
app.include_router(projects_router, dependencies=[Depends(get_current_user)])
app.include_router(stories_router, dependencies=[Depends(get_current_user)])
app.include_router(tasks_router, dependencies=[Depends(get_current_user)])
app.include_router(users_router)
app.include_router(jobs_router, dependencies=[Depends(get_current_user)])
app.include_router(analytics_router, dependencies=[Depends(get_current_user)])
app.include_router(audit_router, dependencies=[Depends(get_current_user)])

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "database": "sqlite_connected"
    }

# Static file serving for compiled React/Frontend if available
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
