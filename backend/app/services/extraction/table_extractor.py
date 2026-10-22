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
]

COMBINED_TEST_REGEX = re.compile(
    r"\b(" + "|".join(COMMON_TEST_PATTERNS) + r")[^\w\n]*([A-Za-z0-9_\-\s]+)?",
    re.IGNORECASE
)

# Regex for numeric values with optional comparator (<, >, <=, >=)
VALUE_REGEX = re.compile(r"([<>]=?|<=|>=)?\s*([0-9]+(?:\.[0-9]+)?)")

# Regex for range like "12.0 - 15.5", "70-99", "< 200", "> 60"
RANGE_REGEX = re.compile(
    r"(?:([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:\.[0-9]+)?)|([<>]=?)\s*([0-9]+(?:\.[0-9]+)?))",
    re.IGNORECASE
)

# Common lab units
COMMON_UNITS = [
    "g/dL", "mg/dL", "mmol/L", "umol/L", "uIU/mL", "mIU/L", "ng/mL", "pg/mL",
    "%", "10^3/uL", "10^6/uL", "cells/mcL", "/cumm", "fl", "pg", "U/L", "IU/L",
    "mg/L", "ug/dL", "ng/dL", "pmol/L", "mEq/L", "sec", "mm/hr"
]


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

                # Check if this line contains a candidate test
                match = COMBINED_TEST_REGEX.search(line_str)
                if match:
                    test_name_match = match.group(0).strip()
                    # Clean up test name
                    test_name = re.split(r"\s{2,}|\t", test_name_match)[0].strip()

                    # Find values and ranges in remainder of the line
                    remainder = line_str[match.end():] if match.end() < len(line_str) else line_str

                    # Detect units
                    found_unit = None
                    for u in sorted(COMMON_UNITS, key=len, reverse=True):
                        if re.search(r"\b" + re.escape(u) + r"\b", remainder, re.IGNORECASE):
                            found_unit = u
                            break

                    # Detect reference range
                    range_match = RANGE_REGEX.search(remainder)
                    ref_low = None
                    ref_high = None
                    ref_text = None

                    if range_match:
                        ref_text = range_match.group(0).strip()
                        if range_match.group(1) and range_match.group(2):
                            ref_low = float(range_match.group(1))
                            ref_high = float(range_match.group(2))
                        elif range_match.group(3) and range_match.group(4):
                            comp = range_match.group(3)
                            limit = float(range_match.group(4))
                            if "<" in comp:
                                ref_high = limit
                            elif ">" in comp:
                                ref_low = limit

                    # Detect value
                    # Remove the range substring first so we don't pick up the range numbers as test value
                    val_search_area = remainder
                    if ref_text:
                        val_search_area = remainder.replace(ref_text, " ")

                    value_match = VALUE_REGEX.search(val_search_area)
                    if value_match:
                        comparator = value_match.group(1)
                        value_str = value_match.group(2)
                        value_numeric = float(value_str) if value_str else None

                        # Check for printed flags (High, Low, Normal, H, L, Abnormal, Critical)
                        flag_match = re.search(r"\b(High|Low|Normal|Critical|Abnormal|H|L)\b", remainder, re.IGNORECASE)
                        reported_flag = "unknown"
                        if flag_match:
                            f = flag_match.group(1).lower()
                            if f in ("high", "h"):
                                reported_flag = "high"
                            elif f in ("low", "l"):
                                reported_flag = "low"
                            elif f in ("critical", "abnormal"):
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
                            "source_page": page_num,
                            "source_snippet": line_str,
                            "extraction_confidence": 0.95 if (value_numeric is not None and found_unit) else 0.70
                        })

        logger.info(f"Extracted {len(extracted_observations)} candidate observations from text")
        return extracted_observations
