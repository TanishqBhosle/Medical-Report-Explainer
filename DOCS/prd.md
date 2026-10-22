# Medical Report Explainer — Product Requirements Document (PRD)

**Status:** Approved  
**Version:** 1.0  
**Target Audience:** Patients, caregivers, and health-conscious individuals who want to understand their laboratory and diagnostic reports in plain language.

---

## 1. Problem Statement

Medical lab reports are dense, filled with technical acronyms (e.g., MCV, eGFR, SGPT), varied measurement units, and confusing laboratory-specific reference intervals. Patients often turn to search engines, leading to anxiety, misinterpretation, and self-diagnosis. 

There is an urgent need for a patient-centric, safety-first application that translates complex report data into plain language, explains what individual tests evaluate, highlights when values are outside the printed reference range, and suggests questions to ask a doctor—without ever attempting to diagnose illness or prescribe treatments.

---

## 2. Product Goals & Non-Goals

### 2.1 Goals
1. **Plain-Language Demystification:** Explain complex clinical terms, metrics, and report summaries in accessible language (8th-grade reading level).
2. **Deterministic Provenance:** Show the exact original text, values, units, reference intervals, and page snippets extracted from the report.
3. **Deterministic Flagging:** Compare values solely against the laboratory's printed reference range. Never guess or hallucinate abnormal status.
4. **Source Grounding & Citations:** Provide verifiable links and quotes from vetted, authoritative clinical sources (e.g., MedlinePlus, Lab Tests Online, CDC).
5. **Report Comparison:** Enable longitudinal tracking of parameters across multiple user-uploaded reports with compatible units.
6. **Privacy & Control:** Ensure strict user-scoped data isolation, private encrypted storage, and instant user-driven data deletion.

### 2.2 Non-Goals (Explicit Boundaries)
- **NO Diagnoses:** The application will never diagnose any condition or state that an abnormal marker "proves" a disease.
- **NO Prescriptions or Treatment Advice:** The application will never suggest starting, stopping, or altering medications or treatments.
- **NO Emergency Triage:** The application will direct users with urgent symptoms immediately to qualified clinicians or emergency care.
- **NO Diagnostic Image Interpretation:** The system extracts text and structured tables from PDFs and images; it does not diagnose X-rays, MRIs, or CT scans.

---

## 3. User Personas

1. **The Anxious Patient:** Received a routine blood panel online with flagged markers and wants to understand what the markers mean before their doctor's appointment next week.
2. **The Chronic Condition Caregiver:** Manages quarterly metabolic and kidney reports for an elderly parent and needs to track values over time to prepare focused questions for the specialist.
3. **The Health-Literate Individual:** Reviews annual health checkup results, seeking clear explanations of lipid panels and vitamins without wading through contradictory online forums.

---

## 4. Key Functional Requirements

### 4.1 Document Ingestion & Processing
- **File Types:** Digital PDF, scanned PDF, JPG, PNG.
- **Validation:** Enforce maximum file size (15 MB), maximum page limits (10 pages), and verify binary MIME signatures.
- **Processing Flow:** Asynchronous job execution (`UPLOADED → QUEUED → PROCESSING → COMPLETED / NEEDS_REVIEW`).
- **Extraction:** Dual-tier text extraction (digital text parsing with PyMuPDF, OCR fallback for scanned images and low-density text).
- **Provenance Tracking:** Retain page number, bounding snippet, and confidence score for every extracted observation.

### 4.2 Normalization & Deterministic Range Flagging
- **Normalized Canonical Naming:** Map lab test names (e.g., "Hemoglobin", "Hb", "HGB") to canonical entities while preserving verbatim report text.
- **Deterministic Range Flagging:** Classify values as `low`, `normal`, `high`, `critical`, or `unknown` solely by mathematical comparison against the printed reference range.
- **Uncertainty & Review State:** When a unit is missing, incompatible, or OCR confidence is low, classify as `needs_review` and prompt the user to inspect their original report.

### 4.3 Grounded Explanations & RAG
- **Approved Knowledge Base:** Curated medical reference library (MedlinePlus, NIH, CDC, AACC/Lab Tests Online).
- **Schema-Constrained LLM Generation:** Strictly structured responses containing:
  - Plain-language summary
  - Per-observation explanation
  - Questions for the patient's clinician
  - Verifiable citation IDs linking to source knowledge chunks
  - Limitations notice
- **Safety Abstention:** Immediate abstention and referral to a physician whenever a query asks for a diagnosis, medication change, or clinical decision.

### 4.4 Longitudinal Comparison
- Match verified observations across two reports belonging to the authenticated user.
- Highlight changes across dates only when measurement units and analyte identities are compatible.
- Present trends factually without value judgements (avoiding unqualified "good" or "bad" labels).

### 4.5 Data Ownership & Privacy
- Zero cross-user visibility; enforced object-level authorization on all operations.
- Full user-directed deletion: instantly remove database records, derived text, knowledge citations, and private stored files.

---

## 5. Non-Functional Requirements

- **Reliability:** 99.9% uptime for core API; idempotent job processing.
- **Security:** HTTPS/TLS, JWT authentication with short-lived tokens, bcrypt password hashing, input sanitization, and automated PHI redaction from logs.
- **Performance:** Asynchronous processing response < 200ms; digital PDF extraction < 5s; plain-language explanation generation < 10s.
- **Accessibility:** WCAG 2.2 AA compliant UI, high-contrast readable typography, accessible keyboard navigation, and responsive layouts across mobile, tablet, and desktop.
