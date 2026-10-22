# Medical Report Explainer — Database, Evaluation Metrics, and API Design

**Status:** Implementation blueprint  
**Version:** 1.0

## 1. Database design

Use PostgreSQL as the system of record. Use pgvector for embeddings initially, with PostgreSQL full-text search for keyword retrieval. Uploaded binary files should live in private object storage; the database stores only storage keys and metadata.

### 1.1 Entity relationships

```text
users 1 ─── N reports
reports 1 ─── N processing_jobs
reports 1 ─── N observations
reports 1 ─── N explanations
explanations N ─── M knowledge_chunks (through explanation_citations)
knowledge_sources 1 ─── N knowledge_chunks
users 1 ─── N audit_events
```

### 1.2 Core tables

#### `users`
- `id UUID PRIMARY KEY`
- `email CITEXT UNIQUE NOT NULL`
- `password_hash TEXT` (only if using password authentication; prefer a trusted identity provider where possible)
- `display_name TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `status TEXT NOT NULL CHECK (status IN ('active','disabled','pending'))`

Do not store unnecessary demographic or clinical profile information.

#### `reports`
- `id UUID PRIMARY KEY`
- `owner_user_id UUID NOT NULL REFERENCES users(id)`
- `original_filename TEXT NOT NULL` (sanitize; do not treat as a path)
- `media_type TEXT NOT NULL`
- `file_size_bytes BIGINT NOT NULL`
- `storage_key TEXT NOT NULL UNIQUE`
- `sha256 TEXT NOT NULL`
- `page_count INTEGER NULL`
- `document_date DATE NULL`
- `laboratory_name TEXT NULL`
- `processing_status TEXT NOT NULL`
- `language TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `deleted_at TIMESTAMPTZ NULL`

Indexes: `(owner_user_id, created_at DESC)`, `(owner_user_id, processing_status)`, unique storage key. Avoid global deduplication that could reveal whether another user uploaded the same report.

#### `processing_jobs`
- `id UUID PRIMARY KEY`
- `report_id UUID NOT NULL REFERENCES reports(id)`
- `job_type TEXT NOT NULL`
- `status TEXT NOT NULL`
- `attempt_count INTEGER NOT NULL DEFAULT 0`
- `started_at TIMESTAMPTZ NULL`
- `completed_at TIMESTAMPTZ NULL`
- `error_code TEXT NULL`
- `safe_error_message TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Use idempotency keys or unique job constraints where appropriate. Never persist raw provider secrets or full report contents in error fields.

#### `observations`
One row per extracted test/result candidate.
- `id UUID PRIMARY KEY`
- `report_id UUID NOT NULL REFERENCES reports(id)`
- `test_name_original TEXT NOT NULL`
- `test_name_normalized TEXT NULL`
- `value_text TEXT NOT NULL`
- `value_numeric NUMERIC NULL`
- `comparator TEXT NULL` (e.g. `<`, `>`, `<=`, `>=`)
- `unit_original TEXT NULL`
- `unit_normalized TEXT NULL`
- `reference_low NUMERIC NULL`
- `reference_high NUMERIC NULL`
- `reference_text TEXT NULL`
- `reported_flag TEXT NULL CHECK (reported_flag IN ('low','normal','high','critical','unknown'))`
- `extraction_confidence NUMERIC NULL CHECK (extraction_confidence BETWEEN 0 AND 1)`
- `validation_status TEXT NOT NULL CHECK (validation_status IN ('verified','needs_review','invalid'))`
- `source_page INTEGER NULL`
- `source_snippet TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Keep `value_text` and original units to preserve exactly what was reported. Do not compare incompatible units or infer missing reference ranges. A lab's reported flag should be stored separately from any application-computed flag, with provenance.

#### `explanations`
- `id UUID PRIMARY KEY`
- `report_id UUID NOT NULL REFERENCES reports(id)`
- `owner_user_id UUID NOT NULL REFERENCES users(id)`
- `question TEXT NULL`
- `summary TEXT NOT NULL`
- `response_json JSONB NOT NULL`
- `model_provider TEXT NOT NULL`
- `model_name TEXT NOT NULL`
- `prompt_version TEXT NOT NULL`
- `safety_status TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

The API must verify that `owner_user_id` matches the authenticated user and the report owner.

#### `knowledge_sources`
- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `publisher TEXT NOT NULL`
- `source_url TEXT NOT NULL`
- `source_type TEXT NOT NULL`
- `published_at DATE NULL`
- `reviewed_at TIMESTAMPTZ NULL`
- `license_notes TEXT NULL`
- `is_active BOOLEAN NOT NULL DEFAULT TRUE`

#### `knowledge_chunks`
- `id UUID PRIMARY KEY`
- `source_id UUID NOT NULL REFERENCES knowledge_sources(id)`
- `chunk_text TEXT NOT NULL`
- `chunk_index INTEGER NOT NULL`
- `embedding VECTOR(<configured_dimension>) NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL`
- Unique constraint `(source_id, chunk_index)`

Use a configured embedding dimension consistent with the selected model. Track source updates and rebuild embeddings when the embedding model changes.

#### `explanation_citations`
- `explanation_id UUID NOT NULL REFERENCES explanations(id) ON DELETE CASCADE`
- `knowledge_chunk_id UUID NOT NULL REFERENCES knowledge_chunks(id)`
- `relevance_score NUMERIC NULL`
- `citation_role TEXT NOT NULL`
- Primary key `(explanation_id, knowledge_chunk_id)`

#### `audit_events`
- `id UUID PRIMARY KEY`
- `actor_user_id UUID NULL REFERENCES users(id)`
- `action TEXT NOT NULL`
- `resource_type TEXT NOT NULL`
- `resource_id UUID NULL`
- `outcome TEXT NOT NULL`
- `request_id TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Audit metadata should be minimal and must not contain medical report text or secrets.

### 1.3 Database rules
- Use UUIDs for externally exposed identifiers.
- Use UTC timestamps (`TIMESTAMPTZ`).
- Enforce ownership in service queries and, where feasible, PostgreSQL row-level security.
- Add migrations through Alembic; never edit production schema manually.
- Use foreign keys and appropriate cascade behavior.
- Soft deletion may support recovery, but final deletion must also remove stored files, derived data, embeddings, and relevant backups according to the retention policy.
- Encrypt backups and restrict database credentials.
- Avoid storing raw OCR output longer than needed unless required for provenance or user review.

## 2. Evaluation metrics and strategy

This is a safety-sensitive explanatory application. A single generic LLM score is not enough. Build a manually reviewed, de-identified or synthetic gold dataset of reports and questions with expected extracted fields, evidence, safe responses, and failure cases.

### 2.1 Extraction metrics
- **Field exact match:** exact correctness for test name, value string, unit, and range fields.
- **Numeric value accuracy:** numeric values match gold labels within a predeclared tolerance; use exact matching where clinically required.
- **Unit accuracy:** percentage of correctly extracted units.
- **Table row precision/recall/F1:** whether true result rows were found and spurious rows avoided.
- **OCR character/word error rate:** evaluate text extraction where ground truth exists.
- **Abstention/review rate:** proportion sent for manual review; measure alongside error rate so a system cannot appear safe by rejecting everything.

Report metrics separately for digital PDFs, scanned PDFs, low-quality images, multiple layouts, and supported languages.

### 2.2 Retrieval metrics
- **Recall@K:** proportion of relevant gold evidence retrieved in top K.
- **Precision@K:** proportion of retrieved chunks that are relevant.
- **MRR / nDCG@K:** ranking quality.
- **Citation support rate:** cited chunks actually support the attached claim.
- **Source freshness/coverage:** fraction of answers using active, reviewed sources.

### 2.3 Generation and safety metrics
- **Groundedness:** claims supported by report facts or retrieved sources.
- **Answer correctness:** reviewed against a clinician-authored or medically reviewed rubric.
- **Completeness:** includes the relevant report details without inventing missing data.
- **Citation precision:** cited references support the specific statement.
- **Unsupported claim rate:** percentage of factual claims without evidence.
- **Unsafe advice rate:** any diagnosis, prescription, or instruction to change treatment without a qualified clinician.
- **Appropriate abstention rate:** refuses or requests clarification when evidence is insufficient.
- **Range flag accuracy:** deterministic flagging agrees with known correct outcomes when units and reference ranges are valid.
- **Human review agreement:** agreement among qualified reviewers on high-risk test cases.

High-risk safety tests should have zero known unsafe outputs in the release test set. This does not prove clinical safety; it is a release gate for a limited explanatory tool.

### 2.4 Product and performance metrics
- Upload success rate.
- Processing success rate by document type.
- Median and p95 processing latency.
- Median and p95 question-answer latency.
- Cost per processed report and per answer.
- Failure and retry rate.
- Deletion completion rate.
- Unauthorized access test pass rate.

### 2.5 Evaluation process
1. Create a versioned dataset of synthetic/publicly permitted report examples.
2. Manually annotate fields and evidence; have clinically sensitive examples reviewed by a qualified professional.
3. Freeze a test set separate from prompt/model development.
4. Evaluate extraction before evaluating RAG or generation.
5. Evaluate retrieval with fixed queries and gold evidence.
6. Evaluate answers with deterministic checks plus human review.
7. Run adversarial safety tests and cross-user authorization tests.
8. Compare each model, prompt, OCR, or chunking change against the previous baseline.
9. Record model/provider, prompt version, retrieval settings, date, and results.
10. Block release on critical extraction errors, unsupported medical claims, citation failures, or authorization failures.

## 3. REST API design

Base path: `/api/v1`. All endpoints use HTTPS and JSON except multipart uploads. Require authentication for user/report endpoints. Use consistent error objects and request IDs.

### 3.1 Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register user if local auth is enabled |
| POST | `/auth/login` | Authenticate or exchange identity-provider session |
| POST | `/reports` | Upload report as multipart form |
| GET | `/reports` | List current user's reports with pagination |
| GET | `/reports/{report_id}` | Get report metadata and processing status |
| DELETE | `/reports/{report_id}` | Delete report and associated data |
| GET | `/reports/{report_id}/observations` | Get extracted observations |
| POST | `/reports/{report_id}/explanations` | Generate explanation or ask a report question |
| GET | `/reports/{report_id}/explanations/{explanation_id}` | Retrieve prior explanation |
| POST | `/reports/compare` | Compare two owned reports |
| GET | `/jobs/{job_id}` | Poll asynchronous processing status |
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness including required dependencies |

### 3.2 Upload request

`POST /api/v1/reports`

`Content-Type: multipart/form-data`

Fields:
- `file`: required, supported PDF/JPG/PNG.
- `document_date`: optional ISO date if user wants to supply/correct date.
- `consent_to_processing`: required boolean for the documented processing policy.

Response: `202 Accepted`

```json
{
  "report_id": "uuid",
  "job_id": "uuid",
  "status": "queued",
  "status_url": "/api/v1/jobs/uuid"
}
```

Do not return extracted medical details before processing and validation complete.

### 3.3 Job status response

```json
{
  "job_id": "uuid",
  "report_id": "uuid",
  "status": "processing",
  "stage": "ocr",
  "progress_percent": 45,
  "safe_error_code": null
}
```

Progress is approximate; never expose stack traces or provider internals.

### 3.4 Observation response

```json
{
  "report_id": "uuid",
  "observations": [
    {
      "id": "uuid",
      "test_name": "Example test",
      "value_text": "Example value",
      "value_numeric": null,
      "unit": null,
      "reference_range": {
        "low": null,
        "high": null,
        "text": "As printed on report"
      },
      "reported_flag": "unknown",
      "validation_status": "needs_review",
      "source": {
        "page": 1,
        "snippet": "Redacted illustrative source snippet"
      }
    }
  ]
}
```

This is an illustrative schema, not real medical advice or a real test result.

### 3.5 Explanation request

`POST /api/v1/reports/{report_id}/explanations`

```json
{
  "question": "Explain the report in simple language.",
  "language": "en",
  "include_questions_for_clinician": true
}
```

Response includes:
- `explanation_id`
- `summary`
- per-observation explanations
- `citations` with title, publisher, URL, and relevant snippet
- `limitations`
- `safety_status`
- `created_at`

The API should return a safe, structured response; do not return chain-of-thought or internal prompts.

### 3.6 Compare request

`POST /api/v1/reports/compare`

```json
{
  "report_id_a": "uuid",
  "report_id_b": "uuid"
}
```

Both reports must belong to the authenticated user. Match tests by normalized identity and compatible units. Return unmatched or incomparable values explicitly rather than forcing a comparison.

### 3.7 Error response

```json
{
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "Upload a PDF, JPG, or PNG file.",
    "request_id": "request-id"
  }
}
```

### 3.8 HTTP status conventions
- `200`: successful read/action.
- `202`: asynchronous job accepted.
- `400`: malformed request.
- `401`: missing/invalid authentication.
- `403` or privacy-preserving `404`: unauthorized resource.
- `404`: resource does not exist.
- `413`: file too large.
- `415`: unsupported media type.
- `422`: schema validation failure.
- `429`: rate limit exceeded.
- `500`: unexpected internal error.
- `503`: required dependency unavailable.

### 3.9 API security
- Enforce report ownership on every read, update, comparison, and deletion.
- Validate file signatures, not just extensions.
- Apply upload limits, rate limits, and request timeouts.
- Use idempotency for retryable operations.
- Never include PHI in URLs, analytics, logs, or error messages.
- Document retention and consent behavior.
- Use secure, short-lived signed URLs only if direct private-file download is needed.
