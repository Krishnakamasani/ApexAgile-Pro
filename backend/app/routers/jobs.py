from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.job import AsyncJob
from app.schemas.job import JobCreateRequest, JobResponse, JobRetryRequest
from app.workers.job_queue import job_worker

router = APIRouter(prefix="/api/v1/jobs", tags=["Async Background Workflows"])

@router.post("", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED, summary="Enqueue an asynchronous background job")
def dispatch_job(req: JobCreateRequest, db: Session = Depends(get_db)):
    """
    Enqueues an asynchronous background job:
    - SPRINT_REPORT: Generates executive digest & burndown metrics in the background.
    - WORKLOAD_AUDIT: Analyzes capacity risks and unassigned items.
    - Set simulate_failure=True to demonstrate exponential backoff retry and failure handling.
    """
    payload = {
        "project_id": req.project_id,
        "simulate_failure": req.simulate_failure,
        "custom_params": req.custom_params or {}
    }
    job_id = job_worker.enqueue_job(req.type, payload)
    job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
    return job

@router.get("", response_model=List[JobResponse], summary="List recent background jobs")
def list_jobs(db: Session = Depends(get_db)):
    return db.query(AsyncJob).order_by(AsyncJob.created_at.desc()).limit(20).all()

@router.get("/{job_id}", response_model=JobResponse, summary="Poll job status, progress, and results")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
    return job

@router.post("/{job_id}/retry", response_model=JobResponse, summary="Manually retry a failed background job")
def retry_job(job_id: str, retry_req: JobRetryRequest = None, db: Session = Depends(get_db)):
    max_retries = retry_req.max_retries if retry_req else None
    success = job_worker.retry_job(job_id, new_max_retries=max_retries)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
    job = db.query(AsyncJob).filter(AsyncJob.id == job_id).first()
    return job
