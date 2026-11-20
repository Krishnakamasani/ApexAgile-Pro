# Future Improvements & Roadmap

If allocated more time, the following enhancements would be prioritized to expand SprintSync from a small-team tool into a full-scale agile platform:

---

## 1. Real-Time Multi-User Collaboration via WebSockets / SSE

- **Current State**: Client polls `/api/v1/jobs` every 1.5s while the async drawer is open; project data refreshes on user actions.
- **Improvement**: Implement FastAPI WebSockets or Server-Sent Events (SSE). When any team member transitions a task or creates a story, a message is broadcast over a Redis pub/sub channel to all connected team clients, updating Kanban columns and tree views in real time.

---

## 2. Interactive Sprint Burndown & Burnup Charts

- **Current State**: High-level numerical progress, velocity percentage, and completion ratios.
- **Improvement**: Add an interactive daily Burndown Chart tracking ideal vs actual story point velocity across a 2-week sprint timeline using Chart.js or Recharts.

---

## 3. Production Task Queue Migration (Celery / BullMQ)

- **Current State**: ThreadPoolExecutor with SQLite persistence (ideal for single-node deployments).
- **Improvement**: For distributed multi-server deployments, extract the worker into independent Celery or BullMQ worker containers backed by Redis, enabling dedicated horizontal autoscaling of worker pods.

---

## 4. Native Drag-and-Drop Kanban Interaction

- **Current State**: Accessible single-click forward/backward transition arrows and quick status dropdowns.
- **Improvement**: Integrate `@hello-pangea/dnd` (or HTML5 Drag & Drop API) for smooth card drag-and-drop across columns with optimistic UI reordering.

---

## 5. Version Control & CI/CD Integrations (GitHub / GitLab Webhooks)

- **Improvement**: Add webhook listener endpoints (e.g. `POST /api/v1/webhooks/github`) that parse commit messages and pull requests (e.g. `Fixes CORE-1-T2`), automatically advancing task status to `IN_REVIEW` or `DONE`.

---

## 6. S3 Storage & Formal PDF Report Export

- **Current State**: Generated sprint reports are stored as JSON artifacts viewable in the UI drawer.
- **Improvement**: Integrate `WeasyPrint` or `ReportLab` to render styled PDF sprint certificates uploaded to AWS S3 with signed download URLs.
