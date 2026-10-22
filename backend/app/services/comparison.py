from typing import List, Dict, Any, Optional
from app.models.report import Report
from app.models.observation import Observation
from app.core.logging import logger


class ComparisonService:
    @staticmethod
    def compare_reports(
        report_a: Report,
        obs_a: List[Observation],
        report_b: Report,
        obs_b: List[Observation]
    ) -> Dict[str, Any]:
        """
        Compares two reports owned by the same user.
        Report A is typically baseline / earlier; Report B is follow-up / later.
        """
        # Index observations by normalized test name
        map_a: Dict[str, Observation] = {}
        for o in obs_a:
            key = (o.test_name_normalized or o.test_name_original).strip().lower()
            map_a[key] = o

        map_b: Dict[str, Observation] = {}
        for o in obs_b:
            key = (o.test_name_normalized or o.test_name_original).strip().lower()
            map_b[key] = o

        matched_params = []
        matched_keys = set()

        for key, item_a in map_a.items():
            if key in map_b:
                matched_keys.add(key)
                item_b = map_b[key]

                # Check unit compatibility
                unit_a = (item_a.unit_normalized or item_a.unit_original or "").strip().lower()
                unit_b = (item_b.unit_normalized or item_b.unit_original or "").strip().lower()

                is_comparable = True
                reason = None
                numeric_delta = None

                if unit_a and unit_b and unit_a != unit_b:
                    is_comparable = False
                    reason = f"Unit mismatch: '{item_a.unit_original}' vs '{item_b.unit_original}'. Cannot compute numerical delta without calibrated clinical conversion."
                elif item_a.value_numeric is not None and item_b.value_numeric is not None:
                    numeric_delta = round(item_b.value_numeric - item_a.value_numeric, 4)
                else:
                    if item_a.value_numeric is None or item_b.value_numeric is None:
                        is_comparable = False
                        reason = "One or both measurements lack a parsed numeric quantity."

                test_display = item_b.test_name_normalized or item_a.test_name_normalized or item_a.test_name_original

                ref_a = item_a.reference_text or (f"{item_a.reference_low} - {item_a.reference_high}" if item_a.reference_low and item_a.reference_high else None)
                ref_b = item_b.reference_text or (f"{item_b.reference_low} - {item_b.reference_high}" if item_b.reference_low and item_b.reference_high else None)

                matched_params.append({
                    "test_name": test_display,
                    "is_comparable": is_comparable,
                    "incompatibility_reason": reason,
                    "unit_a": item_a.unit_original,
                    "unit_b": item_b.unit_original,
                    "value_text_a": item_a.value_text,
                    "value_text_b": item_b.value_text,
                    "value_numeric_a": item_a.value_numeric,
                    "value_numeric_b": item_b.value_numeric,
                    "numeric_delta": numeric_delta,
                    "flag_a": item_a.reported_flag,
                    "flag_b": item_b.reported_flag,
                    "reference_a": ref_a,
                    "reference_b": ref_b
                })

        unmatched_a = [
            (o.test_name_normalized or o.test_name_original)
            for k, o in map_a.items() if k not in matched_keys
        ]
        unmatched_b = [
            (o.test_name_normalized or o.test_name_original)
            for k, o in map_b.items() if k not in matched_keys
        ]

        notes = [
            "Comparisons reflect changes between report dates and assume compatible collection methodologies.",
            "Changes in numeric values should be evaluated by a healthcare provider alongside lifestyle, medications, and testing variances."
        ]

        return {
            "report_id_a": report_a.id,
            "report_id_b": report_b.id,
            "document_date_a": report_a.document_date,
            "document_date_b": report_b.document_date,
            "matched_parameters": matched_params,
            "unmatched_parameters_a": unmatched_a,
            "unmatched_parameters_b": unmatched_b,
            "notes": notes
        }
