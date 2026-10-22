from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class CompareRequest(BaseModel):
    report_id_a: str
    report_id_b: str


class ParameterMatch(BaseModel):
    test_name: str
    is_comparable: bool
    incompatibility_reason: Optional[str] = None
    unit_a: Optional[str] = None
    unit_b: Optional[str] = None
    value_text_a: Optional[str] = None
    value_text_b: Optional[str] = None
    value_numeric_a: Optional[float] = None
    value_numeric_b: Optional[float] = None
    numeric_delta: Optional[float] = None
    flag_a: Optional[str] = None
    flag_b: Optional[str] = None
    reference_a: Optional[str] = None
    reference_b: Optional[str] = None


class CompareResponse(BaseModel):
    report_id_a: str
    report_id_b: str
    document_date_a: Optional[date] = None
    document_date_b: Optional[date] = None
    matched_parameters: List[ParameterMatch]
    unmatched_parameters_a: List[str]
    unmatched_parameters_b: List[str]
    notes: List[str]
