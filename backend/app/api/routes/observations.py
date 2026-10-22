from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report import Report
from app.models.observation import Observation
from app.models.audit import AuditEvent
from app.models.user import User
from app.schemas.observation import (
    ObservationResponse,
    ObservationListResponse,
    ObservationUpdate,
    ReferenceRangeSchema,
    SourceProvenanceSchema
)
from app.api.deps import get_user_report, get_current_user
from app.services.flagging import FlaggingService
from app.services.normalization import NormalizationService

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
                value_text=obs.user_corrected_value_text or obs.value_text,
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
                ),
                flag_conflict=obs.flag_conflict,
                discrepancy_note=obs.discrepancy_note,
                is_user_corrected=obs.is_user_corrected,
                user_corrected_value_text=obs.user_corrected_value_text
            )
        )

    return ObservationListResponse(
        report_id=report.id,
        observations=formatted_obs
    )


@router.patch("/{report_id}/observations/{observation_id}", response_model=ObservationResponse)
def update_observation_correction(
    report_id: str,
    observation_id: str,
    update_data: ObservationUpdate,
    report: Report = Depends(get_user_report),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows user to correct an OCR misread value or unit with an audit trail.
    Preserves original extraction verbatim for clinical provenance.
    """
    obs = db.query(Observation).filter(
        Observation.id == observation_id,
        Observation.report_id == report.id
    ).first()

    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "Observation not found."}
        )

    # Parse numeric value from updated text
    clean_val_str = update_data.value_text.strip().replace(",", ".")
    try:
        new_numeric = float(clean_val_str)
    except ValueError:
        new_numeric = None

    # Track correction
    obs.user_corrected_value_text = update_data.value_text.strip()
    obs.value_numeric = new_numeric
    obs.is_user_corrected = True
    obs.user_correction_notes = update_data.correction_notes or "User verified and corrected OCR extraction."

    if update_data.unit:
        obs.unit_original = update_data.unit
        obs.unit_normalized = NormalizationService.normalize_unit(update_data.unit)

    if update_data.reference_low is not None:
        obs.reference_low = update_data.reference_low
    if update_data.reference_high is not None:
        obs.reference_high = update_data.reference_high

    # Re-evaluate deterministic flagging with corrected value
    computed_flag, val_status, flag_conflict, disc_note = FlaggingService.evaluate_flag(
        value_numeric=obs.value_numeric,
        ref_low=obs.reference_low,
        ref_high=obs.reference_high,
        comparator=obs.comparator,
        qualitative_text=obs.user_corrected_value_text if obs.value_numeric is None else None,
        lab_reported_flag=None  # Reset discrepancy since user provided verified value
    )
    obs.reported_flag = computed_flag
    obs.validation_status = "verified"
    obs.flag_conflict = flag_conflict
    obs.discrepancy_note = disc_note

    # Record audit event
    audit = AuditEvent(
        actor_user_id=current_user.id,
        action="CORRECT_OBSERVATION",
        resource_type="observation",
        resource_id=obs.id,
        outcome="SUCCESS",
        request_id=None
    )
    db.add(audit)
    db.commit()
    db.refresh(obs)

    return ObservationResponse(
        id=obs.id,
        report_id=obs.report_id,
        test_name=obs.test_name_normalized or obs.test_name_original,
        test_name_original=obs.test_name_original,
        value_text=obs.user_corrected_value_text or obs.value_text,
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
        extraction_confidence=1.0,  # Verified by human
        source=SourceProvenanceSchema(
            page=obs.source_page,
            snippet=obs.source_snippet
        ),
        flag_conflict=obs.flag_conflict,
        discrepancy_note=obs.discrepancy_note,
        is_user_corrected=obs.is_user_corrected,
        user_corrected_value_text=obs.user_corrected_value_text
    )
