import os
import pytest
from app.services.extraction.pdf_extractor import PDFExtractor
from app.services.extraction.table_extractor import TableExtractor
from app.services.normalization import NormalizationService
from app.services.flagging import FlaggingService
from app.services.explanation import ExplanationService
from app.models.report import Report
from app.models.observation import Observation
from app.models.job import ProcessingJob
from app.api.routes.reports import process_report_task


def test_sourabh_jeevan_pdf_extraction():
    """
    Validates end-to-end extraction on the actual Mr._SOURABH_JEEVAN.pdf stored in storage/.
    Expected tests:
    - Dengue NS1 Antigen: 0.01 Index Value, Ref: < 1.0, Flag: normal
    - Dengue IgM Antibody: 0.07 Index Value, Ref: < 1.0 (Index Value) Negative, Flag: normal
    """
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "storage", "d999da1cddc14a1b8c9000d38192af34.pdf")
    if not os.path.exists(pdf_path):
        pytest.skip(f"Test PDF not found at {pdf_path}")

    pages = PDFExtractor.extract_text_pages(pdf_path)
    assert len(pages) == 2, f"Expected 2 pages, got {len(pages)}"

    raw_observations = TableExtractor.extract_rows(pages)
    assert len(raw_observations) == 2, f"Expected exactly 2 raw observations, got {len(raw_observations)}"

    normalized = [NormalizationService.normalize_observation(r) for r in raw_observations]
    flagged = [FlaggingService.apply_flagging(n) for n in normalized]

    test_map = {o["test_name_normalized"]: o for o in flagged}
    assert "Dengue NS1 Antigen" in test_map
    assert "Dengue IgM Antibody" in test_map

    ns1 = test_map["Dengue NS1 Antigen"]
    assert ns1["value_numeric"] == 0.01
    assert ns1["unit_normalized"] == "Index Value"
    assert ns1["reference_high"] == 1.0
    assert ns1["reported_flag"] == "normal"

    igm = test_map["Dengue IgM Antibody"]
    assert igm["value_numeric"] == 0.07
    assert igm["unit_normalized"] == "Index Value"
    assert igm["reference_high"] == 1.0
    assert igm["reported_flag"] == "normal"


def test_cbc_multi_alias_and_differential_extraction():
    """
    Validates that common blood test aliases (TLC, PCV, Platelet Count, RBC, Differential WBC)
    are properly extracted, normalized, and flagged.
    """
    mock_pages = [
        {
            "page_number": 1,
            "status": "EXTRACTED",
            "lines": [
                "COMPLETE BLOOD COUNT (CBC) REPORT",
                "Investigation           Result    Reference Interval   Unit",
                "Hemoglobin              13.5      12.0 - 16.0          g/dL",
                "TLC (Total Leukocyte)   7500      4000 - 11000         /cumm",
                "RBC Count               4.8       4.5 - 5.5            mil/uL",
                "PCV (Hematocrit)        42.0      36.0 - 48.0          %",
                "Total Platelet Count    250000    150000 - 450000      /cumm",
                "Neutrophils             62        40 - 75              %",
                "Lymphocytes             30        20 - 45              %",
                "Eosinophils             4         1 - 6                %",
                "Monocytes               3         2 - 10               %",
                "Basophils               1         0 - 2                %"
            ],
            "raw_text": "Sample CBC Text"
        }
    ]

    raw = TableExtractor.extract_rows(mock_pages)
    assert len(raw) == 10, f"Expected 10 extracted parameters, got {len(raw)}"

    flagged = [FlaggingService.apply_flagging(NormalizationService.normalize_observation(r)) for r in raw]
    names = {o["test_name_normalized"] for o in flagged}

    assert "Hemoglobin" in names
    assert "White Blood Cell Count" in names  # TLC normalized
    assert "Red Blood Cell Count" in names
    assert "Hematocrit" in names  # PCV normalized
    assert "Platelet Count" in names
    assert "Neutrophils" in names
    assert "Lymphocytes" in names
    assert "Eosinophils" in names
    assert "Monocytes" in names
    assert "Basophils" in names

    for item in flagged:
        assert item["reported_flag"] == "normal"


def test_zero_observation_deterministic_guard():
    """
    Ensures that when zero observations are extracted, the explanation service:
    1. Returns safety_status == NO_OBSERVATIONS_EXTRACTED
    2. Never claims all tests are normal or in range
    3. Clearly alerts the user that no conclusions can be drawn
    """
    res = ExplanationService.generate_explanation(
        observations=[],
        retrieved_chunks=[],
        user_question="Are my white blood cells normal?"
    )

    assert res["safety_status"] == "NO_OBSERVATIONS_EXTRACTED"
    assert "could not reliably extract" in res["summary"].lower()
    assert "no conclusion can be made" in res["summary"].lower()
    assert len(res["observations"]) == 0


def test_chat_non_reported_test_clarification():
    """
    Verifies that when a user asks about a test absent from a report,
    the system explicitly lists the tests that ARE in the report, rather than
    generic rejection.
    """
    mock_obs = [
        Observation(
            id="1",
            report_id="rep-1",
            test_name_original="DENGUE NS1 ANTIGEN",
            test_name_normalized="Dengue NS1 Antigen",
            value_text="0.01",
            value_numeric=0.01,
            unit_normalized="Index Value",
            reference_high=1.0,
            reported_flag="normal",
            validation_status="verified"
        ),
        Observation(
            id="2",
            report_id="rep-1",
            test_name_original="DENGUE IgM ANTIBODY",
            test_name_normalized="Dengue IgM Antibody",
            value_text="0.07",
            value_numeric=0.07,
            unit_normalized="Index Value",
            reference_high=1.0,
            reported_flag="normal",
            validation_status="verified"
        )
    ]

    res = ExplanationService.generate_explanation(
        observations=mock_obs,
        retrieved_chunks=[],
        user_question="What does my Hemoglobin mean?"
    )

    assert res["safety_status"] == "TEST_NOT_IN_REPORT"
    assert "Hemoglobin" in res["summary"]
    assert "Dengue NS1 Antigen" in res["summary"]
    assert "Dengue IgM Antibody" in res["summary"]


def test_state_machine_zero_observations_sets_needs_review(db_session, monkeypatch):
    """
    Validates that if a report is processed and 0 observations are extracted,
    it transitions to 'NEEDS_REVIEW' with error code 'NO_PARAMETERS_EXTRACTED',
    and NEVER transitions silently to 'COMPLETED'.
    """
    from app.models.user import User
    from app.core.security import get_password_hash
    import tempfile

    test_user = User(
        email="test_zero_obs@example.com",
        password_hash=get_password_hash("Pass123!"),
        status="active"
    )
    db_session.add(test_user)
    db_session.commit()

    monkeypatch.setattr(
        PDFExtractor,
        "extract_text_pages",
        lambda path: [{
            "page_number": 1,
            "text": "Medical Equipment Invoice #10294\nTotal: $120.00\nNo lab results included.",
            "char_count": 70,
            "status": "READABLE",
            "method": "PYPDF"
        }]
    )

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(b"%PDF-1.4 mock")
        f_path = f.name

    try:
        rep = Report(
            owner_user_id=test_user.id,
            original_filename="invoice_only.pdf",
            media_type="application/pdf",
            file_size_bytes=os.path.getsize(f_path),
            storage_key="test_invoice_only.pdf",
            sha256="abc123empty",
            processing_status="UPLOADED"
        )
        db_session.add(rep)
        db_session.commit()

        job = ProcessingJob(
            report_id=rep.id,
            status="pending",
            stage="queued",
            progress_percent=0
        )
        db_session.add(job)
        db_session.commit()

        process_report_task(rep.id, job.id, f_path, "pdf", db_session)

        db_session.refresh(rep)
        db_session.refresh(job)

        assert rep.processing_status == "NEEDS_REVIEW"
        assert job.status == "needs_review"
        assert job.error_code == "NO_PARAMETERS_EXTRACTED"
        assert "could not reliably extract" in job.safe_error_message.lower()

    finally:
        if os.path.exists(f_path):
            os.remove(f_path)
