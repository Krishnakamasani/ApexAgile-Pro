# Note on AI Usage & Engineering Judgment

## 1. Role of AI in Development

In accordance with the assignment guidelines:
> *"You may use AI tools during development. We are not evaluating whether you used AI, but how effectively you used them while demonstrating sound technical understanding."*

AI tools were utilized purposefully as a pair-programming multiplier to accelerate development across the following areas:

1. **Boilerplate & Code Scaffolding**:
   - Accelerating the generation of Pydantic schemas, SQLAlchemy relational model definitions, and REST router CRUD endpoints.
   - Drafting initial responsive CSS layouts and design token definitions.

2. **Test Suite Generation & Edge Case Discovery**:
   - Synthesizing comprehensive Pytest test fixtures, including in-memory SQLite isolation, hierarchy cascade deletion verifications, and exponential backoff timing validations.

3. **Documentation Synthesis**:
   - Generating clear Mermaid ER and Sequence diagrams to clearly convey technical architecture to evaluating engineers.

---

## 2. Engineering Judgment & Technical Oversight

While AI accelerated file generation, human architectural judgment guided every critical design decision:

- **Database Reliability Choice**: Enforcing `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` on SQLite connections because SQLite disables foreign keys by default.
- **Robust Async Worker Architecture**: Designing a persistent state machine (`PENDING` -> `PROCESSING` -> `RETRYING` -> `COMPLETED`/`FAILED`) with exponential backoff and simulated failure triggers, ensuring the async requirements were truly fault-tolerant rather than a simple unhandled thread.
- **Rollup Calculations**: Implementing calculated aggregations (story point velocities, task completion ratios) at the service layer to avoid dirty client-side arithmetic.
- **Single-Command Dual Distribution**: Configuring Vite build pipelines to output into FastAPI static directories, ensuring the project can be tested with one single command while retaining clean modular code.
