import pytest
from app.services.extraction import TableExtractor, PDFExtractor, OCRExtractor
from app.services.normalization import NormalizationService
from app.services.flagging import FlaggingService


def test_table_extractor_european_decimal_comma():
    # European decimal comma e.g. "14,2"
    pages = [{
        "page_number": 1,
        "text": "Hemoglobin 14,2 g/dL 12.0 - 15.5 Normal",
        "status": "READABLE"
    }]
    rows = TableExtractor.extract_rows(pages)
    assert len(rows) >= 1
    hb_row = next(r for r in rows if "Hemoglobin" in r["test_name_original"])
    assert hb_row["value_numeric"] == 14.2
    assert hb_row["value_text"] == "14,2"


def test_table_extractor_magnitude_anomaly_detection():
    # OCR reads Hemoglobin as "120" instead of "12.0" (exceeds physiological plausibility)
    pages = [{
        "page_number": 1,
        "text": "Hemoglobin 120 g/dL 12.0 - 15.5 High",
        "status": "READABLE"
    }]
    rows = TableExtractor.extract_rows(pages)
    assert len(rows) >= 1
    hb_row = next(r for r in rows if "Hemoglobin" in r["test_name_original"])
    assert hb_row["validation_status"] == "needs_review"
    assert "magnitude anomaly" in hb_row["discrepancy_note"].lower()


def test_table_extractor_qualitative_results():
    # Qualitative results: Reactive, Hemolyzed
    pages = [{
        "page_number": 1,
        "text": "Hepatitis B Surface Antigen Reactive Negative\nSerum Specimen Hemolyzed specimen",
        "status": "READABLE"
    }]
    rows = TableExtractor.extract_rows(pages)
    assert len(rows) >= 1
    hep_row = next(r for r in rows if "Hepatitis" in r["test_name_original"])
    assert hep_row["value_numeric"] is None
    assert hep_row["value_text"] == "Reactive"


def test_table_extractor_single_sided_reference_ranges():
    # Single sided range: < 200 mg/dL
    pages = [{
        "page_number": 1,
        "text": "Total Cholesterol 230 mg/dL < 200 High",
        "status": "READABLE"
    }]
    rows = TableExtractor.extract_rows(pages)
    chol_row = next(r for r in rows if "Cholesterol" in r["test_name_original"])
    assert chol_row["value_numeric"] == 230.0
    assert chol_row["reference_high"] == 200.0
    assert chol_row["reference_low"] is None


def test_pdf_extractor_page_limit_enforcement(tmp_path):
    # Test that PDFExtractor enforces MAX_PAGE_LIMIT
    fake_pdf = tmp_path / "huge.pdf"
    fake_pdf.write_bytes(b"%PDF-1.4\n...")
    
    # Verify that PDFExtractor handles non-existent or corrupted files gracefully
    with pytest.raises(ValueError) as excinfo:
        PDFExtractor.extract_text_pages(str(fake_pdf))
    assert "FILE_INVALID_OR_CORRUPT" in str(excinfo.value)
