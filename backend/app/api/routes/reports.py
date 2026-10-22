from datetime import date, datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report import Report
from app.models.job import ProcessingJob
from app.models.observation import Observation
from app.models.user import User
from app.schemas.report import ReportUploadResponse, ReportResponse, ReportListResponse
from app.api.deps import get_current_user, get_user_report
from app.services.ingestion import IngestionService
from app.services.extraction import PDFExtractor, OCRExtractor, TableExtractor
from app.services.normalization import NormalizationService
from app.services.flagging import FlaggingService
from app.core.logging import logger

router = APIRouter(prefix="/reports", tags=["Reports"])


def process_report_task(report_id: str, job_id: str, file_path: str, ext: str, db: Session):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    report = db.query(Report).filter(Report.id == report_id).first()
    if not job or not report:
        return

    try:
        job.status = "processing"
        job.stage = "parsing_document"
        job.progress_percent = 25
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        # Step 1: Document extraction
        pages = []
        if ext == "pdf":
            pages = PDFExtractor.extract_text_pages(file_path)
        else:
            pages = OCRExtractor.extract_image_text(file_path)

        unreadable_count = sum(1 for p in pages if p.get("status") == "UNREADABLE")
        report.page_count = len(pages)
        report.unreadable_pages = unreadable_count
        job.stage = "extracting_observations"
        job.progress_percent = 50
        db.commit()

        # Step 2: Table & observation candidate extraction
        raw_observations = TableExtractor.extract_rows(pages)

        # Step 3: Normalization & Deterministic Flagging
        job.stage = "normalizing_and_flagging"
        job.progress_percent = 75
        db.commit()

        needs_review_count = 0
        for raw_obs in raw_observations:
            norm_obs = NormalizationService.normalize_observation(raw_obs)
            flagged_obs = FlaggingService.apply_flagging(norm_obs)

            if flagged_obs["validation_status"] == "needs_review" or flagged_obs.get("flag_conflict"):
                needs_review_count += 1

            observation_record = Observation(
                report_id=report.id,
                test_name_original=flagged_obs["test_name_original"],
                test_name_normalized=flagged_obs["test_name_normalized"],
                value_text=flagged_obs["value_text"],
                value_numeric=flagged_obs["value_numeric"],
                comparator=flagged_obs.get("comparator"),
                unit_original=flagged_obs.get("unit_original"),
                unit_normalized=flagged_obs.get("unit_normalized"),
                reference_low=flagged_obs.get("reference_low"),
                reference_high=flagged_obs.get("reference_high"),
                reference_text=flagged_obs.get("reference_text"),
                reported_flag=flagged_obs["reported_flag"],
                flag_conflict=flagged_obs.get("flag_conflict", False),
                discrepancy_note=flagged_obs.get("discrepancy_note"),
                extraction_confidence=flagged_obs.get("extraction_confidence", 1.0),
                validation_status=flagged_obs["validation_status"],
                source_page=flagged_obs.get("source_page", 1),
                source_snippet=flagged_obs.get("source_snippet")
            )
            db.add(observation_record)

        # Step 4: Finalize Job and Report state
        if unreadable_count > 0:
            final_status = "PARTIAL_SUCCESS"
        elif needs_review_count > 0:
            final_status = "NEEDS_REVIEW"
        else:
            final_status = "COMPLETED"

        report.processing_status = final_status
        job.status = "completed" if final_status in ("COMPLETED", "NEEDS_REVIEW", "PARTIAL_SUCCESS") else "failed"
        job.stage = "done"
        job.progress_percent = 100
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Report {report.id} processed successfully. Status: {final_status}, Unreadable Pages: {unreadable_count}, Observations: {len(raw_observations)}")

    except ValueError as ve:
        err_msg = str(ve)
        logger.warning(f"Validation failure processing report {report_id}: {err_msg}")
        db.rollback()
        
        # Parse error code prefix if present (e.g. "FILE_PASSWORD_PROTECTED: ...")
        code = "EXTRACTION_VALIDATION_ERROR"
        safe_msg = err_msg
        if ":" in err_msg:
            prefix, rest = err_msg.split(":", 1)
            if prefix.isupper() and "_" in prefix:
                code = prefix.strip()
                safe_msg = rest.strip()

        job.status = "failed"
        job.stage = "error"
        job.error_code = code
        job.safe_error_message = safe_msg
        report.processing_status = "FAILED"
        db.commit()

    except Exception as e:
        logger.error(f"Unexpected error processing report {report_id}: {e}")
        db.rollback()
        job.status = "failed"
        job.stage = "error"
        job.error_code = "PROCESSING_FAILED"
        job.safe_error_message = "An error occurred while analyzing the report document. Please verify the document format or re-upload."
        report.processing_status = "FAILED"
        db.commit()


@router.post("", response_model=ReportUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_date: Optional[date] = Form(None),
    consent_to_processing: bool = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not consent_to_processing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CONSENT_REQUIRED", "message": "User consent is required to process the uploaded medical report."}
        )

    # Ingest and validate file
    ingested = await IngestionService.process_upload(file)

    # Create report record
    report = Report(
        owner_user_id=current_user.id,
        original_filename=ingested["original_filename"],
        media_type=ingested["media_type"],
        file_size_bytes=ingested["file_size_bytes"],
        storage_key=ingested["storage_key"],
        sha256=ingested["sha256"],
        document_date=document_date or date.today(),
        processing_status="QUEUED"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Create processing job record
    job = ProcessingJob(
        report_id=report.id,
        job_type="EXTRACTION",
        status="queued",
        stage="init",
        progress_percent=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Spawn background task
    background_tasks.add_task(
        process_report_task,
        report_id=report.id,
        job_id=job.id,
        file_path=ingested["file_path"],
        ext=ingested["ext"],
        db=db
    )

    return ReportUploadResponse(
        report_id=report.id,
        job_id=job.id,
        status="queued",
        status_url=f"/api/v1/jobs/{job.id}"
    )


@router.get("", response_model=ReportListResponse)
def list_reports(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Report).filter(
        Report.owner_user_id == current_user.id,
        Report.deleted_at.is_(None)
    ).order_by(Report.created_at.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return ReportListResponse(
        total=total,
        items=[ReportResponse.model_validate(r) for r in items]
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report: Report = Depends(get_user_report)):
    return ReportResponse.model_validate(report)


@router.delete("/{report_id}", status_code=status.HTTP_200_OK)
def delete_report(
    report: Report = Depends(get_user_report),
    db: Session = Depends(get_db)
):
    # Idempotent deletion: remove file from disk and cascade delete from DB
    storage_key = report.storage_key
    IngestionService.delete_stored_file(storage_key)

    db.delete(report)
    db.commit()

    return {"status": "success", "message": f"Report {report.id} and associated observations and files were completely deleted."}
