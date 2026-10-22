from app.services.flagging import FlaggingService


def test_flagging_boundaries():
    # Value inside range
    flag, status, conflict, note = FlaggingService.evaluate_flag(13.5, 12.0, 15.5)
    assert flag == "normal"
    assert status == "verified"
    assert not conflict

    # Value equal to lower bound (inclusive)
    flag, status, conflict, note = FlaggingService.evaluate_flag(12.0, 12.0, 15.5)
    assert flag == "normal"
    assert status == "verified"

    # Value equal to upper bound (inclusive)
    flag, status, conflict, note = FlaggingService.evaluate_flag(15.5, 12.0, 15.5)
    assert flag == "normal"
    assert status == "verified"

    # Value below lower bound
    flag, status, conflict, note = FlaggingService.evaluate_flag(10.2, 12.0, 15.5)
    assert flag == "low"
    assert status == "verified"

    # Value above upper bound
    flag, status, conflict, note = FlaggingService.evaluate_flag(17.8, 12.0, 15.5)
    assert flag == "high"
    assert status == "verified"

    # Critical low (<= 50% of lower bound)
    flag, status, conflict, note = FlaggingService.evaluate_flag(5.0, 12.0, 15.5)
    assert flag == "critical"
    assert status == "verified"

    # Critical high (>= 200% of upper bound)
    flag, status, conflict, note = FlaggingService.evaluate_flag(32.0, 12.0, 15.5)
    assert flag == "critical"
    assert status == "verified"


def test_flagging_single_sided_ranges():
    # Upper bound only (< 200)
    flag, status, conflict, note = FlaggingService.evaluate_flag(180.0, None, 200.0)
    assert flag == "normal"
    assert status == "verified"

    flag, status, conflict, note = FlaggingService.evaluate_flag(235.0, None, 200.0)
    assert flag == "high"
    assert status == "verified"

    # Lower bound only (> 60)
    flag, status, conflict, note = FlaggingService.evaluate_flag(75.0, 60.0, None)
    assert flag == "normal"
    assert status == "verified"

    flag, status, conflict, note = FlaggingService.evaluate_flag(45.0, 60.0, None)
    assert flag == "low"
    assert status == "verified"


def test_flagging_qualitative_and_compromised():
    # Qualitative positive/negative
    flag, status, conflict, note = FlaggingService.evaluate_flag(None, None, None, qualitative_text="Positive")
    assert flag == "high"
    assert status == "verified"

    flag, status, conflict, note = FlaggingService.evaluate_flag(None, None, None, qualitative_text="Negative")
    assert flag == "normal"
    assert status == "verified"

    # Compromised specimen (Hemolyzed, QNS)
    flag, status, conflict, note = FlaggingService.evaluate_flag(None, None, None, qualitative_text="Hemolyzed specimen")
    assert flag == "unknown"
    assert status == "invalid"
    assert "rejected or compromised" in note.lower()

    # Missing range
    flag, status, conflict, note = FlaggingService.evaluate_flag(14.2, None, None)
    assert flag == "unknown"
    assert status == "needs_review"
    assert "Cannot determine" in note


def test_flagging_discrepancy_and_conflict():
    # Lab printed "H" (high) but numeric value (13.5) is inside reference range (12.0 - 15.5)
    flag, status, conflict, note = FlaggingService.evaluate_flag(
        value_numeric=13.5,
        ref_low=12.0,
        ref_high=15.5,
        lab_reported_flag="high"
    )
    assert flag == "conflict"
    assert status == "needs_review"
    assert conflict is True
    assert "Laboratory marked this test as High" in note
    assert "Please verify with ordering clinician" in note
