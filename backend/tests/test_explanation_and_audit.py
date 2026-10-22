import pytest
from app.models.user import User
from app.models.report import Report
from app.models.observation import Observation
from app.models.audit import AuditEvent
from app.core.security import get_password_hash, create_access_token
from app.services.safety import SafetyService
from app.services.explanation import ExplanationService


def test_safety_llm_output_validator_detects_diagnosis():
    # LLM hallucinates an absolute disease diagnosis
    unsafe_text = "Based on your elevated fasting blood glucose, you have diabetes mellitus."
    is_valid, violation = SafetyService.validate_llm_output(unsafe_text)
    assert not is_valid
    assert violation is not None
    assert "violated medical safety rule" in violation.lower()


def test_safety_llm_output_validator_detects_prescription():
    # LLM hallucinates a specific dosage recommendation
    unsafe_text = "You should start taking 500mg Metformin twice daily with meals."
    is_valid, violation = SafetyService.validate_llm_output(unsafe_text)
    assert not is_valid
    assert violation is not None


def test_safety_llm_output_validator_passes_safe_educational_text():
    # Compliant 5-point plain language educational text
    safe_text = (
        "Your reported Hemoglobin is 13.5 g/dL, which falls within the printed laboratory reference range of 12.0 - 15.5 g/dL. "
        "Hemoglobin is the protein in red blood cells that carries oxygen throughout the body. "
        "A single laboratory value must be evaluated in the context of your overall clinical history, symptoms, and hydration. "
        "We recommend discussing these findings with your healthcare provider during your next routine visit."
    )
    is_valid, violation = SafetyService.validate_llm_output(safe_text)
    assert is_valid
    assert violation is None


def test_explanation_abstention_on_missing_test():
    # User asks about "Ferritin", but the report only contains Hemoglobin
    mock_observations = [{
        "test_name_original": "Hemoglobin",
        "test_name_normalized": "Hemoglobin",
        "value_text": "13.5",
        "value_numeric": 13.5,
        "unit_normalized": "g/dL",
        "reported_flag": "normal",
        "reference_text": "12.0 - 15.5",
        "reference_low": 12.0,
        "reference_high": 15.5,
        "source_page": 1,
        "validation_status": "verified"
    }]
    result = ExplanationService.generate_explanation(
        observations=mock_observations,
        retrieved_chunks=[],
        user_question="What is my Ferritin level and is it low?"
    )
    assert result is not None
    assert result["safety_status"] == "TEST_NOT_IN_REPORT"
    # Must explicitly state that Ferritin was not found in the report
    assert "ferritin" in result["summary"].lower()
    assert "not present in your uploaded medical report" in result["summary"].lower()


def test_observation_user_correction_and_audit(client, db_session):
    # Setup user
    user = User(
        email="patient_correct@example.com",
        password_hash=get_password_hash("SecretPass123!"),
        status="active"
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(user.id)

    # Setup report and observation
    report = Report(
        owner_user_id=user.id,
        original_filename="sample_cbc.pdf",
        media_type="application/pdf",
        file_size_bytes=1024,
        storage_key="dummy_key",
        sha256="dummy_hash",
        processing_status="COMPLETED"
    )
    db_session.add(report)
    db_session.commit()

    observation = Observation(
        report_id=report.id,
        test_name_original="Hemoglobin",
        test_name_normalized="Hemoglobin",
        value_text="120",  # OCR error: missing decimal point
        value_numeric=120.0,
        unit_original="g/dL",
        reference_low=12.0,
        reference_high=15.5,
        reported_flag="critical",
        validation_status="needs_review",
        source_page=1
    )
    db_session.add(observation)
    db_session.commit()

    # User corrects value to 12.0 via PATCH
    patch_res = client.patch(
        f"/api/v1/reports/{report.id}/observations/{observation.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "value_text": "12.0",
            "value_numeric": 12.0,
            "unit": "g/dL",
            "correction_notes": "OCR missed decimal point in 12.0"
        }
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["is_user_corrected"] is True
    assert data["value_numeric"] == 12.0
    assert data["reported_flag"] == "normal"  # Deterministically recomputed!
    assert data["validation_status"] == "verified"

    # Verify audit event was recorded in DB
    audit = db_session.query(AuditEvent).filter(
        AuditEvent.resource_id == observation.id,
        AuditEvent.action == "CORRECT_OBSERVATION"
    ).first()
    assert audit is not None
    assert audit.actor_user_id == user.id
    assert audit.outcome == "SUCCESS"
