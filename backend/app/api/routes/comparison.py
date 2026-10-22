from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report import Report
from app.models.observation import Observation
from app.models.user import User
from app.schemas.comparison import CompareRequest, CompareResponse, ParameterMatch
from app.api.deps import get_current_user
from app.services.comparison import ComparisonService

router = APIRouter(prefix="/reports", tags=["Comparison"])


@router.post("/compare", response_model=CompareResponse)
def compare_reports(
    payload: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report_a = db.query(Report).filter(
        Report.id == payload.report_id_a,
        Report.deleted_at.is_(None)
    ).first()

    report_b = db.query(Report).filter(
        Report.id == payload.report_id_b,
        Report.deleted_at.is_(None)
    ).first()

    if not report_a or not report_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "One or both reports were not found."}
        )

    # Scoped authorization check: both reports must belong to current user
    if report_a.owner_user_id != current_user.id or report_b.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "One or both reports were not found."}
        )

    obs_a = db.query(Observation).filter(Observation.report_id == report_a.id).all()
    obs_b = db.query(Observation).filter(Observation.report_id == report_b.id).all()

    comparison_data = ComparisonService.compare_reports(
        report_a=report_a,
        obs_a=obs_a,
        report_b=report_b,
        obs_b=obs_b
    )

    return CompareResponse(
        report_id_a=comparison_data["report_id_a"],
        report_id_b=comparison_data["report_id_b"],
        document_date_a=comparison_data["document_date_a"],
        document_date_b=comparison_data["document_date_b"],
        matched_parameters=[ParameterMatch(**p) for p in comparison_data["matched_parameters"]],
        unmatched_parameters_a=comparison_data["unmatched_parameters_a"],
        unmatched_parameters_b=comparison_data["unmatched_parameters_b"],
        notes=comparison_data["notes"]
    )
