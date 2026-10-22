import re
from typing import Tuple, Optional


class SafetyService:
    DIAGNOSIS_PATTERNS = [
        r"\b(?:diagnose\s+me|do\s+i\s+have|what\s+disease|tell\s+me\s+my\s+illness|am\s+i\s+sick)\b",
        r"\b(?:is\s+it\s+cancer|do\s+i\s+have\s+diabetes|confirm\s+diagnosis)\b",
    ]

    PRESCRIPTION_PATTERNS = [
        r"\b(?:should\s+i\s+take|stop\s+taking|change\s+my\s+dosage|prescribe|what\s+medicine|how\s+much\s+mg\s+of)\b",
        r"\b(?:can\s+i\s+stop|increase\s+dose|decrease\s+dose|cure\s+this\s+with)\b",
    ]

    EMERGENCY_PATTERNS = [
        r"\b(?:chest\s+pain|heart\s+attack|can't\s+breathe|severe\s+shortness\s+of\s+breath|unconscious|coughing\s+blood)\b",
        r"\b(?:stroke|sudden\s+numbness|overdose|emergency)\b",
    ]

    PROMPT_INJECTION_PATTERNS = [
        r"(?:ignore\s+(?:all\s+)?previous\s+instructions)",
        r"(?:disregard\s+(?:the\s+)?system\s+prompt)",
        r"(?:system\s*:\s*you\s+are\s+now)",
        r"(?:DAN\s+mode|jailbreak|bypass\s+filters)",
    ]

    @classmethod
    def evaluate_query_safety(cls, query: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Evaluates input query for clinical safety and prompt injection.
        Returns: (is_safe, refusal_reason, safe_response)
        """
        lower_q = query.lower()

        # Prompt injection check
        for pat in cls.PROMPT_INJECTION_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "PROMPT_INJECTION_DETECTED", (
                    "I am an educational medical report explanation assistant. I cannot follow instructions to override safety guidelines or alter document facts."
                )

        # Emergency check
        for pat in cls.EMERGENCY_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "EMERGENCY_ESCALATION", (
                    "URGENT: If you or someone you know is experiencing severe symptoms such as acute chest pain, shortness of breath, sudden numbness, or a medical crisis, please contact your local emergency services (e.g. 911 / 112) or go to the nearest emergency room immediately. This application cannot provide emergency triage or clinical care."
                )

        # Diagnosis check
        for pat in cls.DIAGNOSIS_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "DIAGNOSIS_REFUSAL", (
                    "This application is designed solely to explain medical report terminology and printed reference intervals. It cannot diagnose illnesses, determine medical conditions, or estimate disease probability. Please discuss these test results directly with your physician, who will interpret them in the context of your complete medical history, symptoms, and physical examination."
                )

        # Prescription check
        for pat in cls.PRESCRIPTION_PATTERNS:
            if re.search(pat, lower_q, re.IGNORECASE):
                return False, "PRESCRIPTION_REFUSAL", (
                    "This application strictly does not provide medication advice, prescriptions, or recommendations to adjust dosages. You should never start, stop, or change any prescription or over-the-counter medication without explicit instructions from your prescribing doctor or pharmacist."
                )

        return True, None, None
