# REST API Reference Documentation

Interactive OpenAPI documentation is available live at:
- **Swagger UI**: `http://127.0.0.1:8001/docs`
- **ReDoc**: `http://127.0.0.1:8001/redoc`
- **OpenAPI JSON**: `http://127.0.0.1:8001/openapi.json`

Base Path: `/api/v1`

---

## Authentication

`POST /api/v1/auth/login` and `POST /api/v1/auth/register` return an opaque bearer token. Send it on protected requests:

```http
Authorization: Bearer <access_token>
```

Tokens expire after seven days. `GET /api/v1/auth/me` returns the signed-in user and `POST /api/v1/auth/logout` revokes the current token. The health endpoint, authentication endpoints, and read-only team directory are public; project, story, task, job, analytics, audit, and team-write endpoints require a valid session.

---

## 1. Projects API (`/api/v1/projects`)

### `GET /api/v1/projects`
List all projects with calculated rollup metrics (story counts, points, completion %).
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "key": "CORE",
    "name": "SprintSync Cloud Platform",
    "description": "Core multi-tenant web application...",
    "status": "ACTIVE",
    "target_date": "2026-12-15T00:00:00Z",
    "total_stories": 5,
    "done_stories": 2,
    "total_points": 24,
    "completed_points": 8,
    "total_tasks": 11,
    "done_tasks": 5,
    "progress_percentage": 33.3
  }
]
```

### `POST /api/v1/projects`
Create a new project.
- **Request Body**:
```json
{
  "key": "MOB",
  "name": "Mobile Companion App",
  "description": "iOS and Android client",
  "status": "ACTIVE"
}
```
- **Response**: `201 Created`

### `GET /api/v1/projects/{project_id}`
Get full project hierarchy with nested user stories and tasks.
- **Response**: `200 OK`

### `PUT /api/v1/projects/{project_id}`
Update project attributes.
- **Response**: `200 OK`

### `DELETE /api/v1/projects/{project_id}`
Delete project and all its child user stories and tasks via database cascade.
- **Response**: `204 No Content`

### `POST /api/v1/projects/{project_id}/stories`
Create a user story under a specific project.
- **Request Body**:
```json
{
  "title": "Interactive Kanban Board",
  "description": "Visual drag-and-drop workflow",
  "acceptance_criteria": "1. Multi-column grid.\n2. Story points sum.",
  "points": 5,
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "assignee_id": 3,
  "attachments": [
    {
      "name": "wireframe.jpg",
      "data_url": "data:image/jpeg;base64,<compressed-image-data>"
    }
  ]
}
```
- `attachments` is optional and accepts up to three compressed PNG, JPEG, or WebP images per story or task. Each image is limited to 400 KB after compression.
- **Response**: `201 Created`

---

## 2. User Stories API (`/api/v1/stories`)

### `GET /api/v1/stories/{story_id}`
Get a user story with its nested tasks and progress statistics.
- **Response**: `200 OK`

### `PUT /api/v1/stories/{story_id}`
Update user story fields.
- **Response**: `200 OK`

### `PATCH /api/v1/stories/{story_id}/status`
Quick status update (used by Kanban board).
- **Request Body**:
```json
{
  "status": "DONE"
}
```
- **Response**: `200 OK`

### `DELETE /api/v1/stories/{story_id}`
Delete user story and cascade delete child tasks.
- **Response**: `204 No Content`

### `POST /api/v1/stories/{story_id}/tasks`
Create a sub-task under this user story.
- **Request Body**:
```json
{
  "title": "Configure SQLite foreign key pragmas",
  "description": "Ensure PRAGMA foreign_keys=ON on connect",
  "status": "TODO",
  "priority": "HIGH",
  "estimated_hours": 3.0,
  "logged_hours": 0.0,
  "assignee_id": 4,
  "attachments": []
}
```
- **Response**: `201 Created`

---

## 3. Tasks API (`/api/v1/tasks`)

### `GET /api/v1/tasks/{task_id}`
Get task details.
- **Response**: `200 OK`

### `PUT /api/v1/tasks/{task_id}`
Update task details and log hours.
- **Response**: `200 OK`

### `PATCH /api/v1/tasks/{task_id}/status`
Advance or update task status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`).
- **Response**: `200 OK`

### `DELETE /api/v1/tasks/{task_id}`
Delete task.
- **Response**: `204 No Content`

---

## 4. Async Jobs API (`/api/v1/jobs`)

### `POST /api/v1/jobs`
Dispatch an asynchronous background job.
- **Request Body**:
```json
{
  "type": "SPRINT_REPORT",
  "project_id": 1,
  "simulate_failure": false
}
```
- **Response**: `202 Accepted`
```json
{
  "id": "e4f8d9b2-3c1a-4d7e-9021-a1b2c3d4e5f6",
  "type": "SPRINT_REPORT",
  "status": "PENDING",
  "progress": 0,
  "retry_count": 0,
  "max_retries": 3,
  "created_at": "2026-11-20T18:00:00Z"
}
```

### `GET /api/v1/jobs`
List recent background jobs.
- **Response**: `200 OK`

### `GET /api/v1/jobs/{job_id}`
Poll job progress (0–100%), current status, and results/error logs.
- **Response**: `200 OK`

### `POST /api/v1/jobs/{job_id}/retry`
Manually retry a failed or stalled background job.
- **Response**: `200 OK`

---

## 5. Analytics & Seeding API (`/api/v1/analytics`)

### `GET /api/v1/analytics/overview`
Get sprint velocity, status breakdown, and team workload capacity.
- **Query Params**: `project_id` (optional)
- **Response**: `200 OK`

### `POST /api/v1/analytics/seed`
Seed database with realistic demo team, projects, stories, and tasks.
- **Query Params**: `force=true` (optional, to wipe and reset)
- **Response**: `200 OK`

---

## 6. Audit & Health APIs

### `GET /api/v1/audit`
Get chronological audit log entries.
- **Response**: `200 OK`

### `GET /api/v1/health`
Health check status.
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "SprintSync - Agile Project Management API",
  "version": "1.0.0",
  "database": "sqlite_connected"
}
```
