# Asynchronous Workflow, Worker Architecture & Failure Handling

## 1. Overview & Objective

The assignment requires:
> *"Include at least one asynchronous or background workflow (e.g., notifications, reminders, report generation, or background processing). Explain your design and handling of failures or retries."*

SprintSync provides a dedicated asynchronous worker engine capable of processing long-running computational jobs, generating analytical digests, and safely recovering from transient errors via an **exponential backoff retry policy**.

---

## 2. Asynchronous Architecture & Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Frontend
    participant API as FastAPI Router (/api/v1/jobs)
    participant DB as SQLite Storage (WAL)
    participant Worker as AsyncJobQueueWorker Pool
    participant Handler as Job Handler (e.g. SPRINT_REPORT)

    User->>API: POST /api/v1/jobs (type: SPRINT_REPORT, simulate_failure: true/false)
    API->>DB: INSERT INTO async_jobs (status: PENDING, progress: 0)
    API->>Worker: executor.submit(_execute_job_lifecycle, job_id)
    API-->>User: 202 Accepted (job_id, status: PENDING)

    Worker->>DB: UPDATE async_jobs SET status = 'PROCESSING', started_at = NOW
    
    loop Incremental Execution & Progress Updates
        Worker->>Handler: execute step
        Handler->>DB: UPDATE async_jobs SET progress = 15% -> 40% -> 70% -> 95%
        User->>API: GET /api/v1/jobs/{job_id} (Polling every 1.5s)
        API-->>User: Status: PROCESSING, Progress: 40%
    end

    alt Success Execution
        Handler-->>Worker: Return result JSON
        Worker->>DB: UPDATE async_jobs SET status = 'COMPLETED', progress = 100%, result = JSON
        User->>API: GET /api/v1/jobs/{job_id}
        API-->>User: Status: COMPLETED, progress: 100%, Result Artifact available
    else Error Encountered & Retries Remaining (retry_count < max_retries)
        Handler-->>Worker: Exception raised (e.g. ConnectionResetError)
        Worker->>Worker: Calculate backoff: delay = base * (2 ^ retry_count)
        Worker->>DB: UPDATE async_jobs SET status = 'RETRYING', retry_count += 1
        Worker->>Worker: sleep(delay)
        Worker->>Handler: Re-attempt execution
    else Max Retries Exhausted (Dead-Letter State)
        Worker->>DB: UPDATE async_jobs SET status = 'FAILED', error_message = traceback
        User->>API: User clicks "Retry Now"
        API->>Worker: retry_job(job_id) -> resets status to PENDING and restarts
    end
```

---

## 3. Real-World Background Workflows Implemented

SprintSync implements two background workflows:

### A. Asynchronous Sprint Digest & Executive Report (`SPRINT_REPORT`)
- **Purpose**: Aggregates all hierarchical work items (Project -> Stories -> Tasks), calculates story point velocity, estimated vs logged hours variance, and compiles executive insights.
- **Why Asynchronous?**: Avoids blocking HTTP worker threads when computing multi-project aggregates, formatting report artifacts, or performing external webhook distributions.
- **Progress Tracking**: Real-time progress updates are emitted at key computational stages (15% -> 40% -> 70% -> 95% -> 100%).

### B. Team Workload & Bottleneck Risk Scanner (`WORKLOAD_AUDIT`)
- **Purpose**: Traverses all active stories and sub-tasks to detect capacity bottlenecks (e.g., developers with > 20 estimated hours) or unassigned high-priority work.

---

## 4. Failure Handling & Exponential Backoff Policy

Resiliency is enforced by `app.workers.failure_policy.FailurePolicy`:

### Exponential Backoff Formula
$$\text{delay} = \min\left(\text{max\_delay},\, \text{base\_seconds} \times 2^{\text{retry\_count}}\right)$$

Where:
- $\text{base\_seconds} = 2.0\text{ seconds}$
- $\text{max\_delay} = 60.0\text{ seconds}$
- $\text{DEFAULT\_MAX\_RETRIES} = 3$

| Attempt Number | Retry Count | Backoff Delay Before Next Attempt |
|---|---|---|
| Attempt 1 (Initial failure) | 1 | $2.0 \times 2^0 = 2.0\text{ seconds}$ |
| Attempt 2 (Second failure) | 2 | $2.0 \times 2^1 = 4.0\text{ seconds}$ |
| Attempt 3 (Third failure) | 3 | $2.0 \times 2^2 = 8.0\text{ seconds}$ |
| Attempt 4 (Final failure) | 4 | Max retries exceeded $\rightarrow$ Transitions to `FAILED` |

---

## 5. Verifying the Failure & Retry Mechanism in the UI

To make evaluation easy and verifiable:
1. Open the **Async Jobs** drawer in the UI (top navigation bar).
2. Check the box: **"Simulate Failure & Automatic Retry"**.
3. Click **"Generate Sprint Digest"**.
4. Observe the worker:
   - Attempt 1 starts $\rightarrow$ encounters simulated transient error $\rightarrow$ switches status to `RETRYING (Attempt 1)` with amber pulsing badge.
   - Waits for exponential backoff (2.0s).
   - Attempt 2 runs $\rightarrow$ encounters simulated error $\rightarrow$ switches to `RETRYING (Attempt 2)`.
   - Waits for exponential backoff (4.0s).
   - Attempt 3 runs $\rightarrow$ recovers and transitions to `COMPLETED (100%)`!
5. If max retries are exceeded, the job transitions to `FAILED` (Dead-letter state), displays the stack trace, and exposes a **"Retry Now"** button for immediate manual recovery.
