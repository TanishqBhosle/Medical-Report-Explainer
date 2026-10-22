import json
import re
from typing import List, Dict, Any, Optional
import httpx

from app.models.observation import Observation
from app.services.safety import SafetyService
from app.core.config import settings
from app.core.logging import logger


class ExplanationService:
    @staticmethod
    def _generate_deterministic_explanation(
        observations: List[Observation],
        retrieved_chunks: List[Dict[str, Any]],
        user_question: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Guaranteed deterministic, schema-constrained clinical explanation generator.
        Provides the complete 5-point medical explanation for every parameter:
        1. What the report says
        2. What the flag means
        3. What it may mean
        4. What is unknown
        5. What to do next
        """
        # Chunk lookup
        chunk_map: Dict[str, Dict[str, Any]] = {}
        for c in retrieved_chunks:
            test_key = (c.get("canonical_test_name") or "").lower()
            if test_key and test_key not in chunk_map:
                chunk_map[test_key] = c

        def _get_field(obj: Any, field: str, default: Any = None) -> Any:
            if isinstance(obj, dict):
                return obj.get(field, default)
            return getattr(obj, field, default)

        obs_explanations = []
        flagged_items = []
        critical_items = []
        conflict_items = []

        for obs in observations:
            test_norm = _get_field(obs, "test_name_normalized") or _get_field(obs, "test_name_original") or "Test"
            test_key = test_norm.lower()
            matched_chunk = chunk_map.get(test_key)

            val_text = _get_field(obs, "value_text", "")
            unit_orig = _get_field(obs, "unit_original") or _get_field(obs, "unit_normalized") or ""
            val_display = f"{val_text} {unit_orig}".strip()

            ref_low = _get_field(obs, "reference_low")
            ref_high = _get_field(obs, "reference_high")
            ref_text = _get_field(obs, "reference_text")
            range_display = (
                ref_text or
                (f"{ref_low} - {ref_high}" if ref_low is not None and ref_high is not None else "Not printed on report")
            )

            evidence_ids = [matched_chunk["chunk_id"]] if matched_chunk else []

            # 1. What the flag means
            flag = _get_field(obs, "reported_flag", "unknown")
            if flag == "critical":
                flag_desc = "marked as a CRITICAL / PANIC laboratory value requiring prompt clinical review"
                critical_items.append(test_norm)
            elif flag == "high":
                flag_desc = "higher than the upper reference interval printed on this report"
                flagged_items.append(test_norm)
            elif flag == "low":
                flag_desc = "lower than the lower reference interval printed on this report"
                flagged_items.append(test_norm)
            elif flag == "conflict":
                flag_desc = "showing a discrepancy between the printed laboratory flag and the numerical range"
                conflict_items.append(test_norm)
            elif flag == "normal":
                flag_desc = "within the printed reference interval for this testing facility"
            else:
                flag_desc = "without a definitive reference comparison"

            # 2. What it may mean (from evidence)
            knowledge_snippet = ""
            if matched_chunk:
                sentences = matched_chunk["chunk_text"].split(". ")
                knowledge_snippet = " " + ". ".join(sentences[:2]) + "."

            # 3. What is unknown & limitations
            unknown_factors = []
            if not obs.reference_low and not obs.reference_high and not obs.reference_text:
                unknown_factors.append("Specific laboratory reference range was omitted from the report.")
            if obs.validation_status == "needs_review":
                unknown_factors.append("Extraction confidence was lower than standard. Please check the original printed sheet.")
            if obs.flag_conflict:
                unknown_factors.append(obs.discrepancy_note or "Discrepancy detected between laboratory flag and printed range.")

            unknown_str = " ".join(unknown_factors) if unknown_factors else "Interpretation depends on patient fasting status, current medications, age, and biological sex."

            # 4. Synthesize complete 5-point explanation
            full_explanation = (
                f"[Report Observation]: {test_norm} was reported as {val_display} (Laboratory range: {range_display}). "
                f"[Flag Meaning]: This value is {flag_desc}. "
                f"[Clinical Context]:{knowledge_snippet} "
                f"[Unknowns]: {unknown_str} "
                f"[Next Steps]: Discuss this result alongside symptoms and full medical history with your healthcare provider."
            )

            obs_explanations.append({
                "observation_id": obs.id,
                "test_name": test_norm,
                "reported_value": val_display,
                "reported_flag": obs.reported_flag,
                "plain_language_explanation": full_explanation,
                "evidence_ids": evidence_ids,
                "uncertainty_note": unknown_str if unknown_factors else None
            })

        # Overall summary
        total_tests = len(observations)
        if critical_items:
            summary = (
                f"URGENT REVIEW NOTICE: This report contains {len(critical_items)} result(s) marked as CRITICAL ({', '.join(critical_items)}). "
                f"Please contact your ordering healthcare provider or testing laboratory promptly for clinical guidance."
            )
        elif conflict_items:
            summary = (
                f"This report contains {total_tests} extracted parameter(s), with {len(conflict_items)} parameter(s) ({', '.join(conflict_items)}) "
                f"displaying a discrepancy between the printed lab flag and numerical interval. "
                f"Please verify these specific lines directly with your physician."
            )
        elif flagged_items:
            summary = (
                f"This report includes {total_tests} extracted diagnostic test(s). "
                f"Of these, {len(flagged_items)} parameter(s) ({', '.join(flagged_items)}) fall outside the printed reference intervals. "
                f"Reference intervals represent typical facility baselines, and individual results must be interpreted by your clinician in light of your full medical background."
            )
        else:
            summary = (
                f"This report includes {total_tests} extracted test parameter(s). "
                f"All extracted measurements with printed reference ranges fall within their respective laboratory intervals. "
                f"Always consult your healthcare provider to review these results in the context of your overall health."
            )

        # Questions for clinician
        questions_for_clinician = [
            "What do these specific findings mean in the context of my current symptoms and health history?",
            "Are any repeat tests or lifestyle adjustments recommended based on these results?",
            "When should I schedule my next follow-up laboratory evaluation?"
        ]
        if critical_items or flagged_items:
            target_test = critical_items[0] if critical_items else flagged_items[0]
            questions_for_clinician.insert(0, f"What clinical factors might explain the out-of-range result for {target_test}?")

        # Citations list
        citations = []
        seen = set()
        for c in retrieved_chunks:
            if c["chunk_id"] not in seen:
                seen.add(c["chunk_id"])
                citations.append({
                    "source_id": c["source_id"],
                    "chunk_id": c["chunk_id"],
                    "title": c["title"],
                    "publisher": c["publisher"],
                    "source_url": c["source_url"],
                    "relevant_snippet": c["chunk_text"][:220] + "..."
                })

        # Limitations
        limitations = [
            "This application provides educational explanations and does not diagnose disease or prescribe medications.",
            "Reference intervals vary across laboratories, testing instruments, patient age, and biological sex.",
            "Never alter or discontinue prescription medications without explicit guidance from your physician."
        ]

        # Add detected high-risk context warnings
        all_text = " ".join([o.test_name_original for o in observations] + [user_question or ""])
        high_risk_warnings = SafetyService.detect_high_risk_contexts(all_text)
        limitations.extend(high_risk_warnings)

        return {
            "summary": summary,
            "observations": obs_explanations,
            "questions_for_clinician": questions_for_clinician,
            "citations": citations,
            "limitations": limitations,
            "safety_status": "PASSED"
        }

    @classmethod
    def generate_explanation(
        cls,
        observations: List[Observation],
        retrieved_chunks: List[Dict[str, Any]],
        user_question: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates safe explanation generation with safety checks, non-reported test detection,
        Gemini LLM integration, and deterministic safe fallback.
        """
        # Step 1: Pre-generation Safety check on question
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

            # Step 2: Edge Case: Question asks about a test NOT in the report
            # Check if query references common lab test names not in observations
            test_names_in_report = set()
            for o in observations:
                name = (o.get("test_name_normalized") or o.get("test_name_original")) if isinstance(o, dict) else (o.test_name_normalized or o.test_name_original)
                if name:
                    test_names_in_report.add(name.lower())
            # Also include tokens
            tokens_in_report = set()
            for tn in test_names_in_report:
                tokens_in_report.update(tn.split())

            query_lower = user_question.lower()
            unreported_tests_found = []
            known_unreported_candidates = [
                "ferritin", "vitamin d", "vitamin b12", "cholesterol", "hdl", "ldl",
                "triglycerides", "creatinine", "hemoglobin", "tsh", "alt", "ast",
                "uric acid", "calcium", "potassium", "sodium", "bilirubin", "hba1c"
            ]
            for cand in known_unreported_candidates:
                if cand in query_lower and cand not in tokens_in_report:
                    unreported_tests_found.append(cand.title())

            if unreported_tests_found and not any(t in query_lower for t in tokens_in_report):
                missing_test_name = unreported_tests_found[0]
                return {
                    "summary": f"The test parameter '{missing_test_name}' is not present in your uploaded medical report. ReportExplainer only explains tests that were actually evaluated and printed by your laboratory. Please check if this test was ordered under a separate document.",
                    "observations": [],
                    "questions_for_clinician": [
                        f"Was a {missing_test_name} test ordered as part of my recent laboratory evaluation?"
                    ],
                    "citations": [],
                    "limitations": [
                        "Explanations are strictly limited to parameters present in the uploaded document."
                    ],
                    "safety_status": "TEST_NOT_IN_REPORT"
                }

        # Step 3: Attempt Gemini LLM generation if GEMINI_API_KEY is available
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
            try:
                llm_result = cls._call_gemini_api(observations, retrieved_chunks, user_question)
                if llm_result:
                    # Post-generation Output Validation
                    is_valid, validation_err = SafetyService.validate_llm_output(llm_result.get("summary", ""))
                    if is_valid:
                        return llm_result
                    else:
                        logger.warning(f"Gemini output failed validation: {validation_err}. Triggering deterministic fallback.")
            except Exception as e:
                logger.error(f"Gemini API call failed or timed out: {e}. Falling back to deterministic generator.")

        # Step 4: Deterministic grounded clinical explanation
        return cls._generate_deterministic_explanation(observations, retrieved_chunks, user_question)

    @classmethod
    def _call_gemini_api(
        cls,
        observations: List[Observation],
        retrieved_chunks: List[Dict[str, Any]],
        user_question: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """
        Calls Google Gemini API with untrusted document delimiters and structured response constraints.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"

        # Construct safe prompt
        obs_summary_lines = [
            f"- {o.test_name_normalized or o.test_name_original}: {o.value_text} {o.unit_original or ''} (Range: {o.reference_text or f'{o.reference_low}-{o.reference_high}'}, Flag: {o.reported_flag})"
            for o in observations[:15]
        ]
        evidence_summary_lines = [
            f"- [{c['title']}]: {c['chunk_text'][:200]}"
            for c in retrieved_chunks[:5]
        ]

        system_instruction = (
            "You are an educational medical report explanation assistant. "
            "Explain laboratory results in calm, simple, patient-friendly language. "
            "STRICT SAFETY RULES: "
            "1. NEVER diagnose the user with any disease. "
            "2. NEVER prescribe, recommend, or modify any medication or dose. "
            "3. NEVER reassure that severe symptoms are harmless because a test is normal. "
            "4. NEVER invent report values or medical facts not present in the supplied data. "
            "5. Always recommend consulting the ordering physician."
        )

        prompt = (
            f"<untrusted_report_data>\n" +
            "\n".join(obs_summary_lines) +
            f"\n</untrusted_report_data>\n\n"
            f"<clinical_evidence>\n" +
            "\n".join(evidence_summary_lines) +
            f"\n</clinical_evidence>\n\n"
            f"User Question: {user_question or 'Please provide a clear educational explanation of this report.'}\n"
            f"Provide a structured JSON response with keys: 'summary', 'questions_for_clinician' (array), 'limitations' (array)."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text_part = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_part)

                # Merge with deterministic observation breakdown to ensure zero factual drift
                det_result = cls._generate_deterministic_explanation(observations, retrieved_chunks, user_question)
                return {
                    "summary": parsed.get("summary", det_result["summary"]),
                    "observations": det_result["observations"],
                    "questions_for_clinician": parsed.get("questions_for_clinician", det_result["questions_for_clinician"]),
                    "citations": det_result["citations"],
                    "limitations": parsed.get("limitations", det_result["limitations"]),
                    "safety_status": "PASSED"
                }
        return None
