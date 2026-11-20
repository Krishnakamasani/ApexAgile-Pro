# Security Considerations & Hardening

## 1. Input Validation & Strict Schema Boundaries

- **Pydantic v2 Strong Typing**: All API endpoints use typed Pydantic models with min/max length boundaries, regex validation, and integer bounds (`points: 1..100`, `estimated_hours >= 0.0`).
- **Payload Size Control**: FastAPI and Starlette limit request sizes to prevent denial-of-service (DoS) via excessively large JSON bodies.

---

## 2. SQL Injection Immunity

- **Parameterized Queries**: All database queries are executed through **SQLAlchemy 2.0 ORM**, which utilizes parameterized statements and automatic type casting. Raw SQL strings and manual concatenation are strictly forbidden.
- **Relational Integrity**: Foreign key constraints and cascade delete rules are enforced directly by the database engine (`PRAGMA foreign_keys = ON`), preventing orphaned or corrupt records.

---

## 3. Cross-Origin Resource Sharing (CORS)

- **Configurable Origins**: Controlled via `app.config.CORS_ORIGINS`. In development, permits local origins (`localhost:3000`, `localhost:5173`, `localhost:8000`, `localhost:8001`).
- **Production Setting**: Easily configured via the `CORS_ORIGINS` environment variable to restrict cross-site requests to verified domain origins.

---

## 4. Error Masking & Stack Trace Protection

- **User-Facing Responses**: Production endpoints intercept unhandled exceptions and return standardized error objects (`{"detail": "..."}`) with appropriate HTTP status codes (`400`, `404`, `422`, `500`).
- **Internal Audit Log**: Detailed Python tracebacks and error details are isolated within the `async_jobs.error_message` column and server logs for administrative debugging without leaking system internals to unauthenticated clients.

---

## 5. Authentication & Session Handling

- Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes; plaintext passwords are not persisted.
- Opaque bearer tokens are stored as SHA-256 digests, expire after seven days, and are revoked on sign-out.
- Project, story, task, job, analytics, audit, and team-write APIs require a valid bearer session. Login, registration, health, and the read-only team directory remain public.
- Existing databases are migrated on startup. Users present before the password-hash column was added receive the documented demo password `password123`; change these credentials before using real data.

## 6. Remaining Production Hardening

The following are not implemented and are needed before a public enterprise deployment:
1. **Role-Based Access Control (RBAC)**:
   - `PRODUCT_OWNER`: Create/archive projects, manage sprint dates.
   - `SCRUM_MASTER`: Manage story points, trigger async reports and health scans.
   - `DEVELOPER` / `QA`: Update task statuses and log hours.
2. **Rate Limiting**: Add account/IP-based throttling for login and registration.
3. **Secret Management & Transport**: Serve over HTTPS and configure explicit CORS origins instead of wildcard access.
