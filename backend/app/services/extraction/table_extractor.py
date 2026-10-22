import re
from typing import List, Dict, Any, Optional, Tuple
from app.core.logging import logger

# Comprehensive clinical test keywords covering hematology, CBC, infectious diseases, biochemistry, etc.
COMMON_TEST_PATTERNS = [
    # Hematology & CBC & Differential
    r"(?:Hemoglobin|Hgb|Hb)",
    r"(?:RBC|Red Blood Cells?|Total (?:RBC|Red Blood Count))",
    r"(?:WBC|White Blood Cells?|Total (?:Leukocyte|Leucocyte) Count|TLC)",
    r"(?:Platelets?|Platelet Count|Total Platelet Count)",
    r"(?:Hematocrit|HCT|Packed Cell Volume|PCV)",
    r"(?:MCV|MCH|MCHC|RDW(?:-CV|-SD)?|MPV)",
    r"(?:Neutrophils?|Lymphocytes?|Monocytes?|Eosinophils?|Basophils?|Band Cells?)",
    r"(?:Absolute (?:Neutrophil|Lymphocyte|Monocyte|Eosinophil|Basophil) Count|ANC|ALC|AEC)",
    r"(?:ESR|Erythrocyte Sedimentation Rate)",

    # Infectious Diseases & Serology (including Dengue, Malaria, Typhoid, Hepatitis, HIV)
    r"(?:DENGUE(?: VIRUS)? NS1 (?:ANTIGEN|AG))",
    r"(?:DENGUE(?: VIRUS)? (?:IG\s*M|IG\s*G)(?: ANTIBODY)?)",
    r"(?:Dengue Serology)",
    r"(?:Malaria (?:Antigen|Parasite|Pv|Pf)|Widal(?: Test)?|Typhoid)",
    r"(?:Hepatitis B Surface Antigen|HBsAg|Hepatitis C|HCV|HIV(?: 1 & 2)?|VDRL|Syphilis)",
    r"(?:COVID-19|SARS-CoV-2)",

    # Metabolic & Glucose
    r"(?:Fasting Blood (?:Glucose|Sugar)|FBS|PPBS|Post Prandial Blood (?:Sugar|Glucose)|Random Blood (?:Sugar|Glucose)|RBS|HbA1c|Glycated Hemoglobin|Estimated Average Glucose|eAG)",
    
    # Lipids
    r"(?:Total Cholesterol|Serum Cholesterol|HDL(?: Cholesterol)?|LDL(?: Cholesterol)?|VLDL(?: Cholesterol)?|Triglycerides|Non-HDL Cholesterol)",
    
    # Renal & Electrolytes
    r"(?:Serum Creatinine|Creatinine|Blood Urea Nitrogen|BUN|Serum Urea|Blood Urea|eGFR|Uric Acid)",
    r"(?:Sodium|Potassium|Chloride|Calcium|Phosphorus|Magnesium|Bicarbonate)",

    # Liver Function
    r"(?:Bilirubin Total|Total Bilirubin|Bilirubin Direct|Direct Bilirubin|Bilirubin Indirect|SGOT|AST|SGPT|ALT|Alkaline Phosphatase|ALP|Total Protein|Serum Albumin|Albumin|Serum Globulin|Globulin|A:G Ratio|GGT)",

    # Thyroid & Endocrine
    r"(?:TSH|Thyroid Stimulating Hormone|Total T3|Total T4|Free T3|FT3|Free T4|FT4)",

    # Vitamins & Iron Studies & Inflammation
    r"(?:Vitamin D|25-OH Vitamin D|Vitamin B12|Serum Iron|Ferritin|TIBC|Total Iron Binding Capacity)",
    r"(?:C-Reactive Protein|CRP|hs-CRP|Procalcitonin|Troponin(?: [IT])?|CK-MB|D-Dimer|Prothrombin Time|PT|INR|APTT)",
]

COMBINED_TEST_REGEX = re.compile(
    r"\b(" + "|".join(COMMON_TEST_PATTERNS) + r")\b",
    re.IGNORECASE
)

# Regex for numeric values with optional comparator (<, >, <=, >=)
VALUE_REGEX = re.compile(r"([<>]=?|<=|>=)?\s*([0-9]+(?:[\.,][0-9]+)?)")

# Regex for ranges like "12.0 - 15.5", "70-99", "< 200", "> 60", "<= 1.0", "12,0 - 15,5"
RANGE_REGEX = re.compile(
    r"(?:([0-9]+(?:[\.,][0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:[\.,][0-9]+)?)|([<>]=?)\s*([0-9]+(?:[\.,][0-9]+)?))",
    re.IGNORECASE
)

# Common qualitative results
QUALITATIVE_PATTERNS = [
    r"\b(non-reactive|reactive|negative|positive|not detected|detected|trace|pending|provisional)\b",
    r"\b(hemolyzed|quantity not sufficient|qns|sample clotted|clotted)\b"
]
COMBINED_QUAL_REGEX = re.compile("|".join(QUALITATIVE_PATTERNS), re.IGNORECASE)

# Common lab units (ordered by descending length for greedy matching)
COMMON_UNITS = [
    "Index Value", "index value", "Index", "index",
    "cells/mcL", "10^3/uL", "10^6/uL", "/cumm",
    "mmol/L", "umol/L", "uIU/mL", "mIU/L", "pmol/L", "mEq/L",
    "g/dL", "mg/dL", "ng/mL", "pg/mL", "ug/dL", "ng/dL", "mg/L",
    "%", "fl", "pg", "U/L", "IU/L", "sec", "mm/hr", "ratio"
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

# Non-test header keywords to ignore
NON_TEST_HEADER_KEYWORDS = [
    "INVESTIGATION", "OBSERVED VALUE", "RESULT INTERPRETATION", "REFERENCE RANGE",
    "PATIENT NAME", "DOCTOR", "REPORT DATE", "SAMPLE DATE", "VISIT NO", "LAB NO",
    "MR NO", "PAGE 1 OF", "PAGE 2 OF", "INTERPRETATION OF RESULTS", "AUTHORIZED BY",
    "MICROBIOLOGY", "BIOCHEMISTRY", "HEMATOLOGY", "PATHOLOGY", "END OF THE REPORT"
]


class TableExtractor:
    @staticmethod
    def _is_non_test_line(text: str) -> bool:
        t_upper = text.upper().strip()
        for kw in NON_TEST_HEADER_KEYWORDS:
            if kw in t_upper and len(t_upper) < len(kw) + 15:
                return True
        return False

    @staticmethod
    def _parse_range_string(range_str: str) -> Tuple[Optional[float], Optional[float], Optional[str]]:
        range_match = RANGE_REGEX.search(range_str)
        if not range_match:
            return None, None, None

        ref_low = None
        ref_high = None
        matched_text = range_match.group(0).strip()

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

        return ref_low, ref_high, matched_text

    @classmethod
    def extract_rows(cls, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        extracted_observations: List[Dict[str, Any]] = []

        for page in pages:
            page_num = page.get("page_number", 1)
            raw_text = page.get("text") or "\n".join(page.get("lines", [])) or ""
            lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
            consumed_indices = set()

            # Pass 1: Multi-Column & Single-Line Layout Extraction
            for i, line_str in enumerate(lines):
                if i in consumed_indices:
                    continue

                if len(line_str) < 4:
                    continue

                # Strip potential prompt injection attempts
                if re.search(r"ignore\s+(?:all\s+)?previous\s+instructions|system\s*:", line_str, re.IGNORECASE):
                    logger.warning(f"Ignored hostile prompt injection on page {page_num}: {line_str[:50]}...")
                    continue

                if cls._is_non_test_line(line_str):
                    continue

                # Check if this line contains a candidate test keyword or structure
                test_match = COMBINED_TEST_REGEX.search(line_str)
                test_name = None
                remainder = ""

                if test_match:
                    test_name = test_match.group(1).strip()
                    remainder = line_str[test_match.end():].strip()
                else:
                    # Check for generic multi-column row: Test Label [2+ spaces] Numeric/Qualitative Value
                    layout_match = re.match(
                        r"^([A-Za-z0-9\s\(\)\/\-\.\+]{3,45}?)\s{2,}([0-9]+(?:[\.,][0-9]+)?|[<>=]\s*[0-9]+(?:[\.,][0-9]+)?|Positive|Negative|Reactive|Non-Reactive|Detected|Not Detected)\s*(.*)$",
                        line_str,
                        re.IGNORECASE
                    )
                    if layout_match:
                        cand_name = layout_match.group(1).strip()
                        if not cls._is_non_test_line(cand_name) and not re.search(r"\b(?:Report|Date|Doctor|Hospital|Phone|Patient|Name|Age|Sex|Page|Time)\b", cand_name, re.IGNORECASE):
                            test_name = cand_name
                            remainder = f"{layout_match.group(2)} {layout_match.group(3)}".strip()

                if not test_name:
                    continue

                # Look for sub-row or auxiliary line (e.g. method or reference printed directly beneath)
                next_line_str = ""
                if i + 1 < len(lines):
                    candidate_sub = lines[i + 1].strip()
                    # If candidate_sub starts with parentheses (e.g. (Serum, ELFA)) or contains a reference range or interpretation
                    if (
                        candidate_sub.startswith("(")
                        or re.search(r"NEGATIVE|POSITIVE|NORMAL|<|>|\bIndex Value\b", candidate_sub, re.IGNORECASE)
                        and not COMBINED_TEST_REGEX.search(candidate_sub)
                    ):
                        next_line_str = candidate_sub
                        consumed_indices.add(i + 1)

                full_context = f"{remainder} {next_line_str}".strip()

                # 1. Detect units
                found_unit = None
                for u in sorted(COMMON_UNITS, key=len, reverse=True):
                    if re.search(r"\b" + re.escape(u) + r"\b", full_context, re.IGNORECASE):
                        found_unit = u
                        break

                # 2. Detect reference range
                ref_low, ref_high, ref_text = cls._parse_range_string(full_context)

                # 3. Detect value (numeric or qualitative)
                val_search_area = remainder if remainder else full_context
                if ref_text:
                    val_search_area = val_search_area.replace(ref_text, " ")

                value_match = VALUE_REGEX.search(val_search_area)
                qual_match = COMBINED_QUAL_REGEX.search(val_search_area)

                # If no value in remainder, check next line
                if not value_match and not qual_match and next_line_str:
                    val_search_area = next_line_str
                    if ref_text:
                        val_search_area = val_search_area.replace(ref_text, " ")
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
                    # Skip rows where no value whatsoever could be found
                    continue

                # 4. Detect lab printed flag / interpretation
                flag_match = re.search(r"\b(High|Low|Normal|Critical|Abnormal|Panic|Alert|H|L|Negative|Positive|Reactive|Non-Reactive)\b", full_context, re.IGNORECASE)
                reported_flag = "unknown"
                if flag_match:
                    f = flag_match.group(1).lower()
                    if f in ("high", "h", "positive", "reactive"):
                        reported_flag = "high"
                    elif f in ("low", "l"):
                        reported_flag = "low"
                    elif f in ("critical", "abnormal", "panic", "alert"):
                        reported_flag = "critical"
                    elif f in ("normal", "negative", "non-reactive"):
                        reported_flag = "normal"

                # 5. Single-sided cutoff flag calculation (e.g. < 1.0 is normal / negative)
                if re.search(r"\b(?:positive|reactive)\b\s*[>]=?", full_context, re.IGNORECASE):
                    # In infectious serology, POSITIVE > cutoff means cutoff is the upper normal boundary
                    if ref_low is not None and ref_high is None:
                        ref_high = ref_low
                        ref_low = None
                        ref_text = f"< {ref_high} ({found_unit or 'Index Value'}) Negative"
                        if value_numeric is not None:
                            reported_flag = "normal" if value_numeric <= ref_high else "high"

                if reported_flag == "unknown" and value_numeric is not None:
                    if ref_high is not None and ref_low is None:
                        reported_flag = "normal" if value_numeric <= ref_high else "high"
                    elif ref_low is not None and ref_high is None:
                        reported_flag = "normal" if value_numeric >= ref_low else "low"
                    elif ref_low is not None and ref_high is not None:
                        if value_numeric < ref_low:
                            reported_flag = "low"
                        elif value_numeric > ref_high:
                            reported_flag = "high"
                        else:
                            reported_flag = "normal"

                # Format clean snippet
                snippet = f"{line_str} {next_line_str}".strip() if next_line_str else line_str

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
                    "extraction_confidence": confidence if found_unit or ref_text else min(confidence, 0.75),
                    "discrepancy_note": discrepancy_note,
                    "source_page": page_num,
                    "source_snippet": snippet
                })

            # Pass 2: Multi-Line Block Fallback (if Pass 1 extracted 0 rows on this page)
            if not any(o["source_page"] == page_num for o in extracted_observations):
                for i, line_str in enumerate(lines):
                    if i in consumed_indices or len(line_str) < 3:
                        continue

                    test_match = COMBINED_TEST_REGEX.search(line_str)
                    if test_match:
                        test_name = test_match.group(1).strip()
                        # Peek at lines i+1, i+2, i+3 to locate value and reference range
                        val_str = None
                        val_num = None
                        ref_low = None
                        ref_high = None
                        ref_text = None
                        unit = None
                        flag = "unknown"

                        for next_offset in range(1, 4):
                            if i + next_offset < len(lines):
                                cand_line = lines[i + next_offset].strip()
                                # Check for value
                                vm = VALUE_REGEX.search(cand_line)
                                if vm and val_str is None:
                                    val_str = vm.group(2)
                                    try:
                                        val_num = float(val_str.replace(",", "."))
                                    except ValueError:
                                        pass
                                # Check for range
                                rl, rh, rt = cls._parse_range_string(cand_line)
                                if rt:
                                    ref_low, ref_high, ref_text = rl, rh, rt
                                # Check for unit
                                for u in sorted(COMMON_UNITS, key=len, reverse=True):
                                    if re.search(r"\b" + re.escape(u) + r"\b", cand_line, re.IGNORECASE):
                                        unit = u
                                        break

                        if val_str is not None:
                            if ref_high is not None and val_num is not None:
                                flag = "normal" if val_num <= ref_high else "high"
                            elif ref_low is not None and val_num is not None:
                                flag = "normal" if val_num >= ref_low else "low"

                            extracted_observations.append({
                                "test_name_original": test_name,
                                "value_text": val_str,
                                "value_numeric": val_num,
                                "comparator": None,
                                "unit_original": unit,
                                "reference_low": ref_low,
                                "reference_high": ref_high,
                                "reference_text": ref_text,
                                "reported_flag": flag,
                                "validation_status": "verified",
                                "extraction_confidence": 0.85,
                                "discrepancy_note": None,
                                "source_page": page_num,
                                "source_snippet": line_str
                            })

        # Deduplicate observations per page by canonical test name
        unique_observations: List[Dict[str, Any]] = []
        seen_keys = set()
        for obs in extracted_observations:
            key = (obs["source_page"], obs["test_name_original"].lower().strip())
            if key not in seen_keys:
                seen_keys.add(key)
                unique_observations.append(obs)

        logger.info(f"Extracted {len(unique_observations)} validated observations from {len(pages)} pages")
        return unique_observations
