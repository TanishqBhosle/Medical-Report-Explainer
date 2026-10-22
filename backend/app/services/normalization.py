import re
from typing import Dict, Any, Tuple, Optional

CANONICAL_TEST_MAPPING: Dict[str, str] = {
    # CBC
    "hb": "Hemoglobin",
    "hgb": "Hemoglobin",
    "hemoglobin": "Hemoglobin",
    "rbc": "Red Blood Cell Count",
    "red blood cell": "Red Blood Cell Count",
    "red blood cells": "Red Blood Cell Count",
    "wbc": "White Blood Cell Count",
    "white blood cell": "White Blood Cell Count",
    "white blood cells": "White Blood Cell Count",
    "platelet": "Platelet Count",
    "platelets": "Platelet Count",
    "platelet count": "Platelet Count",
    "hematocrit": "Hematocrit",
    "hct": "Hematocrit",
    "mcv": "Mean Corpuscular Volume (MCV)",
    "mch": "Mean Corpuscular Hemoglobin (MCH)",
    "mchc": "MCHC",
    "rdw": "Red Cell Distribution Width (RDW)",
    "neutrophils": "Neutrophils",
    "lymphocytes": "Lymphocytes",
    "monocytes": "Monocytes",
    "eosinophils": "Eosinophils",
    "basophils": "Basophils",

    # Metabolic & Glucose
    "fasting blood sugar": "Fasting Blood Glucose",
    "fasting blood glucose": "Fasting Blood Glucose",
    "fbs": "Fasting Blood Glucose",
    "post prandial blood sugar": "Postprandial Blood Glucose",
    "ppbs": "Postprandial Blood Glucose",
    "random blood sugar": "Random Blood Glucose",
    "rbs": "Random Blood Glucose",
    "hba1c": "Glycated Hemoglobin (HbA1c)",
    "glycated hemoglobin": "Glycated Hemoglobin (HbA1c)",

    # Renal & Electrolytes
    "serum creatinine": "Serum Creatinine",
    "creatinine": "Serum Creatinine",
    "blood urea nitrogen": "Blood Urea Nitrogen (BUN)",
    "bun": "Blood Urea Nitrogen (BUN)",
    "egfr": "Estimated Glomerular Filtration Rate (eGFR)",
    "uric acid": "Uric Acid",
    "sodium": "Sodium",
    "potassium": "Potassium",
    "chloride": "Chloride",
    "calcium": "Calcium",

    # Lipids
    "total cholesterol": "Total Cholesterol",
    "cholesterol": "Total Cholesterol",
    "hdl": "HDL Cholesterol",
    "hdl cholesterol": "HDL Cholesterol",
    "ldl": "LDL Cholesterol",
    "ldl cholesterol": "LDL Cholesterol",
    "vldl": "VLDL Cholesterol",
    "triglycerides": "Triglycerides",

    # Liver Function
    "bilirubin total": "Total Bilirubin",
    "total bilirubin": "Total Bilirubin",
    "bilirubin direct": "Direct Bilirubin",
    "direct bilirubin": "Direct Bilirubin",
    "sgot": "AST (SGOT)",
    "ast": "AST (SGOT)",
    "sgpt": "ALT (SGPT)",
    "alt": "ALT (SGPT)",
    "alkaline phosphatase": "Alkaline Phosphatase (ALP)",
    "alp": "Alkaline Phosphatase (ALP)",
    "total protein": "Total Protein",
    "albumin": "Albumin",
    "globulin": "Globulin",

    # Thyroid & Vitamins
    "tsh": "Thyroid Stimulating Hormone (TSH)",
    "total t3": "Total T3",
    "total t4": "Total T4",
    "free t3": "Free T3",
    "free t4": "Free T4",
    "vitamin d": "Vitamin D (25-OH)",
    "vitamin b12": "Vitamin B12",
}

CANONICAL_UNITS: Dict[str, str] = {
    "mg/dl": "mg/dL",
    "g/dl": "g/dL",
    "mmol/l": "mmol/L",
    "umol/l": "umol/L",
    "ui/ml": "uIU/mL",
    "uiu/ml": "uIU/mL",
    "miu/l": "mIU/L",
    "ng/ml": "ng/mL",
    "pg/ml": "pg/mL",
    "%": "%",
    "fl": "fL",
    "pg": "pg",
    "u/l": "U/L",
    "iu/l": "IU/L",
    "mg/l": "mg/L",
    "ug/dl": "ug/dL",
    "10^3/ul": "10^3/uL",
    "10^6/ul": "10^6/uL",
    "cells/mcl": "cells/mcL",
    "/cumm": "/cumm",
    "meq/l": "mEq/L",
    "mm/hr": "mm/hr",
}


class NormalizationService:
    @staticmethod
    def normalize_test_name(original_name: str) -> Tuple[str, str]:
        """
        Returns (canonical_name, original_name)
        """
        clean = re.sub(r"[^a-zA-Z0-9\s]", "", original_name).strip().lower()
        for pattern, canonical in CANONICAL_TEST_MAPPING.items():
            if pattern == clean or clean.startswith(pattern) or pattern in clean:
                return canonical, original_name
        return original_name.title(), original_name

    @staticmethod
    def normalize_unit(original_unit: Optional[str]) -> Optional[str]:
        if not original_unit:
            return None
        clean = original_unit.strip().lower()
        return CANONICAL_UNITS.get(clean, original_unit)

    @classmethod
    def normalize_observation(cls, obs: Dict[str, Any]) -> Dict[str, Any]:
        norm_name, orig_name = cls.normalize_test_name(obs.get("test_name_original", ""))
        norm_unit = cls.normalize_unit(obs.get("unit_original"))

        return {
            **obs,
            "test_name_normalized": norm_name,
            "unit_normalized": norm_unit,
        }
