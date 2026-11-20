def test_health_endpoint(client):
    """Test health check API."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_projects_crud_endpoints(client):
    """Test listing and creating projects."""
    # 1. List seeded projects
    res = client.get("/api/v1/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 1

    # 2. Create new project
    payload = {
        "key": "DEV",
        "name": "Developer Experience Enhancement",
        "description": "Tooling and CI/CD upgrades",
        "status": "ACTIVE"
    }
    create_res = client.post("/api/v1/projects", json=payload)
    assert create_res.status_code == 201
    created_prj = create_res.json()
    assert created_prj["key"] == "DEV"

    # 3. Create Story under this Project
    story_payload = {
        "title": "Setup Automated Integration Test Pipeline",
        "points": 5,
        "priority": "HIGH",
        "status": "TODO"
    }
    story_res = client.post(f"/api/v1/projects/{created_prj['id']}/stories", json=story_payload)
    assert story_res.status_code == 201
    created_story = story_res.json()
    assert created_story["story_key"] == "DEV-1"

    # 4. Update Story Status
    patch_res = client.patch(f"/api/v1/stories/{created_story['id']}/status", json={"status": "IN_PROGRESS"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"

    # 5. Create Task under Story
    task_payload = {
        "title": "Configure GitHub Actions runner",
        "estimated_hours": 3.0,
        "status": "TODO"
    }
    task_res = client.post(f"/api/v1/stories/{created_story['id']}/tasks", json=task_payload)
    assert task_res.status_code == 201
    created_task = task_res.json()
    assert created_task["task_key"] == "DEV-1-T1"

def test_analytics_and_seed_endpoint(client):
    """Test sprint metrics and seed endpoint."""
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_projects" in data
    assert "team_workloads" in data
    assert len(data["team_workloads"]) > 0

def test_login_rejects_incorrect_password_and_accepts_demo_password(client):
    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"email": "sarah.connor@sprintsync.io", "password": "not-the-password"}
    )
    assert wrong_password.status_code == 401

    valid_password = client.post(
        "/api/v1/auth/login",
        json={"email": "sarah.connor@sprintsync.io", "password": "password123"}
    )
    assert valid_password.status_code == 200
    assert valid_password.json()["user"]["email"] == "sarah.connor@sprintsync.io"

def test_registered_user_must_use_the_password_they_chose(client):
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Taylor Morgan",
            "email": "taylor@example.com",
            "password": "a-secure-passphrase",
            "role": "DEVELOPER"
        }
    )
    assert registration.status_code == 201

    invalid_login = client.post(
        "/api/v1/auth/login",
        json={"email": "taylor@example.com", "password": "password123"}
    )
    assert invalid_login.status_code == 401

    valid_login = client.post(
        "/api/v1/auth/login",
        json={"email": "taylor@example.com", "password": "a-secure-passphrase"}
    )
    assert valid_login.status_code == 200

def test_protected_routes_require_a_valid_session(client):
    authorization = client.headers.pop("Authorization")
    assert client.get("/api/v1/projects").status_code == 401

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "sarah.connor@sprintsync.io", "password": "password123"}
    )
    token = login.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    assert client.get("/api/v1/projects").status_code == 200

    assert client.post("/api/v1/auth/logout").status_code == 204
    assert client.get("/api/v1/projects").status_code == 401
    client.headers.update({"Authorization": authorization})

def test_story_image_attachments_are_validated_and_persisted(client):
    project = client.get("/api/v1/projects").json()[0]
    payload = {
        "title": "Design review",
        "attachments": [{
            "name": "review.png",
            "data_url": "data:image/png;base64,iVBORw0KGgo="
        }]
    }

    created = client.post(
        f"/api/v1/projects/{project['id']}/stories",
        json=payload
    )
    assert created.status_code == 201
    assert created.json()["attachments"][0]["name"] == "review.png"

    detail = client.get(f"/api/v1/projects/{project['id']}").json()
    persisted_story = next(story for story in detail["stories"] if story["title"] == "Design review")
    assert persisted_story["attachments"] == payload["attachments"]

    created_task = client.post(
        f"/api/v1/stories/{created.json()['id']}/tasks",
        json={"title": "Review image", "attachments": payload["attachments"]}
    )
    assert created_task.status_code == 201
    story_detail = client.get(f"/api/v1/stories/{created.json()['id']}").json()
    assert story_detail["tasks"][0]["attachments"] == payload["attachments"]

    invalid = client.post(
        f"/api/v1/projects/{project['id']}/stories",
        json={
            "title": "Invalid attachment",
            "attachments": [{
                "name": "notes.txt",
                "data_url": "data:text/plain;base64,SGVsbG8="
            }]
        }
    )
    assert invalid.status_code == 422
