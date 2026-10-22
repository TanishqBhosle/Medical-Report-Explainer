import io
import pytest
from datetime import date
from app.models.user import User
from app.models.report import Report
from app.models.observation import Observation
from app.models.job import ProcessingJob
from app.core.security import get_password_hash, create_access_token
from app.services.retrieval import RetrievalService
from app.services.comparison import ComparisonService


def test_retrieval_service_matching_and_relevance(db_session):
    # Test that RetrievalService retrieves chunks matching canonical test names
    chunks = RetrievalService.retrieve_relevant_chunks(
        db=db_session,
        query="What does high fasting glucose indicate?",
        test_names=["Fasting Blood Glucose"],
        top_k=3
    )
    assert len(chunks) > 0
    top = chunks[0]
    assert "glucose" in top["chunk_text"].lower() or "glucose" in (top["canonical_test_name"] or "").lower()
    assert top["source_url"].startswith("http")
    assert top["relevance_score"] > 0


def test_comparison_service_longitudinal_and_incompatible_units():
    report_a = Report(
        id="rep-a",
        owner_user_id="user-1",
        original_filename="baseline.pdf",
        document_date=date(2025, 1, 15),
        storage_key="k1",
        sha256="s1",
        media_type="application/pdf",
        file_size_bytes=100
    )
    report_b = Report(
        id="rep-b",
        owner_user_id="user-1",
        original_filename="followup.pdf",
        document_date=date(2025, 6, 15),
        storage_key="k2",
        sha256="s2",
        media_type="application/pdf",
        file_size_bytes=100
    )

    # Param 1: Hemoglobin with matching units (g/dL) -> comparable with delta
    obs_a1 = Observation(
        id="o1", report_id="rep-a", test_name_original="Hemoglobin", test_name_normalized="Hemoglobin",
        value_text="12.5", value_numeric=12.5, unit_original="g/dL", unit_normalized="g/dL",
        reference_low=12.0, reference_high=15.5, reported_flag="normal", validation_status="verified"
    )
    obs_b1 = Observation(
        id="o2", report_id="rep-b", test_name_original="Hemoglobin", test_name_normalized="Hemoglobin",
        value_text="14.0", value_numeric=14.0, unit_original="g/dL", unit_normalized="g/dL",
        reference_low=12.0, reference_high=15.5, reported_flag="normal", validation_status="verified"
    )

    # Param 2: Glucose with incompatible units (mg/dL vs mmol/L) -> is_comparable must be False
    obs_a2 = Observation(
        id="o3", report_id="rep-a", test_name_original="Glucose", test_name_normalized="Fasting Blood Glucose",
        value_text="95", value_numeric=95.0, unit_original="mg/dL", unit_normalized="mg/dL",
        reference_low=70.0, reference_high=99.0, reported_flag="normal", validation_status="verified"
    )
    obs_b2 = Observation(
        id="o4", report_id="rep-b", test_name_original="Glucose", test_name_normalized="Fasting Blood Glucose",
        value_text="5.3", value_numeric=5.3, unit_original="mmol/L", unit_normalized="mmol/L",
        reference_low=3.9, reference_high=5.5, reported_flag="normal", validation_status="verified"
    )

    # Param 3: Unmatched parameter in Report B only
    obs_b3 = Observation(
        id="o5", report_id="rep-b", test_name_original="TSH", test_name_normalized="TSH",
        value_text="2.1", value_numeric=2.1, unit_original="uIU/mL", unit_normalized="uIU/mL",
        reference_low=0.4, reference_high=4.0, reported_flag="normal", validation_status="verified"
    )

    result = ComparisonService.compare_reports(
        report_a=report_a,
        obs_a=[obs_a1, obs_a2],
        report_b=report_b,
        obs_b=[obs_b1, obs_b2, obs_b3]
    )

    matches = result["matched_parameters"]
    assert len(matches) == 2

    # Verify Hemoglobin delta
    hgb_match = next(m for m in matches if m["test_name"] == "Hemoglobin")
    assert hgb_match["is_comparable"] is True
    assert hgb_match["numeric_delta"] == 1.5

    # Verify Glucose unit mismatch refusal
    glu_match = next(m for m in matches if "Glucose" in m["test_name"])
    assert glu_match["is_comparable"] is False
    assert "Unit mismatch" in glu_match["incompatibility_reason"]
    assert glu_match["numeric_delta"] is None

    # Verify unmatched lists
    assert "TSH" in result["unmatched_parameters_b"]


def test_comparison_endpoint_cross_tenant_isolation(client, db_session):
    # User A and User B
    user_a = User(email="comp_a@example.com", password_hash=get_password_hash("Pass123!"), status="active")
    user_b = User(email="comp_b@example.com", password_hash=get_password_hash("Pass123!"), status="active")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)

    # Report for User A and Report for User B
    rep_a = Report(owner_user_id=user_a.id, original_filename="a.pdf", storage_key="ka", sha256="sa", media_type="application/pdf", file_size_bytes=100)
    rep_b = Report(owner_user_id=user_b.id, original_filename="b.pdf", storage_key="kb", sha256="sb", media_type="application/pdf", file_size_bytes=100)
    db_session.add_all([rep_a, rep_b])
    db_session.commit()

    # User B attempts to compare their report with User A's report -> 404 forbidden
    res = client.post(
        "/api/v1/reports/compare",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"report_id_a": rep_a.id, "report_id_b": rep_b.id}
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_jobs_endpoint_cross_tenant_isolation(client, db_session):
    user_a = User(email="job_a@example.com", password_hash=get_password_hash("Pass123!"), status="active")
    user_b = User(email="job_b@example.com", password_hash=get_password_hash("Pass123!"), status="active")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    token_b = create_access_token(user_b.id)

    rep_a = Report(owner_user_id=user_a.id, original_filename="a.pdf", storage_key="ka", sha256="sa", media_type="application/pdf", file_size_bytes=100)
    db_session.add(rep_a)
    db_session.commit()

    job_a = ProcessingJob(report_id=rep_a.id, job_type="EXTRACTION", status="processing", stage="init", progress_percent=10)
    db_session.add(job_a)
    db_session.commit()

    # User B attempts to view User A's job -> 404
    res = client.get(
        f"/api/v1/jobs/{job_a.id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_upload_rejection_of_unsupported_extensions(client, db_session):
    user = User(email="uploader@example.com", password_hash=get_password_hash("Pass123!"), status="active")
    db_session.add(user)
    db_session.commit()
    token = create_access_token(user.id)

    # Attempt to upload an executable
    bad_file = b"MZ\x90\x00\x03\x00\x00\x00"
    res = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malicious.exe", io.BytesIO(bad_file), "application/x-msdownload")},
        data={"consent_to_processing": "true"}
    )
    assert res.status_code == 415
    assert "UNSUPPORTED_MEDIA_TYPE" in res.text or "FILE_TYPE" in res.text
