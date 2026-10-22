from typing import Optional, Dict, Any, Tuple


class FlaggingService:
    @staticmethod
    def evaluate_flag(
        value_numeric: Optional[float],
        ref_low: Optional[float],
        ref_high: Optional[float],
        comparator: Optional[str] = None,
        qualitative_text: Optional[str] = None,
        lab_reported_flag: Optional[str] = None
    ) -> Tuple[str, str, bool, Optional[str]]:
        """
        Determines the deterministic flag and validation status with discrepancy detection.
        Returns: (computed_flag, validation_status, flag_conflict, discrepancy_note)
        Flags: 'low', 'normal', 'high', 'critical', 'unknown', 'conflict'
        Status: 'verified', 'needs_review', 'invalid'
        """
        # If specimen is invalid or compromised
        if qualitative_text:
            clean_qual = qualitative_text.lower().strip()
            if any(w in clean_qual for w in ["hemolyzed", "clotted", "insufficient", "qns"]):
                return "unknown", "invalid", False, "Specimen was rejected or compromised by the laboratory."
            if any(w in clean_qual for w in ["reactive", "positive", "detected"]):
                return "high", "verified", False, None
            if any(w in clean_qual for w in ["non-reactive", "negative", "not detected"]):
                return "normal", "verified", False, None
            if "trace" in clean_qual:
                return "low", "verified", False, None

        # If value numeric is missing
        if value_numeric is None:
            if lab_reported_flag and lab_reported_flag in ("low", "normal", "high", "critical"):
                return lab_reported_flag, "needs_review", False, "Numeric value missing; preserved laboratory printed flag."
            return "unknown", "needs_review", False, "Cannot determine from the available report."

        # If no reference range low and high
        if ref_low is None and ref_high is None:
            if lab_reported_flag and lab_reported_flag != "unknown":
                return lab_reported_flag, "needs_review", False, "Numeric reference range absent; preserved laboratory printed flag."
            return "unknown", "needs_review", False, "Cannot determine from the available report."

        # Compute calculated flag based strictly on printed numbers and comparators
        computed_flag = "unknown"
        val_status = "verified"

        # Upper bound only (e.g. < 200, <= 1.0)
        if ref_low is None and ref_high is not None:
            if comparator in ("<", "<=") and value_numeric <= ref_high:
                computed_flag = "normal"
            elif value_numeric > ref_high:
                computed_flag = "critical" if value_numeric >= (ref_high * 2.0) else "high"
            else:
                computed_flag = "normal"

        # Lower bound only (e.g. > 60, >= 50)
        elif ref_high is None and ref_low is not None:
            if comparator in (">", ">=") and value_numeric >= ref_low:
                computed_flag = "normal"
            elif value_numeric < ref_low:
                computed_flag = "critical" if value_numeric <= (ref_low * 0.5) else "low"
            else:
                computed_flag = "normal"

        # Bounded interval [low, high]
        elif ref_low is not None and ref_high is not None:
            low_bound = min(ref_low, ref_high)
            high_bound = max(ref_low, ref_high)

            if value_numeric < low_bound:
                computed_flag = "critical" if value_numeric <= (low_bound * 0.5) else "low"
            elif value_numeric > high_bound:
                computed_flag = "critical" if value_numeric >= (high_bound * 2.0) else "high"
            else:
                computed_flag = "normal"

        # Explicit lab critical flag takes priority
        if lab_reported_flag == "critical":
            computed_flag = "critical"

        # Discrepancy check: Laboratory printed flag conflicts with calculated flag
        flag_conflict = False
        discrepancy_note = None

        if lab_reported_flag and lab_reported_flag not in ("unknown", None):
            # Conflict: Lab says high/low but computed says normal
            if lab_reported_flag in ("high", "critical") and computed_flag == "normal":
                flag_conflict = True
                computed_flag = "conflict"
                val_status = "needs_review"
                discrepancy_note = "Laboratory marked this test as High, but value falls within the printed numerical range. Please verify with ordering clinician."
            elif lab_reported_flag == "low" and computed_flag == "normal":
                flag_conflict = True
                computed_flag = "conflict"
                val_status = "needs_review"
                discrepancy_note = "Laboratory marked this test as Low, but value falls within the printed numerical range. Please verify with ordering clinician."
            elif lab_reported_flag == "normal" and computed_flag in ("high", "low", "critical"):
                flag_conflict = True
                computed_flag = "conflict"
                val_status = "needs_review"
                discrepancy_note = "Laboratory marked this test as Normal, but value is outside the printed numerical interval. Please verify with ordering clinician."

        return computed_flag, val_status, flag_conflict, discrepancy_note

    @classmethod
    def apply_flagging(cls, obs: Dict[str, Any]) -> Dict[str, Any]:
        val_numeric = obs.get("value_numeric")
        ref_low = obs.get("reference_low")
        ref_high = obs.get("reference_high")
        comp = obs.get("comparator")
        val_text = obs.get("value_text")
        lab_flag = obs.get("reported_flag", "unknown")

        computed_flag, val_status, flag_conflict, disc_note = cls.evaluate_flag(
            value_numeric=val_numeric,
            ref_low=ref_low,
            ref_high=ref_high,
            comparator=comp,
            qualitative_text=val_text if val_numeric is None else None,
            lab_reported_flag=lab_flag
        )

        existing_note = obs.get("discrepancy_note")
        final_note = disc_note or existing_note

        return {
            **obs,
            "reported_flag": computed_flag if computed_flag != "unknown" else lab_flag,
            "validation_status": val_status,
            "flag_conflict": flag_conflict,
            "discrepancy_note": final_note
        }
