import re
from typing import List, Dict, Any, Optional
from app.core.logging import logger

# Common clinical test keywords to detect test names
COMMON_TEST_PATTERNS = [
    r"(?:Hemoglobin|Hgb|Hb)",
    r"(?:RBC|Red Blood Cells?)",
    r"(?:WBC|White Blood Cells?)",
    r"(?:Platelet(?: Count)?)",
    r"(?:Hematocrit|HCT)",
    r"(?:MCV|MCH|MCHC|RDW)",
    r"(?:Neutrophils?|Lymphocytes?|Monocytes?|Eosinophils?|Basophils?)",
    r"(?:Fasting Blood (?:Glucose|Sugar)|FBS|PPBS|Random Blood Sugar|HbA1c|Glycated Hemoglobin)",
    r"(?:Total Cholesterol|HDL|LDL|VLDL|Triglycerides)",
    r"(?:Serum Creatinine|Blood Urea Nitrogen|BUN|eGFR|Uric Acid)",
    r"(?:Sodium|Potassium|Chloride|Calcium|Phosphorus)",
    r"(?:Bilirubin Total|Bilirubin Direct|SGOT|AST|SGPT|ALT|Alkaline Phosphatase|ALP|Total Protein|Albumin|Globulin)",
    r"(?:TSH|Total T3|Total T4|Free T3|Free T4)",
    r"(?:Vitamin D|Vitamin B12|Iron|Ferritin)",
    r"(?:C-Reactive Protein|CRP|ESR)",
    r"(?:Hepatitis B Surface Antigen|HBsAg|Hepatitis C|HCV|HIV 1 & 2|VDRL)",
]

COMBINED_TEST_REGEX = re.compile(
    r"\b(" + "|".join(COMMON_TEST_PATTERNS) + r")\b",
    re.IGNORECASE
)

# Regex for numeric values with optional comparator (<, >, <=, >=)
VALUE_REGEX = re.compile(r"([<>]=?|<=|>=)?\s*([0-9]+(?:[\.,][0-9]+)?)")

# Regex for range like "12.0 - 15.5", "70-99", "< 200", "> 60", "<= 1.0", "12,0 - 15,5"
RANGE_REGEX = re.compile(
    r"(?:([0-9]+(?:[\.,][0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:[\.,][0-9]+)?)|([<>]=?)\s*([0-9]+(?:[\.,][0-9]+)?))",
    re.IGNORECASE
)

# Common qualitative medical results
QUALITATIVE_PATTERNS = [
    r"\b(non-reactive|reactive|negative|positive|not detected|detected|trace|pending)\b",
    r"\b(hemolyzed|quantity not sufficient|qns|sample clotted|clotted)\b"
]
COMBINED_QUAL_REGEX = re.compile("|".join(QUALITATIVE_PATTERNS), re.IGNORECASE)

# Common lab units
COMMON_UNITS = [
    "g/dL", "mg/dL", "mmol/L", "umol/L", "uIU/mL", "mIU/L", "ng/mL", "pg/mL",
    "%", "10^3/uL", "10^6/uL", "cells/mcL", "/cumm", "fl", "pg", "U/L", "IU/L",
    "mg/L", "ug/dL", "ng/dL", "pmol/L", "mEq/L", "sec", "mm/hr"
]

# Physical plausibility thresholds for OCR decimal point omission checks
MAGNITUDE_THRESHOLDS: Dict[str, float] = {
    "hemoglobin": 25.0,        # Normal ~12-17; 135 is likely 13.5
    "serum creatinine": 15.0,  # Normal ~0.6-1.2; 12 is likely 1.2
    "tsh": 150.0,              # Normal ~0.4-4.0; 48 is likely 4.8
    "potassium": 12.0,         # Normal ~3.5-5.0; 45 is likely 4.5
    "calcium": 20.0,           # Normal ~8.5-10.5; 92 is likely 9.2
    "total bilirubin": 30.0,   # Normal ~0.2-1.2; 11 is likely 1.1
}


class TableExtractor:
    @staticmethod
    def extract_rows(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        extracted_observations = []

        for page in pages:
            page_num = page.get("page_number", 1)
            raw_text = page.get("text", "")
            lines = raw_text.splitlines()

            for line in lines:
                line_str = line.strip()
                if not line_str or len(line_str) < 5:
                    continue

                # Strip potential prompt injection attempts from being treated as test names
                if re.search(r"ignore\s+(?:all\s+)?previous\s+instructions|system\s*:", line_str, re.IGNORECASE):
                    logger.warning(f"Ignored hostile prompt injection line on page {page_num}: {line_str[:50]}...")
                    continue

                # Check if this line contains a candidate test
                match = COMBINED_TEST_REGEX.search(line_str)
                if match:
                    test_name = match.group(1).strip()
                    remainder = line_str[match.end():].strip()

                    # 1. Detect units
                    found_unit = None
                    for u in sorted(COMMON_UNITS, key=len, reverse=True):
                        if re.search(r"\b" + re.escape(u) + r"\b", remainder, re.IGNORECASE):
                            found_unit = u
                            break

                    # 2. Detect reference range
                    range_match = RANGE_REGEX.search(remainder)
                    ref_low = None
                    ref_high = None
                    ref_text = None

                    if range_match:
                        ref_text = range_match.group(0).strip()
                        if range_match.group(1) and range_match.group(2):
                            low_s = range_match.group(1).replace(",", ".")
                            high_s = range_match.group(2).replace(",", ".")
                            try:
                                ref_low = float(low_s)
                                ref_high = float(high_s)
                            except ValueError:
                                pass
                        elif range_match.group(3) and range_match.group(4):
                            comp = range_match.group(3)
                            lim_s = range_match.group(4).replace(",", ".")
                            try:
                                limit = float(lim_s)
                                if "<" in comp:
                                    ref_high = limit
                                elif ">" in comp:
                                    ref_low = limit
                            except ValueError:
                                pass

                    # 3. Detect value (numeric or qualitative)
                    val_search_area = remainder
                    if ref_text:
                        val_search_area = remainder.replace(ref_text, " ")

                    value_match = VALUE_REGEX.search(val_search_area)
                    qual_match = COMBINED_QUAL_REGEX.search(val_search_area)

                    comparator = None
                    value_str = None
                    value_numeric = None
                    validation_status = "verified"
                    confidence = 0.95
                    discrepancy_note = None

                    if value_match:
                        comparator = value_match.group(1)
                        raw_val = value_match.group(2)
                        value_str = raw_val
                        # Normalize European decimal comma (e.g. 1,2 -> 1.2)
                        clean_numeric_str = raw_val.replace(",", ".")
                        try:
                            value_numeric = float(clean_numeric_str)
                        except ValueError:
                            value_numeric = None

                        # Check for suspected OCR decimal point omission
                        clean_test_key = test_name.lower().strip()
                        for known_test, max_sane_val in MAGNITUDE_THRESHOLDS.items():
                            if known_test in clean_test_key:
                                if value_numeric is not None and value_numeric > max_sane_val:
                                    confidence = 0.50
                                    validation_status = "needs_review"
                                    discrepancy_note = f"Suspected OCR magnitude anomaly / decimal point omission (value {value_numeric} exceeds expected threshold {max_sane_val}). Please verify against original paper."
                                    break

                    elif qual_match:
                        qual_val = qual_match.group(0).strip().title()
                        value_str = qual_val
                        value_numeric = None
                        if any(w in qual_val.lower() for w in ["hemolyzed", "clotted", "insufficient", "qns"]):
                            validation_status = "invalid"
                            discrepancy_note = "Laboratory reported specimen integrity compromise."
                    else:
                        # Value could not be identified confidently
                        value_str = "Indeterminate"
                        validation_status = "needs_review"
                        confidence = 0.40
                        discrepancy_note = "Could not parse a confident numeric or qualitative test value."

                    # 4. Detect lab printed flag
                    flag_match = re.search(r"\b(High|Low|Normal|Critical|Abnormal|Panic|Alert|H|L)\b", remainder, re.IGNORECASE)
                    reported_flag = "unknown"
                    if flag_match:
                        f = flag_match.group(1).lower()
                        if f in ("high", "h"):
                            reported_flag = "high"
                        elif f in ("low", "l"):
                            reported_flag = "low"
                        elif f in ("critical", "abnormal", "panic", "alert"):
                            reported_flag = "critical"
                        elif f == "normal":
                            reported_flag = "normal"

                    extracted_observations.append({
                        "test_name_original": test_name,
                        "value_text": f"{comparator or ''}{value_str}".strip(),
                        "value_numeric": value_numeric,
                        "comparator": comparator,
                        "unit_original": found_unit,
                        "reference_low": ref_low,
                        "reference_high": ref_high,
                        "reference_text": ref_text,
                        "reported_flag": reported_flag,
                        "validation_status": validation_status,
                        "extraction_confidence": confidence if found_unit else min(confidence, 0.70),
                        "discrepancy_note": discrepancy_note,
                        "source_page": page_num,
                        "source_snippet": line_str
                    })

        logger.info(f"Extracted {len(extracted_observations)} candidate observations from text")
        return extracted_observations
