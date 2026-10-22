from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.report import Report
from app.models.observation import Observation
from app.models.explanation import Explanation
from app.models.knowledge import ExplanationCitation, KnowledgeChunk, KnowledgeSource
from app.models.user import User
from app.schemas.explanation import ExplanationRequest, ExplanationResponse, PerObservationExplanation, CitationItem
from app.api.deps import get_current_user, get_user_report
from app.services.retrieval import RetrievalService
from app.services.explanation import ExplanationService

router = APIRouter(prefix="/reports", tags=["Explanations"])


@router.post("/{report_id}/explanations", response_model=ExplanationResponse)
def generate_report_explanation(
    report_id: str,
    payload: ExplanationRequest,
    report: Report = Depends(get_user_report),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    observations = db.query(Observation).filter(Observation.report_id == report.id).all()

    # Collect test names for retrieval
    test_names = [o.test_name_normalized or o.test_name_original for o in observations]

    # Retrieve relevant knowledge chunks
    retrieved_chunks = RetrievalService.retrieve_relevant_chunks(
        db=db,
        query=payload.question or "",
        test_names=test_names,
        top_k=8
    )

    # Generate grounded explanation
    result = ExplanationService.generate_explanation(
        observations=observations,
        retrieved_chunks=retrieved_chunks,
        user_question=payload.question
    )

    # Persist explanation record
    explanation = Explanation(
        report_id=report.id,
        owner_user_id=current_user.id,
        question=payload.question,
        summary=result["summary"],
        response_json=result,
        model_provider="internal-rag",
        model_name="clinical-rag-v1",
        prompt_version="1.0",
        safety_status=result["safety_status"]
    )
    db.add(explanation)
    db.commit()
    db.refresh(explanation)

    # Persist citations
    for c in result.get("citations", []):
        citation_link = ExplanationCitation(
            explanation_id=explanation.id,
            knowledge_chunk_id=c["chunk_id"],
            relevance_score=1.0,
            citation_role="supporting_evidence"
        )
        db.add(citation_link)
    db.commit()

    return ExplanationResponse(
        explanation_id=explanation.id,
        report_id=report.id,
        question=payload.question,
        summary=result["summary"],
        observations=[PerObservationExplanation(**obs) for obs in result["observations"]],
        questions_for_clinician=result["questions_for_clinician"],
        citations=[CitationItem(**c) for c in result["citations"]],
        limitations=result["limitations"],
        safety_status=result["safety_status"],
        created_at=explanation.created_at
    )


@router.get("/{report_id}/explanations/{explanation_id}", response_model=ExplanationResponse)
def get_explanation(
    report_id: str,
    explanation_id: str,
    report: Report = Depends(get_user_report),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    explanation = db.query(Explanation).filter(
        Explanation.id == explanation_id,
        Explanation.report_id == report.id,
        Explanation.owner_user_id == current_user.id
    ).first()

    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": "Explanation not found."}
        )

    res_json = explanation.response_json
    return ExplanationResponse(
        explanation_id=explanation.id,
        report_id=report.id,
        question=explanation.question,
        summary=res_json.get("summary", ""),
        observations=[PerObservationExplanation(**obs) for obs in res_json.get("observations", [])],
        questions_for_clinician=res_json.get("questions_for_clinician", []),
        citations=[CitationItem(**c) for c in res_json.get("citations", [])],
        limitations=res_json.get("limitations", []),
        safety_status=explanation.safety_status,
        created_at=explanation.created_at
    )
