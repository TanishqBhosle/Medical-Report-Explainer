from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class ReferenceRangeSchema(BaseModel):
    low: Optional[float] = None
    high: Optional[float] = None
    text: Optional[str] = None


class SourceProvenanceSchema(BaseModel):
    page: Optional[int] = None
    snippet: Optional[str] = None


class ObservationUpdate(BaseModel):
    value_text: str
    unit: Optional[str] = None
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    correction_notes: Optional[str] = None


class ObservationResponse(BaseModel):
    id: str
    report_id: str
    test_name: str
    test_name_original: str
    value_text: str
    value_numeric: Optional[float] = None
    comparator: Optional[str] = None
    unit: Optional[str] = None
    reference_range: ReferenceRangeSchema
    reported_flag: str  # low, normal, high, critical, unknown, conflict
    validation_status: str  # verified, needs_review, invalid
    extraction_confidence: float
    source: SourceProvenanceSchema
    flag_conflict: bool = False
    discrepancy_note: Optional[str] = None
    is_user_corrected: bool = False
    user_corrected_value_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ObservationListResponse(BaseModel):
    report_id: str
    observations: List[ObservationResponse]
