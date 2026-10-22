# Medical Report Explainer — Development Phases

**Planning principle:** Build a reliable, narrow end-to-end workflow first. Add complexity only after extraction, grounding, safety, and authorization are measurable.

## Phase 0 — Requirements and risk review
**Deliverables**
- Confirm supported report types, file limits, languages, retention, consent, and hosting.
- Define non-goals and prohibited outputs.
- Choose initial LLM/OCR providers after reviewing privacy and data terms.
- Create a risk register and safety test rubric.
- Create synthetic report fixtures and acceptance criteria.

**Exit criteria**
- Every MVP feature has an acceptance test.
- Data flow and deletion behavior are documented.
- No production use of patient data is planned without authorization and safeguards.

## Phase 1 — Repository and application foundation
**Tasks**
- Create `frontend/` and `backend/` scaffolds.
- Configure Python environment, TypeScript strict mode, linting, formatting, and CI.
- Add environment configuration and health endpoints.
- Configure PostgreSQL, SQLAlchemy, Alembic, and initial migrations.
- Add authentication and report ownership checks.
- Add Docker Compose for local development.

**Deliverables**
- App boots locally.
- Database migrations run from an empty database.
- CI runs lint, type checks, and basic tests.

**Exit criteria**
- `/health/live` and `/health/ready` behave correctly.
- Authenticated users cannot access other users' resources.

## Phase 2 — Upload and document extraction
**Tasks**
- Implement upload validation and private file storage.
- Add report/job database models and job status polling.
- Parse digital PDFs.
- Add OCR fallback for scanned PDFs and images.
- Extract candidate tables and test-result rows.
- Store page/snippet provenance and extraction confidence.
- Add safe retry and cleanup behavior.

**Deliverables**
- PDF/JPG/PNG upload workflow.
- Processing status UI.
- Structured extraction output.

**Exit criteria**
- Supported fixture set passes extraction checks.
- Corrupt, oversized, and unsupported files fail safely.
- Low-confidence values are flagged for review rather than guessed.

## Phase 3 — Normalization and range flagging
**Tasks**
- Normalize common test labels while preserving original labels.
- Parse numeric values, comparators, units, and reference ranges.
- Implement deterministic low/within-range/high/unknown logic where comparison is valid.
- Preserve the lab's own abnormal flag separately.
- Handle unit mismatch, missing range, qualitative results, and ambiguous rows.
- Add review states.

**Deliverables**
- Observation API and results table.
- Clear provenance for each extracted value.

**Exit criteria**
- Unit tests cover boundaries, missing values, comparators, and incompatible units.
- The LLM cannot alter extracted values or deterministic flags.

## Phase 4 — Trusted medical knowledge and RAG
**Tasks**
- Select trusted, legally usable sources.
- Build ingestion, source metadata, chunking, and refresh process.
- Generate embeddings and store them in pgvector.
- Add PostgreSQL keyword search and vector search.
- Add optional reranking based on evaluation.
- Return source IDs, titles, publisher, URLs, and snippets.
- Build a small gold retrieval dataset.

**Deliverables**
- Reproducible knowledge-base ingestion.
- Search endpoint/service with citations.

**Exit criteria**
- Retrieval metrics are recorded.
- Sources can be traced and deactivated.
- No source content is treated as executable instructions.

## Phase 5 — Grounded explanations and safety
**Tasks**
- Create versioned prompts and Pydantic response schemas.
- Generate plain-language summaries from verified observations and retrieved evidence.
- Add question answering for report-specific questions.
- Validate citation IDs and source support.
- Add safety filters for diagnosis, prescriptions, and treatment changes.
- Add abstention when evidence is insufficient.
- Add English output first; add Hindi only after quality tests.
- Add clinician-review questions and limitations.

**Deliverables**
- Summary, per-observation explanations, citations, and limitations.
- Safe response behavior for unsupported requests.

**Exit criteria**
- Safety suite passes release thresholds.
- No fabricated observations or citations in the regression set.
- Answers clearly distinguish report facts from general context.

## Phase 6 — Report comparison and history
**Tasks**
- Add report list, report detail, and delete workflows.
- Compare two reports owned by the same user.
- Match parameters only when identity and units are compatible.
- Show changes with dates and context; do not label changes as inherently good or bad.
- Add charts only where measurements are meaningfully comparable.

**Deliverables**
- History screen and comparison view.

**Exit criteria**
- Incompatible or missing measurements appear as not comparable.
- Cross-user comparison is impossible.

## Phase 7 — UI polish and accessibility
**Tasks**
- Implement responsive upload, processing, results, explanation, history, and comparison screens.
- Add loading, empty, retry, error, and review states.
- Add accessible labels, keyboard support, focus states, and readable contrast.
- Label sample data and limitations clearly.
- Add responsive layouts for desktop and mobile.

**Deliverables**
- Complete, usable frontend integrated with live API behavior.

**Exit criteria**
- No hardcoded fake outputs in production paths.
- Core flows pass browser tests at mobile and desktop sizes.

## Phase 8 — Evaluation, security, and hardening
**Tasks**
- Run extraction, retrieval, groundedness, citation, and safety evaluation.
- Test malicious files, prompt injection, rate limits, and authorization.
- Measure p50/p95 processing and answer latency.
- Check cost per report and per question.
- Add structured redacted logs and basic operational metrics.
- Test deletion, backup/retention policy, and recovery.
- Run dependency and container vulnerability scans.

**Deliverables**
- Evaluation report, risk register, security checklist, and model/prompt card.

**Exit criteria**
- No known critical authorization or data-leak bugs.
- Release gates are met for the frozen evaluation suite.
- Known limitations are documented.

## Phase 9 — Deployment and release
**Tasks**
- Configure production environment and secrets.
- Deploy frontend, API, worker, database, and private storage.
- Run migrations and smoke tests.
- Configure TLS, backups, monitoring, and alerts.
- Test rollback and restore procedures.
- Write README, architecture, API, privacy, and operational documentation.

**Deliverables**
- Deployed MVP and reproducible setup instructions.

**Exit criteria**
- Production smoke tests pass.
- Health checks, backups, and alerts are verified.
- User-facing claims match tested capabilities.

## Priority order

**P0:** Upload, extraction, validation, safe explanation, citations, access control, tests.  
**P1:** History, report comparison, Hindi, advanced retrieval/reranking, operational dashboards.  
**Future:** Additional languages, provider-specific OCR, clinician-reviewed workflows, and larger-scale infrastructure only after evidence supports them.
