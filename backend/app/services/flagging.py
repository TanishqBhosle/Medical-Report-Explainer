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
    ) -> Tuple[str, str]:
        """
        Determines the deterministic flag and validation status.
        Returns: (computed_flag, validation_status)
        Flags: 'low', 'normal', 'high', 'critical', 'unknown'
        Status: 'verified', 'needs_review', 'invalid'
        """
        # If qualitative (e.g. positive / negative / reactive)
        if qualitative_text:
            clean_qual = qualitative_text.lower().strip()
            if any(w in clean_qual for w in ["reactive", "positive", "detected"]):
                return "high", "verified"
            if any(w in clean_qual for w in ["non-reactive", "negative", "not detected"]):
                return "normal", "verified"

        # If value numeric is missing
        if value_numeric is None:
            if lab_reported_flag and lab_reported_flag in ("low", "normal", "high", "critical"):
                return lab_reported_flag, "needs_review"
            return "unknown", "needs_review"

        # If no reference range low and high
        if ref_low is None and ref_high is None:
            if lab_reported_flag and lab_reported_flag != "unknown":
                return lab_reported_flag, "needs_review"
            return "unknown", "needs_review"

        # Upper bound only (e.g. < 200 or ref_high = 200)
        if ref_low is None and ref_high is not None:
            if comparator == "<" and value_numeric <= ref_high:
                return "normal", "verified"
            if value_numeric > ref_high:
                # Check critical threshold (> 2x upper limit or > 1.5x)
                if value_numeric >= (ref_high * 2.0):
                    return "critical", "verified"
                return "high", "verified"
            return "normal", "verified"

        # Lower bound only (e.g. > 60 or ref_low = 60)
        if ref_high is None and ref_low is not None:
            if comparator == ">" and value_numeric >= ref_low:
                return "normal", "verified"
            if value_numeric < ref_low:
                if value_numeric <= (ref_low * 0.5):
                    return "critical", "verified"
                return "low", "verified"
            return "normal", "verified"

        # Both ref_low and ref_high exist
        if ref_low is not None and ref_high is not None:
            # Handle inverted range anomalies if any
            low_bound = min(ref_low, ref_high)
            high_bound = max(ref_low, ref_high)

            if value_numeric < low_bound:
                if value_numeric <= (low_bound * 0.5):
                    return "critical", "verified"
                return "low", "verified"
            elif value_numeric > high_bound:
                if value_numeric >= (high_bound * 2.0):
                    return "critical", "verified"
                return "high", "verified"
            else:
                return "normal", "verified"

        return "unknown", "needs_review"

    @classmethod
    def apply_flagging(cls, obs: Dict[str, Any]) -> Dict[str, Any]:
        val_numeric = obs.get("value_numeric")
        ref_low = obs.get("reference_low")
        ref_high = obs.get("reference_high")
        comp = obs.get("comparator")
        val_text = obs.get("value_text")
        lab_flag = obs.get("reported_flag", "unknown")

        computed_flag, val_status = cls.evaluate_flag(
            value_numeric=val_numeric,
            ref_low=ref_low,
            ref_high=ref_high,
            comparator=comp,
            qualitative_text=val_text if val_numeric is None else None,
            lab_reported_flag=lab_flag
        )

        return {
            **obs,
            "reported_flag": computed_flag if computed_flag != "unknown" else lab_flag,
            "validation_status": val_status
        }
