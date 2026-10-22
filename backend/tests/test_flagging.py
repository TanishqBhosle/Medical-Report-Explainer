from app.services.flagging import FlaggingService


def test_flagging_boundaries():
    # Value inside range
    flag, status = FlaggingService.evaluate_flag(13.5, 12.0, 15.5)
    assert flag == "normal"
    assert status == "verified"

    # Value equal to lower bound
    flag, status = FlaggingService.evaluate_flag(12.0, 12.0, 15.5)
    assert flag == "normal"
    assert status == "verified"

    # Value equal to upper bound
    flag, status = FlaggingService.evaluate_flag(15.5, 12.0, 15.5)
    assert flag == "normal"
    assert status == "verified"

    # Value below lower bound
    flag, status = FlaggingService.evaluate_flag(10.2, 12.0, 15.5)
    assert flag == "low"
    assert status == "verified"

    # Value above upper bound
    flag, status = FlaggingService.evaluate_flag(17.8, 12.0, 15.5)
    assert flag == "high"
    assert status == "verified"

    # Critical low (<= 50% of lower bound)
    flag, status = FlaggingService.evaluate_flag(5.0, 12.0, 15.5)
    assert flag == "critical"
    assert status == "verified"

    # Critical high (>= 200% of upper bound)
    flag, status = FlaggingService.evaluate_flag(32.0, 12.0, 15.5)
    assert flag == "critical"
    assert status == "verified"


def test_flagging_single_sided_ranges():
    # Upper bound only (< 200)
    flag, status = FlaggingService.evaluate_flag(180.0, None, 200.0)
    assert flag == "normal"
    assert status == "verified"

    flag, status = FlaggingService.evaluate_flag(235.0, None, 200.0)
    assert flag == "high"
    assert status == "verified"

    # Lower bound only (> 60)
    flag, status = FlaggingService.evaluate_flag(75.0, 60.0, None)
    assert flag == "normal"
    assert status == "verified"

    flag, status = FlaggingService.evaluate_flag(45.0, 60.0, None)
    assert flag == "low"
    assert status == "verified"


def test_flagging_qualitative_and_missing():
    # Qualitative positive/negative
    flag, status = FlaggingService.evaluate_flag(None, None, None, qualitative_text="Positive")
    assert flag == "high"
    assert status == "verified"

    flag, status = FlaggingService.evaluate_flag(None, None, None, qualitative_text="Negative")
    assert flag == "normal"
    assert status == "verified"

    # Missing range
    flag, status = FlaggingService.evaluate_flag(14.2, None, None)
    assert flag == "unknown"
    assert status == "needs_review"
