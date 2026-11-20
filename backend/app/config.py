import os
from pathlib import Path
from datetime import datetime, timezone

def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'agile_pm.db'}")

# App Settings
APP_TITLE = "ApexAgile Pro - Enterprise Agile PMS"
APP_DESCRIPTION = (
    "Production-minded Full-Stack Agile Project Management Tool for Teams (3-10 users). "
    "Features hierarchical work tracking (Project -> User Story -> Task), status rollups, "
    "and a resilient asynchronous background workflow engine with exponential backoff & failure recovery."
)
APP_VERSION = "1.0.0"

# Async Worker Settings
MAX_WORKER_THREADS = int(os.getenv("MAX_WORKER_THREADS", "3"))
DEFAULT_MAX_RETRIES = int(os.getenv("DEFAULT_MAX_RETRIES", "3"))
BASE_RETRY_BACKOFF_SECONDS = float(os.getenv("BASE_RETRY_BACKOFF_SECONDS", "2.0"))

# CORS
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "*"
]
