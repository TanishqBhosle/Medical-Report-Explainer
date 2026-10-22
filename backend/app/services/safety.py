import re
from typing import Tuple, Optional, List


class SafetyService:
    DIAGNOSIS_PATTERNS = [
        r"\b(?:diagnose\s+me|do\s+i\s+have|what\s+disease|tell\s+me\s+my\s+illness|am\s+i\s+sick)\b",
        r"\b(?:is\s+it\s+cancer|do\s+i\s+have\s+diabetes|confirm\s+diagnosis|what\s+condition\s+do\s+i\s+have)\b",
        r"\b(?:could\s+this\s+be\s+a\s+tumor|is\s+this\s+leukemia|is\s+this\s+hiv)\b"
    ]

    PRESCRIPTION_PATTERNS = [
        r"\b(?:should\s+i\s+take|stop\s+taking|change\s+my\s+dosage|prescribe|what\s+medicine|how\s+much\s+mg\s+of)\b",
        r"\b(?:can\s+i\s+stop|increase\s+dose|decrease\s+dose|cure\s+this\s+with|which\s+drug)\b",
        r"\b(?:ignore\s+my\s+doctor|self-medicate|replace\s+my\s+meds)\b"
    ]

    EMERGENCY_PATTERNS = [
        r"\b(?:chest\s+pain|heart\s+attack|can't\s+breathe|severe\s+shortness\s+of\s+breath|unconscious|coughing\s+blood)\b",
        r"\b(?:stroke|sudden\s+numbness|overdose|emergency|severe\s+allergic|anaphylaxis|crushing\s+pain)\b",
        r"\b(?:loss\s+of\s+vision|slurred\s+speech|severe\s+headache\s+worst\s+of\s+my\s+life)\b"
    ]

    PROMPT_INJECTION_PATTERNS = [
        r"(?:ignore\s+(?:all\s+)?previous\s+instructions)",
        r"(?:disregard\s+(?:the\s+)?system\s+prompt)",
        r"(?:system\s*:\s*you\s+are\s+now)",
        r"(?:DAN\s+mode|jailbreak|bypass\s+filters)",
        r"(?:reveal\s+(?:your\s+)?system\s+prompt)",
        r"(?:print\s+(?:your\s+)?(?:secret\s+)?instructions)",
        r"(?:send\s+this\s+report\s+to)",
        r"(?:override\s+all\s+safety\s+rules)",
        r"(?:developer\s+mode\s+enabled)"
    ]

    HIGH_RISK_CONTEXT_PATTERNS = [
        r"\b(pregnant|pregnancy|trimester)\b",
        r"\b(infant|pediatric|child|newborn|baby)\b",
        r"\b(chemotherapy|cancer\s+treatment|immunosuppressed|transplant)\b",
        r"\b(warfarin|coumadin|blood\s+thinner|anticoagulant|heparin)\b"
    ]

    PROHIBITED_OUTPUT_PATTERNS = [
        r"\b(?:you\s+have\s+(?:diabetes|cancer|leukemia|anemia|kidney\s+disease|hypertension))\b",
        r"\b(?:i\s+diagnose\s+you)\b",
        r"\b(?:stop\s+taking\s+your|discontinue\s+your|increase\s+your\s+dose|decrease\s+your\s+dose)\b",
        r"\b(?:start\s+taking|take\s+\d+\s*mg|prescribe)\b",
        r"\b(?:ignore\s+your\s+(?:doctor|clinician|physician))\b",
        r"\b(?:you\s+do\s+not\s+need\s+a\s+doctor)\b"
    ]

    @classmethod
    def evaluate_query_safety(cls, query: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Evaluates input query for clinical safety, emergency symptoms, and prompt injection.
        Returns: (is_safe, refusal_reason, safe_response)
        """
        lower_q = query.lower()

        # 1. Prompt injection check
        for pat in cls.PROMPT_INJECTION_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "PROMPT_INJECTION_DETECTED", (
                    "I am an educational medical report explanation assistant. I cannot follow instructions to override safety guidelines, disclose internal prompts, or alter document facts."
                )

        # 2. Emergency check: Even if a lab report appears normal, acute symptoms must be escalated
        for pat in cls.EMERGENCY_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "EMERGENCY_ESCALATION", (
                    "CRITICAL MEDICAL ALERT: Even if your laboratory report shows normal results, severe symptoms such as acute chest pain, shortness of breath, sudden numbness, or a medical crisis require immediate medical attention. Call your local emergency services (e.g. 911 / 112) or go to the nearest emergency room immediately. Laboratory results do not rule out acute medical emergencies."
                )

        # 3. Diagnosis check
        for pat in cls.DIAGNOSIS_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "DIAGNOSIS_REFUSAL", (
                    "This application is designed solely to explain medical report terminology and printed reference intervals. It cannot diagnose illnesses, determine medical conditions, or estimate disease probability. Please discuss these test results directly with your physician, who will interpret them in the context of your complete medical history, symptoms, and physical examination."
                )

        # 4. Prescription check
        for pat in cls.PRESCRIPTION_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "PRESCRIPTION_REFUSAL", (
                    "This application strictly does not provide medication advice, prescriptions, or recommendations to adjust dosages. You should never start, stop, or change any prescription or over-the-counter medication without explicit instructions from your prescribing doctor or pharmacist."
                )

        return True, None, None

    @classmethod
    def detect_high_risk_contexts(cls, text: str) -> List[str]:
        """
        Detects sensitive contexts requiring extra conservative disclaimers.
        """
        contexts = []
        lower = text.lower()
        if re.search(r"\b(pregnant|pregnancy|trimester)\b", lower):
            contexts.append("Pregnancy alters physiological plasma volume and laboratory reference intervals (especially hemoglobin, alkaline phosphatase, and thyroid markers).")
        if re.search(r"\b(infant|pediatric|child|newborn|baby)\b", lower):
            contexts.append("Pediatric reference intervals differ substantially from adult standards and shift rapidly by age in months.")
        if re.search(r"\b(chemotherapy|cancer\s+treatment|immunosuppressed|transplant)\b", lower):
            contexts.append("Immunosuppression and chemotherapy profoundly affect white blood cells, platelets, and organ markers, requiring close oncological oversight.")
        if re.search(r"\b(warfarin|coumadin|blood\s+thinner|anticoagulant|heparin)\b", lower):
            contexts.append("Anticoagulant therapy requires strict, clinician-managed target intervals to balance clotting and bleeding risks.")
        return contexts

    @classmethod
    def validate_llm_output(cls, generated_text: str) -> Tuple[bool, Optional[str]]:
        """
        Validates post-generation text against prohibited diagnosis, prescription, or reckless reassurance.
        """
        lower = generated_text.lower()
        for pat in cls.PROHIBITED_OUTPUT_PATTERNS:
            if re.search(pat, lower, re.IGNORECASE):
                return False, f"LLM output violated medical safety rule: pattern '{pat}' detected."
        return True, None
