from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report import Report
from app.models.observation import Observation
from app.schemas.observation import ObservationResponse, ObservationListResponse, ReferenceRangeSchema, SourceProvenanceSchema
from app.api.deps import get_user_report

router = APIRouter(prefix="/reports", tags=["Observations"])


@router.get("/{report_id}/observations", response_model=ObservationListResponse)
def get_report_observations(
    report: Report = Depends(get_user_report),
    db: Session = Depends(get_db)
):
    observations = db.query(Observation).filter(
        Observation.report_id == report.id
    ).order_by(Observation.source_page.asc(), Observation.created_at.asc()).all()

    formatted_obs = []
    for obs in observations:
        formatted_obs.append(
            ObservationResponse(
                id=obs.id,
                report_id=obs.report_id,
                test_name=obs.test_name_normalized or obs.test_name_original,
                test_name_original=obs.test_name_original,
                value_text=obs.value_text,
                value_numeric=obs.value_numeric,
                comparator=obs.comparator,
                unit=obs.unit_original,
                reference_range=ReferenceRangeSchema(
                    low=obs.reference_low,
                    high=obs.reference_high,
                    text=obs.reference_text
                ),
                reported_flag=obs.reported_flag,
                validation_status=obs.validation_status,
                extraction_confidence=obs.extraction_confidence,
                source=SourceProvenanceSchema(
                    page=obs.source_page,
                    snippet=obs.source_snippet
                )
            )
        )

    return ObservationListResponse(
        report_id=report.id,
        observations=formatted_obs
    )
