import json
import logging
import traceback
import time
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.job import AsyncJob
from app.models.audit import AuditLog
from app.workers.failure_policy import FailurePolicy
from app.workers.handlers import HANDLERS
from app.config import MAX_WORKER_THREADS, utc_now

logger = logging.getLogger("SprintSync.JobQueue")

class AsyncJobQueueWorker:
    """
    Production-minded In-Process Asynchronous Job Queue and Worker Manager.
    Features:
    - Thread pool worker for non-blocking execution
    - Database-persisted job state (PENDING -> PROCESSING -> COMPLETED/FAILED/RETRYING)
    - Granular progress reporting (0-100%)
    - Resilient failure recovery with exponential backoff & dead-letter tracking
    - Manual and automated retry capabilities
    """

    def __init__(self, max_workers: int = MAX_WORKER_THREADS):
        self.executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="AsyncWorker")
        logger.info(f"Initialized AsyncJobQueueWorker with {max_workers} worker threads.")

    def enqueue_job(self, job_type: str, payload: dict, max_retries: int = 3) -> str:
        """Create job record in DB and submit task to executor pool."""
        db = SessionLocal()
        try:
            job = AsyncJob(
                type=job_type,
                status="PENDING",
                progress=0,
                payload=json.dumps(payload),
                max_retries=max_retries,
                retry_count=0
            )
            db.add(job)
            db.commit()
            db.refresh(job)
            job_id = job.id

            db.add(AuditLog(
                entity_type="JOB",
                entity_id=job_id,
                action="QUEUED",
                details=f"Job {job_type} enqueued with max {max_retries} retries."
            ))
            db.commit()

            # Dispatch to worker thread
            self.executor.submit(self._execute_job_lifecycle, job_id)
            return job_id
        finally:
            db.close()

    def retry_job(self, job_id: str, new_max_retries: int = None) -> bool:
        """Manually trigger retry for a failed or stalled job."""
        db = SessionLocal()
        try:
            job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
            if not job:
                return False

            job.status = "PENDING"
            job.progress = 0
            job.error_message = None
            if new_max_retries is not None:
                job.max_retries = new_max_retries

            db.add(AuditLog(
                entity_type="JOB",
                entity_id=job_id,
                action="MANUAL_RETRY_TRIGGERED",
                details=f"User triggered manual retry. Previous attempts: {job.retry_count}."
            ))
            db.commit()

            self.executor.submit(self._execute_job_lifecycle, job_id)
            return True
        finally:
            db.close()

    def _execute_job_lifecycle(self, job_id: str):
        """Worker lifecycle execution logic with retry and exponential backoff loop."""
        while True:
            db = SessionLocal()
            should_retry = False
            backoff_delay = 0.0

            try:
                job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
                if not job:
                    logger.error(f"Job {job_id} not found in database.")
                    return

                job.status = "PROCESSING"
                if not job.started_at:
                    job.started_at = utc_now()
                db.commit()

                handler = HANDLERS.get(job.type)
                if not handler:
                    raise ValueError(f"No handler registered for job type '{job.type}'")

                payload = json.loads(job.payload) if job.payload else {}

                # Progress callback updater
                def update_progress(percent: int):
                    prog_db = SessionLocal()
                    try:
                        j = prog_db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
                        if j:
                            j.progress = percent
                            prog_db.commit()
                    finally:
                        prog_db.close()

                # Execute target handler
                result_data = handler(job, payload, update_progress, db)

                # Completed successfully
                job.status = "COMPLETED"
                job.progress = 100
                job.result = json.dumps(result_data)
                job.completed_at = utc_now()
                job.error_message = None

                db.add(AuditLog(
                    entity_type="JOB",
                    entity_id=job_id,
                    action="COMPLETED",
                    details=f"Job {job.type} finished successfully on attempt {job.retry_count + 1}."
                ))
                db.commit()
                logger.info(f"Job {job_id} [{job.type}] completed successfully.")
                break

            except Exception as exc:
                full_tb = traceback.format_exc()
                logger.error(f"Error executing job {job_id}: {exc}\n{full_tb}")

                job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
                if not job:
                    return

                job.retry_count += 1
                can_retry = FailurePolicy.should_retry(job.retry_count, job.max_retries)

                if can_retry:
                    backoff_delay = FailurePolicy.calculate_backoff(job.retry_count - 1)
                    job.status = "RETRYING"
                    job.error_message = f"[Attempt {job.retry_count} Failed]: {str(exc)}\nScheduled exponential retry in {backoff_delay}s."

                    db.add(AuditLog(
                        entity_type="JOB",
                        entity_id=job_id,
                        action="RETRY_SCHEDULED",
                        details=f"Attempt {job.retry_count} failed. Backoff delay: {backoff_delay}s. Error: {str(exc)}"
                    ))
                    db.commit()
                    should_retry = True
                else:
                    # Dead letter state (Max retries exhausted)
                    job.status = "FAILED"
                    job.completed_at = utc_now()
                    job.error_message = f"[Max Retries ({job.max_retries}) Exhausted]: {str(exc)}\n\nTraceback:\n{full_tb}"

                    db.add(AuditLog(
                        entity_type="JOB",
                        entity_id=job_id,
                        action="FAILED",
                        details=f"Job permanently failed after {job.retry_count} attempts. Reason: {str(exc)}"
                    ))
                    db.commit()
                    break

            finally:
                db.close()

            # If eligible for retry, sleep for the exponential backoff duration before next attempt
            if should_retry:
                logger.info(f"Job {job_id} entering exponential backoff wait of {backoff_delay}s...")
                time.sleep(backoff_delay)


# Global singleton worker instance
job_worker = AsyncJobQueueWorker()
