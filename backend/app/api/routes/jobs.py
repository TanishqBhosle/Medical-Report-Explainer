from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.job import ProcessingJob
from app.models.report import Report
from app.models.user import User
from app.schemas.job import JobStatusResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "Job not found."}
        )

    # Scoped ownership check through parent report
    report = db.query(Report).filter(Report.id == job.report_id).first()
    if not report or report.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "Job not found."}
        )

    return JobStatusResponse(
        job_id=job.id,
        report_id=job.report_id,
        status=job.status,
        stage=job.stage,
        progress_percent=job.progress_percent,
        safe_error_code=job.error_code,
        safe_error_message=job.safe_error_message
    )
