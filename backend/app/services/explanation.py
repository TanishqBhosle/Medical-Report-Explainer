from typing import List, Dict, Any, Optional
from app.models.observation import Observation
from app.services.retrieval import RetrievalService
from app.services.safety import SafetyService
from app.core.logging import logger


class ExplanationService:
    @staticmethod
    def generate_explanation(
        observations: List[Observation],
        retrieved_chunks: List[Dict[str, Any]],
        user_question: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates schema-constrained structured explanation.
        """
        # Safety check on user question
        if user_question:
            is_safe, refusal_code, refusal_msg = SafetyService.evaluate_query_safety(user_question)
            if not is_safe:
                return {
                    "summary": refusal_msg,
                    "observations": [],
                    "questions_for_clinician": [
                        "Can you review my report findings in the context of my current health status?"
                    ],
                    "citations": [],
                    "limitations": [
                        "This tool does not provide diagnoses, prescriptions, or emergency clinical triage."
                    ],
                    "safety_status": refusal_code
                }

        # Build chunk lookup by test name
        chunk_map: Dict[str, Dict[str, Any]] = {}
        for c in retrieved_chunks:
            test_key = (c.get("canonical_test_name") or "").lower()
            if test_key and test_key not in chunk_map:
                chunk_map[test_key] = c

        obs_explanations = []
        flagged_high_or_low = []

        for obs in observations:
            test_norm = obs.test_name_normalized or obs.test_name_original
            test_key = test_norm.lower()
            matched_chunk = chunk_map.get(test_key)

            # Determine plain language explanation
            val_display = f"{obs.value_text} {obs.unit_original or ''}".strip()
            range_display = (
                obs.reference_text or
                (f"{obs.reference_low} - {obs.reference_high}" if obs.reference_low is not None and obs.reference_high is not None else "Not specified on report")
            )

            evidence_ids = [matched_chunk["chunk_id"]] if matched_chunk else []

            flag_desc = "within the reference interval printed on this report"
            if obs.reported_flag == "high":
                flag_desc = "higher than the upper reference limit printed on this report"
                flagged_high_or_low.append(test_norm)
            elif obs.reported_flag == "low":
                flag_desc = "lower than the lower reference limit printed on this report"
                flagged_high_or_low.append(test_norm)
            elif obs.reported_flag == "critical":
                flag_desc = "marked as significantly outside the standard laboratory threshold"
                flagged_high_or_low.append(test_norm)
            elif obs.reported_flag == "unknown":
                flag_desc = "without a definitive reference comparison"

            knowledge_context = ""
            if matched_chunk:
                # Extract first two sentences of knowledge chunk for clean summary
                sentences = matched_chunk["chunk_text"].split(". ")
                knowledge_context = " " + ". ".join(sentences[:2]) + "."

            plain_explanation = (
                f"{test_norm} was reported as {val_display}. This result is {flag_desc} ({range_display})."
                f"{knowledge_context}"
            )

            uncertainty_note = None
            if obs.validation_status == "needs_review":
                uncertainty_note = "Please verify this extracted value and unit against your original paper report."
            elif not obs.reference_low and not obs.reference_high and not obs.reference_text:
                uncertainty_note = "No printed reference interval was detected on the report for this specific parameter."

            obs_explanations.append({
                "observation_id": obs.id,
                "test_name": test_norm,
                "reported_value": val_display,
                "reported_flag": obs.reported_flag,
                "plain_language_explanation": plain_explanation,
                "evidence_ids": evidence_ids,
                "uncertainty_note": uncertainty_note
            })

        # Overall summary
        total_tests = len(observations)
        if flagged_high_or_low:
            summary_text = (
                f"This report contains {total_tests} extracted test parameters. "
                f"Of these, {len(flagged_high_or_low)} parameter(s) ({', '.join(flagged_high_or_low)}) "
                f"were flagged outside the printed reference intervals. "
                f"Laboratory reference ranges reflect standard benchmarks for this specific testing facility, "
                f"and slight variations are common across different testing methods. "
                f"A qualified physician will interpret these findings in combination with your overall clinical picture."
            )
        else:
            summary_text = (
                f"This report includes {total_tests} extracted test parameters. "
                f"All extracted parameters with printed reference ranges fall within their respective laboratory intervals. "
                f"Always consult your healthcare provider for an authoritative evaluation."
            )

        # Questions for clinician
        questions_for_clinician = [
            "What do these test results mean in the context of my symptoms and medical history?",
            "Do any out-of-range values require follow-up testing, lifestyle modifications, or treatment?",
            "When should I schedule my next laboratory evaluation to monitor these parameters?"
        ]
        if flagged_high_or_low:
            questions_for_clinician.insert(
                0,
                f"What factors (such as diet, hydration, exercise, or medications) might have influenced the flagged result for {flagged_high_or_low[0]}?"
            )

        # Citations list
        citations = []
        seen_chunks = set()
        for c in retrieved_chunks:
            if c["chunk_id"] not in seen_chunks:
                seen_chunks.add(c["chunk_id"])
                citations.append({
                    "source_id": c["source_id"],
                    "chunk_id": c["chunk_id"],
                    "title": c["title"],
                    "publisher": c["publisher"],
                    "source_url": c["source_url"],
                    "relevant_snippet": c["chunk_text"][:200] + "..."
                })

        limitations = [
            "This application provides educational explanations and does not diagnose illnesses or clinical conditions.",
            "Reference intervals vary by laboratory, reagent lot, testing methodology, age, and biological sex.",
            "Never alter or discontinue prescription medications without direct consultation with your healthcare provider."
        ]

        return {
            "summary": summary_text,
            "observations": obs_explanations,
            "questions_for_clinician": questions_for_clinician,
            "citations": citations,
            "limitations": limitations,
            "safety_status": "PASSED"
        }
