# ⚡ ApexAgile Pro - Enterprise Agile Project Management Tool

> **Full-Stack Assignment: Agile Project Management Tool for a Small Team (3–10 users)**  
> Built with **React 18**, **FastAPI (Python 3.13)**, **SQLAlchemy 2.0**, and **SQLite (WAL mode)**.  
> Includes modern **Login & Authentication**, an **Executive Sprint Dashboard with Burndown Charts**, strict hierarchical work tracking (**Project ➔ User Story ➔ Task**), live Kanban board, sprint analytics, and a resilient **Asynchronous Background Processing Engine with Exponential Backoff & Failure Recovery**.

---

## 🌟 Executive Summary & Features

**ApexAgile Pro** is a modern SaaS agile project management application engineered for small engineering teams to plan sprints, track work across strict hierarchies, monitor capacity, and run background analytical workflows.

- **🔐 Modern Authentication & 1-Click Demo Logins**:
  - Split-screen login with a custom ApexAgile logo, layered local artwork, and a user-controlled motion-slide showcase.
  - Sign In & Register tab switcher.
  - **1-Click Quick Demo Login** as Product Owner (Sarah Connor), Scrum Master (Alex Rivera), Lead Developer (David Chen), or Senior Developer (Elena Rostova).
  - Salted PBKDF2 password hashes, expiring bearer sessions, protected work APIs, and sign-out session revocation.
  - Registration signs the new account in immediately; sign-out, deletion, and demo reset use clear in-app confirmations and notifications.
- **📊 Executive Sprint Dashboard**:
  - **Interactive Sprint Burndown Chart** (SVG line chart plotting ideal vs actual story point burn rate).
  - Interactive Three.js WebGL sprint landscape with drag rotation and clickable workflow lanes.
  - Context-specific 3D hierarchy, Kanban flow, team-capacity, and audit visualizations, with animated transitions and atmospheric backgrounds.
  - 4 KPI Stat Cards (Velocity %, Story Points Burndown, Total Stories, Sub-tasks Execution rate).
  - Quick Workflow Navigation Tiles and Active Sprint Stories feed.
- **⌕ Global Workspace Search & Navigation**:
  - Three-line menu provides access to every workspace view at all screen sizes.
  - Search team members, projects, stories, and tasks; selecting a match opens and highlights its workspace location.
- **📌 Strict Work Hierarchy (`Project ➔ User Story ➔ Task`)**:
  - Relational cascade deletion (`PRAGMA foreign_keys = ON`). Deleting a project automatically deletes child stories and tasks cleanly.
  - Collapsible story cards with story points (Fibonacci: 1, 2, 3, 5, 8, 13), priority pills, status dropdowns, acceptance criteria checklists, and inline `+ Task` creation.
  - Nested sub-tasks with estimated hours vs logged hours, assignee avatars, and 1-click status cycler.
  - Attach up to three compressed PNG, JPEG, or WebP reference images to each story or task.
- **📋 Agile Kanban Board**:
  - 4 Status Columns: `Backlog / Todo`, `In Progress`, `In Review`, `Done`.
  - View Mode Switcher: **User Stories Kanban** vs **Tasks Kanban**!
  - Column headers calculate real-time card counts and story points sum.
  - Fast Move buttons (`◀` Left and `▶` Right) on every card.
  - Dynamic filtering by Assignee and Priority level.
- **⚡ Asynchronous Background Workflow & Resilient Retries**:
  - In-process ThreadPool worker queue with SQLite state persistence (`PENDING` ➔ `PROCESSING` ➔ `RETRYING` ➔ `COMPLETED` / `FAILED`).
  - Real-time progress bar polling ($0\% \rightarrow 15\% \rightarrow 40\% \rightarrow 70\% \rightarrow 95\% \rightarrow 100\%$).
  - **Exponential Backoff Formula**: $\text{delay} = \min(60.0,\, 2.0 \times 2^{\text{retry\_count}})$.
  - **Simulate Failure & Retry Toggle**: Allows evaluators to test simulated transient failures and witness automatic exponential backoff retries and recovery live.
- **👥 Team Capacity & Workload Meters**:
  - Real-time capacity utilization meters detecting `BALANCED`, `AVAILABLE`, or `HIGH LOAD` states.
- **📜 Chronological Audit Trail**: Complete activity timeline of all work item modifications.
- **🚀 Turnkey Single-Command Execution**: Pre-compiled frontend served directly by FastAPI. Zero Node/npm setup needed to run!

---

## 🏗️ Architecture & Work Breakdown

```
[Project] ── (1:N) ──> [User Story] ── (1:N) ──> [Task]
```

```
apex-agile-pro/
│
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings, paths, worker configuration
│   │   ├── database.py           # SQLAlchemy engine, WAL mode, foreign keys pragma
│   │   ├── main.py               # FastAPI app, CORS, lifespan, static router
│   │   ├── models/               # SQLAlchemy Models (Project, Story, Task, Job, User, Audit)
│   │   ├── schemas/              # Pydantic v2 validation schemas
│   │   ├── routers/              # RESTful API Endpoints (/auth, /projects, /stories, /tasks, /jobs, /analytics, /audit)
│   │   ├── services/             # Business Logic & Rollup Calculations
│   │   └── workers/              # Async Worker Queue, Failure Policy, Handlers
│   ├── static/                   # Pre-compiled production React SPA (serves immediately)
│   ├── tests/                    # Pytest Unit & Integration test suite (11/11 passing)
│   ├── requirements.txt          # Python dependencies
│   └── run.py                    # 1-command backend launcher
│
├── frontend/
│   ├── public/                   # Local brand mark and atmospheric background artwork
│   ├── src/
│   │   ├── components/           # LoginPage, ExecutiveDashboard, Tree, Kanban, Analytics, Drawer, Modals
│   │   ├── api/client.js         # API client wrapper
│   │   ├── App.jsx               # Main state controller
│   │   └── index.css             # High-end SaaS design system
│   ├── package.json
│   └── vite.config.js
│
├── docs/                         # Detailed Submission Documentation
│   ├── ARCHITECTURE.md           # System architecture, C4 & Mermaid diagrams
│   ├── DATABASE_SCHEMA.md        # ER diagram, table schemas, cascade rules
│   ├── ASYNC_WORKFLOW.md         # Worker pool, retry policy, backoff math
│   ├── API_DOCUMENTATION.md      # REST API contracts & JSON payloads
│   ├── DESIGN_DECISIONS.md       # Architectural tradeoffs & technical rationale
│   ├── SECURITY_NOTES.md         # Input validation, SQL injection immunity, CORS
│   ├── AI_USAGE.md               # Note on AI usage & engineering judgment
│   └── FUTURE_IMPROVEMENTS.md    # What we would build next with more time
│
├── docker-compose.yml            # Docker deployment
├── Dockerfile                    # Container build file
├── run_all.bat                   # Windows 1-click startup script
└── run_all.sh                    # Unix 1-click startup script
```

---

## 🚀 Quickstart Guide (Run in 60 Seconds)

### Prerequisites:
- Python 3.10+ (tested on Python 3.13)

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Start the Application
Run the launcher from the project root:

**On Windows:**
```powershell
python backend/run.py
```
*(Or simply double-click `run_all.bat`)*

**On macOS / Linux:**
```bash
python3 backend/run.py
```
*(Or run `sh run_all.sh`)*

### 3. Open in Browser
- **Web Application UI**: [http://127.0.0.1:8001](http://127.0.0.1:8001)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- **Interactive ReDoc**: [http://127.0.0.1:8001/redoc](http://127.0.0.1:8001/redoc)
- Demo team accounts use the password `password123`. Use account registration for a personal password.

### Frontend Development

Run the backend and Vite frontend in separate terminals. Both use port `8001` for the backend by default. If another app already occupies it, set the same alternate `PORT` in both terminals:

```powershell
# Terminal 1: backend
py backend\run.py

# Terminal 2: frontend
Set-Location frontend
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Restart Vite after changing the proxy target.

---

## 🧪 Running Automated Tests

```bash
python -m pytest backend/tests -v
```

All 11 tests pass:
- `test_hierarchy_creation_and_cascade`: Verifies Project ➔ Story ➔ Task relational cascade deletion.
- `test_story_status_transition`: Verifies status transitions and invalid state rejections.
- `test_exponential_backoff_calculation`: Verifies backoff formula $\text{delay} = \text{base} \times 2^{\text{retry}}$ and capping.
- `test_retry_eligibility`: Validates retry boundaries against max retry limits.
- `test_async_job_execution`: Enqueues and validates non-blocking background report completion.
- `test_health_endpoint`: Validates API availability and SQLite connection.
- `test_projects_crud_endpoints`: Validates full Project/Story/Task CRUD cycle.
- `test_analytics_and_seed_endpoint`: Validates sprint analytics rollups and database seeding.
- Authentication tests: Verify password checking, registration credentials, and protected API session revocation.

---

## 📑 Assignment Submission Checklist Coverage

- [x] **Frontend application**: React 18 SPA with Login screen, Executive Dashboard, Tree hierarchy, Kanban board, Analytics & Async drawer.
- [x] **Backend APIs**: Modular FastAPI RESTful service with typed Pydantic v2 schemas and validation.
- [x] **Persistent storage**: SQLite with `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL`.
- [x] **Hierarchical work items**: Project ➔ User Story ➔ Task with status rollups and cascade deletion.
- [x] **Create, view, update, organize**: Full CRUD, status transitions, priority filtering, and team member assignment.
- [x] **Asynchronous background workflow**: Background report generation, progress polling, and exponential backoff retry.
- [x] **API documentation**: Interactive Swagger UI (`/docs`), ReDoc (`/redoc`), and `docs/API_DOCUMENTATION.md`.
- [x] **Clear README and project overview**: Full setup instructions, architecture notes, and test commands.
- [x] **Design decisions & tradeoffs**: Documented in `docs/DESIGN_DECISIONS.md`.
- [x] **Security considerations**: Documented in `docs/SECURITY_NOTES.md`.
- [x] **AI usage note**: Documented in `docs/AI_USAGE.md`.
- [x] **Future improvements**: Documented in `docs/FUTURE_IMPROVEMENTS.md`.
