from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class ExplanationRequest(BaseModel):
    question: Optional[str] = "Explain this medical report in simple language."
    language: Optional[str] = "en"
    include_questions_for_clinician: bool = True


class CitationItem(BaseModel):
    source_id: str
    chunk_id: str
    title: str
    publisher: str
    source_url: str
    relevant_snippet: str


class PerObservationExplanation(BaseModel):
    observation_id: str
    test_name: str
    reported_value: str
    reported_flag: str
    plain_language_explanation: str
    evidence_ids: List[str] = []
    uncertainty_note: Optional[str] = None


class ExplanationResponse(BaseModel):
    explanation_id: str
    report_id: str
    question: Optional[str] = None
    summary: str
    observations: List[PerObservationExplanation]
    questions_for_clinician: List[str]
    citations: List[CitationItem]
    limitations: List[str]
    safety_status: str
    created_at: datetime
