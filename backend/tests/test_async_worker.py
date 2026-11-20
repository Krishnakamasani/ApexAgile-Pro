import time
from app.workers.failure_policy import FailurePolicy
from app.workers.job_queue import job_worker
from app.models.job import AsyncJob

def test_exponential_backoff_calculation():
    """Verify exponential backoff math and ceiling limit."""
    # base = 2.0
    delay_0 = FailurePolicy.calculate_backoff(0, base_seconds=2.0)  # 2 * 2^0 = 2
    delay_1 = FailurePolicy.calculate_backoff(1, base_seconds=2.0)  # 2 * 2^1 = 4
    delay_2 = FailurePolicy.calculate_backoff(2, base_seconds=2.0)  # 2 * 2^2 = 8
    delay_capped = FailurePolicy.calculate_backoff(10, base_seconds=2.0, max_delay=30.0)

    assert delay_0 == 2.0
    assert delay_1 == 4.0
    assert delay_2 == 8.0
    assert delay_capped == 30.0

def test_retry_eligibility():
    """Verify retry policy logic."""
    assert FailurePolicy.should_retry(current_retries=0, max_retries=3) is True
    assert FailurePolicy.should_retry(current_retries=2, max_retries=3) is True
    assert FailurePolicy.should_retry(current_retries=3, max_retries=3) is False

def test_async_job_execution():
    """Test enqueuing and completing a background job."""
    from app.database import SessionLocal
    job_id = job_worker.enqueue_job("SPRINT_REPORT", {"project_id": None, "simulate_failure": False})
    assert job_id is not None

    # Wait briefly for worker thread to process
    max_wait = 15
    start = time.time()
    completed = False
    job_result = None

    while time.time() - start < max_wait:
        with SessionLocal() as db:
            job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
            if job and job.status == "COMPLETED":
                completed = True
                job_result = job.result
                break
        time.sleep(0.5)

    assert completed is True
    assert job_result is not None
    assert "report_type" in job_result
