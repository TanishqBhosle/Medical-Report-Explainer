# Medical Report Explainer — Architecture

**Status:** Implementation blueprint  
**Version:** 1.0  
**Purpose:** Define the high-level design (HLD), low-level design (LLD), repository structure, and technology stack for the Medical Report Explainer.

## 1. System goals and boundaries

The application helps users understand the contents of medical reports in plain language. It accepts PDF and image reports, extracts structured values, compares values with reference ranges printed in the report, retrieves relevant information from trusted health sources, and generates explanations with citations.

### In scope
- Upload PDF, JPG, and PNG reports.
- Extract text and tables from digital PDFs; use OCR for scanned documents and images.
- Store extracted observations with units, reference ranges, source locations, and extraction confidence.
- Explain report content in plain language using retrieval-augmented generation (RAG).
- Highlight values relative to the report's own reference ranges.
- Compare reports belonging to the same authorized user.
- Provide report-grounded question answering and source citations.
- Provide deletion, access control, and operational monitoring.

### Out of scope for the initial release
- Diagnosing diseases or estimating disease probability.
- Prescribing medicines, changing treatment, or replacing a clinician.
- Interpreting medical images such as X-rays as a diagnostic model.
- Emergency triage or clinical decision support.
- Making claims that an abnormal result necessarily means disease.

## 2. High-Level Design (HLD)

### 2.1 Logical architecture

```text
┌──────────────────────────────┐
│ React + TypeScript Web UI    │
│ Upload · Results · History   │
└──────────────┬───────────────┘
               │ HTTPS / REST
┌──────────────▼───────────────┐
│ FastAPI API Layer            │
│ Auth · Validation · Rate limit│
└──────┬──────────────┬────────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌─────────────────────┐
│ Report       │  │ Explanation / Q&A   │
│ Processing   │  │ Orchestrator        │
└──────┬───────┘  └──────────┬──────────┘
       │                     │
       ▼                     ▼
┌──────────────┐  ┌─────────────────────┐
│ PDF parser / │  │ Medical RAG          │
│ OCR / tables │  │ Keyword + vector     │
└──────┬───────┘  │ retrieval + reranker │
       │          └──────────┬──────────┘
       ▼                     ▼
┌──────────────────────────────────────┐
│ Validation and domain services       │
│ Units · ranges · provenance · safety │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ PostgreSQL + pgvector                │
│ Users · reports · observations       │
│ jobs · explanations · citations      │
└──────────────────────────────────────┘
                   │
                   ▼
        Encrypted file/object storage
```

### 2.2 Component responsibilities

| Component | Responsibility |
|---|---|
| Web UI | Upload, processing state, report results, explanations, history, comparison, deletion |
| API layer | Authentication, ownership checks, request validation, rate limits, API contracts |
| Ingestion service | File validation, malware scanning integration, storage, job creation |
| Extraction service | Digital PDF text/table extraction; OCR fallback for scanned pages |
| Normalization service | Normalize labels, parse numeric values, preserve original values/units, validate ranges |
| Flagging service | Compare numeric values only when units/range semantics are compatible |
| RAG service | Retrieve trusted medical reference chunks and report-specific evidence |
| Explanation service | Generate structured, source-grounded, patient-friendly explanations |
| Safety service | Reject diagnosis/prescription requests; add uncertainty and clinician guidance |
| Comparison service | Match same parameters across reports, account for units and dates |
| Persistence layer | Store metadata, structured observations, citations, job states, audit events |
| Background worker | Process long-running OCR/extraction tasks asynchronously |
| Observability | Structured logs, metrics, tracing, redacted error reporting |

### 2.3 Deployment topology

**MVP:** One React static deployment, one containerized FastAPI service, one PostgreSQL database with pgvector, and private object storage for uploaded files. A lightweight worker process can run separately from the API. Use managed services where possible.

Do not introduce microservices, Kafka, Kubernetes, or a separate vector database until measured scale or operational needs justify them. Keep components modular so the worker and retrieval system can be separated later.

### 2.4 Trust boundaries and privacy

- All traffic uses HTTPS.
- Uploaded files are private and never served from public buckets.
- Every report query is scoped to the authenticated owner.
- Files are scanned and size/type validated before parsing.
- Secrets are stored in environment variables or a secrets manager.
- Logs must not contain report text, names, dates of birth, or raw medical values unless explicitly approved for a protected diagnostic workflow.
- Define retention and deletion behavior before production.
- Send only the minimum necessary content to any external LLM/OCR provider; review its retention and data-processing terms first.
- Use synthetic or properly authorized data for development and evaluation.

## 3. Low-Level Design (LLD)

### 3.1 Report processing sequence

1. Client requests an upload session or sends a multipart upload.
2. API authenticates the user and validates file size, extension, MIME signature, and page limits.
3. Store the original file in private object storage; create a `report` record with `UPLOADED` status.
4. Create a processing job and return `202 Accepted` with a job/report ID.
5. Worker extracts digital text and tables. If text coverage is low, rasterize pages and run OCR.
6. Parser identifies candidate test rows and fields: test name, value, unit, reference range, and abnormal marker.
7. Normalizer validates numeric formats and units; original text and page/region provenance are preserved.
8. Validation service marks fields as verified, uncertain, or requiring user review. It does not silently guess missing units or values.
9. Flagging service compares values against the report's own reference range only when comparison is valid.
10. RAG retrieves approved medical reference chunks relevant to the report's terms and the user's question.
11. LLM generates a schema-constrained explanation using only supplied report facts and retrieved context.
12. Output validator checks schema, citations, prohibited diagnosis/prescription claims, and unsupported assertions.
13. Persist result, citations, warnings, and job status; notify client by polling the job endpoint.
14. Client displays results and makes uncertainty visible.

### 3.2 Explanation sequence

```text
User question
  → Authenticate and authorize report access
  → Load verified report observations
  → Retrieve relevant approved medical references
  → Build prompt with report facts + retrieved evidence
  → Generate structured explanation
  → Validate JSON, citations, and safety rules
  → Return answer with source references and limitations
```

If retrieval yields insufficient evidence, the system must say it cannot provide a reliable explanation rather than inventing an answer.

### 3.3 Suggested backend modules

- `api/routes/`: HTTP endpoints only; no business logic.
- `schemas/`: Pydantic request/response models.
- `services/ingestion.py`: upload orchestration and file lifecycle.
- `services/extraction/`: PDF parsing, OCR, table extraction adapters.
- `services/normalization.py`: canonical names, units, range parsing.
- `services/flagging.py`: deterministic range comparison.
- `services/retrieval.py`: keyword/vector retrieval and reranking.
- `services/explanation.py`: LLM orchestration and structured outputs.
- `services/safety.py`: safety checks and response policy.
- `services/comparison.py`: longitudinal comparison.
- `repositories/`: database access.
- `workers/`: asynchronous processing jobs.
- `core/config.py`: typed settings.
- `core/logging.py`: redacted structured logs.
- `tests/`: unit, integration, safety, and end-to-end tests.

### 3.4 Processing states

`UPLOADED → QUEUED → PROCESSING → NEEDS_REVIEW or COMPLETED`

Terminal/error states: `FAILED`, `REJECTED`, `DELETED`.

Every transition should include a timestamp and a safe error code. A retry must be idempotent and must not create duplicate observations.

### 3.5 LLM output contract

Return validated structured output, for example:

```json
{
  "summary": "A plain-language summary based on the uploaded report.",
  "observations": [
    {
      "observation_id": "uuid",
      "plain_language_explanation": "Explanation of the test and its reported value.",
      "reported_flag": "high",
      "evidence_ids": ["source-chunk-id"],
      "uncertainty_note": "Reference ranges vary by laboratory and context."
    }
  ],
  "questions_for_clinician": [
    "What does this result mean in the context of my symptoms and history?"
  ],
  "limitations": [
    "This tool explains a report and does not diagnose a condition."
  ]
}
```

The `reported_flag` must be derived from deterministic validation and the report's range—not freely invented by the LLM. The exact response schema should be versioned.

## 4. Recommended technology stack

| Layer | Recommended choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast, typed web UI |
| Styling | Tailwind CSS | Consistent responsive UI |
| Charts | Recharts | Report trends and comparisons |
| API | Python + FastAPI | Typed, async-friendly REST API |
| Validation | Pydantic | Strict API and LLM output schemas |
| Digital PDF | PyMuPDF | Text extraction and page metadata |
| Tables | pdfplumber or Camelot where suitable | Table extraction fallback |
| OCR | Tesseract initially; provider adapter for managed OCR if needed | Scanned report support |
| Image processing | Pillow | Safe image conversion and preprocessing |
| LLM | Provider-neutral adapter to a hosted model API | Explanation and structured output |
| Embeddings | Provider-neutral embedding interface | Semantic retrieval |
| Retrieval | PostgreSQL full-text search + pgvector; optional reranker | Hybrid retrieval without extra infrastructure |
| Database | PostgreSQL + SQLAlchemy 2 + Alembic | Relational integrity and migrations |
| Background jobs | RQ/Celery or a simple worker for MVP | Long-running OCR tasks |
| Testing | pytest, HTTPX, Vitest, React Testing Library, Playwright | Backend and frontend coverage |
| Deployment | Docker Compose for local development; managed hosting for deployment | Reproducible environment |
| Observability | Structured logging + metrics + error tracking with redaction | Diagnose failures safely |

Pin dependencies and versions in lock files. Final provider/model choices should be recorded in configuration and documented with privacy, cost, and latency trade-offs.
