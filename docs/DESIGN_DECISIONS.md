# Design Decisions & Architectural Tradeoffs

## 1. Backend Stack: FastAPI & Python 3 vs. Node.js / Express

### Decision:
We selected **FastAPI** paired with **SQLAlchemy 2.0** and **Pydantic v2**.

### Tradeoffs & Rationale:
- **Automatic OpenAPI / Swagger Specification**: FastAPI natively generates dynamic interactive API documentation (`/docs` and `/redoc`) directly from Pydantic types without manual annotations or third-party YAML files.
- **Type Safety & Data Validation**: Pydantic v2 provides compiled Rust-backed validation (`pydantic-core`), ensuring requests and responses conform to rigorous schema boundaries.
- **Native Async & Threading**: Python's `concurrent.futures.ThreadPoolExecutor` provides seamless thread-safe concurrency for background workers alongside asynchronous HTTP handlers.

---

## 2. Database: SQLite with WAL & Foreign Keys vs. PostgreSQL

### Decision:
We utilized **SQLite** configured with **Write-Ahead Logging (WAL)** and explicit foreign key enforcement.

### Tradeoffs & Rationale:
- **Zero-Friction Evaluation**: SQLite requires zero external server setup, credentials, or container dependencies, making it 100% turnkey for code reviewers across Windows, macOS, and Linux.
- **Production-Minded SQLite Configurations**:
  - `PRAGMA foreign_keys = ON`: SQLite disables foreign keys by default. We attached a SQLAlchemy engine connection event listener to enforce strict referential integrity and cascading deletes.
  - `PRAGMA journal_mode = WAL`: Solves SQLite's traditional write-lock bottleneck, permitting simultaneous background worker writes and high-concurrency API reads.
- **Tradeoff**: While SQLite is ideal for teams of 3–10 users, for enterprise multi-datacenter deployments with horizontal API scaling, transitioning to PostgreSQL requires simply altering the `DATABASE_URL` environment variable thanks to SQLAlchemy ORM abstraction.

---

## 3. Asynchronous Worker: In-Process ThreadPool vs. Redis / Celery / BullMQ

### Decision:
An **in-process thread pool worker (`concurrent.futures.ThreadPoolExecutor`)** integrated with SQLite database persistence.

### Tradeoffs & Rationale:
- **Dependency Isolation**: Introducing Celery or BullMQ requires running external Redis or RabbitMQ daemons, introducing networking barriers and setup complexity for local evaluation.
- **Full State Persistence**: Unlike simple fire-and-forget in-memory queues, our design writes task state (`PENDING`, `PROCESSING`, `RETRYING`, `COMPLETED`, `FAILED`), progress percentages, and error stack traces to persistent storage.
- **Resilient Recovery**: Implements full exponential backoff and dead-letter tracking, matching the architectural patterns of enterprise task brokers.

---

## 4. Frontend Architecture: Single Page Application with Embedded Static Serving

### Decision:
React 18 with Vite, designed to compile directly into `backend/static/` while retaining full standalone development server capabilities (`npm run dev`).

### Tradeoffs & Rationale:
- **Dual Developer Experience**:
  1. **Turnkey Production Mode**: Running `python run.py` serves both the backend API and the fully compiled UI from a single unified port (`8001`), eliminating CORS configuration issues.
  2. **Modern Development Mode**: Running `npm run dev` in `frontend/` proxies API traffic to `:8001` with hot module replacement (HMR).
- **Zero External UI Bloat**: Built with vanilla CSS and design tokens, avoiding bulky component libraries while maintaining clean visual aesthetics.
