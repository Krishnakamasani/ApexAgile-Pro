import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.services.seed_service import seed_database_if_empty

# In-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh isolated in-memory DB per test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    seed_database_if_empty(session, force=True)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Override FastAPI dependency to use test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        login = test_client.post(
            "/api/v1/auth/login",
            json={"email": "sarah.connor@sprintsync.io", "password": "password123"}
        )
        test_client.headers.update({"Authorization": f"Bearer {login.json()['access_token']}"})
        yield test_client
    app.dependency_overrides.clear()
