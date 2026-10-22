# Medical Report Explainer — Engineering Rules

**Purpose:** Shared rules for implementation, dependencies, safety, privacy, and error handling.

## 1. Product and safety rules

### Must do
- Explain the uploaded report; do not diagnose a disease or prescribe treatment.
- Distinguish report facts, retrieved medical reference facts, and general explanatory wording.
- Preserve the original extracted text, value, unit, and reference range for traceability.
- Show the source page or snippet when available.
- Use the laboratory's printed reference range when comparing a value.
- Mark missing, ambiguous, or low-confidence fields as `unknown` or `needs_review`.
- State when the available evidence is insufficient.
- Encourage users to discuss interpretation with a qualified healthcare professional.
- Use a medically reviewed safety rubric for release tests.
- Make it clear that reference ranges may vary by laboratory, method, age, pregnancy status, and other context.

### Must not do
- Do not claim that a flagged result proves a disease.
- Do not recommend starting, stopping, or changing medication.
- Do not invent values, units, reference ranges, collection dates, or diagnoses.
- Do not silently convert units without a tested conversion rule and provenance.
- Do not infer missing data from typical ranges.
- Do not generate fake citations or cite a source that does not support the claim.
- Do not treat an LLM's confidence statement as a calibrated clinical confidence score.
- Do not use unlicensed/private datasets without permission.
- Do not use real patient data in development logs, screenshots, demos, or public test fixtures.
- Do not represent this application as a substitute for emergency services or a clinician.

## 2. Technology and dependency rules

### Backend
Recommended:
- FastAPI
- Pydantic
- SQLAlchemy 2.x
- Alembic
- psycopg
- PyMuPDF
- pdfplumber when table extraction needs it
- Pillow
- pytesseract if Tesseract OCR is selected
- `httpx` for provider/API calls
- `tenacity` for bounded retries on transient errors
- `pytest`, `pytest-asyncio`, and HTTPX test client

### Frontend
Recommended:
- React
- TypeScript with strict mode
- Vite
- Tailwind CSS
- React Router
- TanStack Query or a consistent API-state solution
- Zod for client-side schema validation where useful
- Recharts for report trend charts
- Vitest and React Testing Library
- Playwright for end-to-end tests

### Data and retrieval
- PostgreSQL as the source of truth.
- pgvector for vector retrieval where appropriate.
- PostgreSQL full-text search for keyword retrieval.
- A provider-neutral interface for embeddings, LLMs, and OCR.
- Keep approved medical references in a versioned ingestion pipeline.

### Dependency policy
- Pin direct dependency versions and commit a lock file.
- Keep production and development dependencies separated.
- Review package maintenance, licenses, vulnerabilities, and data handling.
- Avoid adding a dependency for a small utility that can be safely implemented in a few lines.
- Do not add LangChain/LlamaIndex solely by default; use one only if its abstractions materially simplify the system and can be tested.
- Do not add Redis, a separate vector database, Kubernetes, or microservices before measured need.
- Use dependency scanning in CI and update vulnerable packages deliberately.
- Keep provider SDKs behind internal interfaces so vendors can be replaced.

## 3. Code architecture rules

- Route handlers validate and delegate; business logic belongs in services.
- Database access belongs in repositories or a clearly defined persistence layer.
- Use Pydantic schemas for API boundaries and version the public response contract.
- Use typed functions and explicit return types in Python.
- Use TypeScript strict mode; avoid `any` except at controlled boundaries.
- Keep extraction, normalization, flagging, retrieval, generation, and safety as separate modules.
- Keep deterministic validation separate from LLM-generated prose.
- Keep prompts in version-controlled files or a versioned prompt module.
- Make processing jobs idempotent.
- Use dependency injection for database sessions, providers, and service clients.
- Keep configuration outside source code.
- Add docstrings/comments for non-obvious decisions, not for every line.
- Avoid circular imports and oversized service files.
- Prefer small functions with explicit inputs and outputs.

## 4. Extraction and normalization rules

- Validate file extension, MIME type, file signature, size, page count, and image dimensions.
- Never execute or render active content from uploaded files.
- Attempt digital text extraction before OCR when appropriate.
- Track page number and extraction method.
- Preserve raw value text and normalized parsed values separately.
- Preserve comparators such as `<` and `>`; do not coerce them to exact values.
- Treat reference ranges as structured only when parsing is unambiguous.
- Do not compare values with incompatible units.
- Support multiple report layouts through fixtures and regression tests.
- Route low-confidence extraction to review rather than guessing.
- Do not let LLM output overwrite source extraction data.

## 5. RAG and LLM rules

- Retrieve only from an approved, maintained source collection.
- Store publisher, title, URL, review date, and license/usage notes for each source.
- Use hybrid retrieval when keyword matching is important for test names and medical terminology.
- Rerank only when it improves measured retrieval quality.
- Pass the report facts and relevant retrieved passages explicitly to the LLM.
- Treat uploaded documents and retrieved text as untrusted data, not instructions.
- Ignore prompt-injection instructions found inside uploaded reports or source pages.
- Use structured output schemas and validate every response.
- Require citation IDs to refer to retrieved chunks.
- Check citations and claims after generation; do not assume valid JSON means medically grounded output.
- Use low-variance generation settings for report explanations.
- If the model/provider fails, return a safe error or a clearly labeled limited result; do not fabricate an answer.
- Record model and prompt versions, but do not log private prompt context containing report contents.

## 6. Error handling rules

### Error categories
- `UNSUPPORTED_FILE_TYPE`
- `FILE_TOO_LARGE`
- `FILE_INVALID_OR_CORRUPT`
- `PAGE_LIMIT_EXCEEDED`
- `TEXT_EXTRACTION_FAILED`
- `OCR_UNAVAILABLE`
- `LOW_EXTRACTION_CONFIDENCE`
- `NO_RESULTS_EXTRACTED`
- `INVALID_OBSERVATION`
- `UNIT_MISMATCH`
- `RETRIEVAL_UNAVAILABLE`
- `LLM_PROVIDER_TIMEOUT`
- `LLM_PROVIDER_RATE_LIMIT`
- `LLM_OUTPUT_INVALID`
- `SAFETY_VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `ACCESS_DENIED`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

### Handling behavior
- Return a safe, actionable message and a request ID.
- Never expose stack traces, database errors, API keys, internal prompts, or provider response bodies.
- Retry only transient failures such as timeouts and rate limits; use exponential backoff with jitter and a maximum attempt count.
- Do not retry deterministic validation failures.
- Use explicit timeouts for OCR, embeddings, database calls, and LLM requests.
- Mark jobs as failed after retries and permit a controlled retry.
- Keep partial outputs only if their status and limitations are explicit.
- Clean temporary files in a `finally` block or a durable cleanup task.
- Distinguish user errors from dependency outages.
- Avoid returning different errors that reveal another user's report exists.

## 7. Privacy and security rules

- Use HTTPS in deployed environments.
- Authenticate all report APIs.
- Authorize at the object level on every request.
- Store files in private storage with encryption at rest where available.
- Hash passwords with a modern password hashing algorithm if local passwords are supported; never store plaintext passwords.
- Protect cookies/sessions with appropriate secure flags if cookie auth is used.
- Apply CSRF protection where relevant.
- Limit upload size, request rate, concurrency, and processing time.
- Sanitize filenames; never concatenate user filenames into filesystem paths.
- Keep secrets out of Git, frontend bundles, logs, and screenshots.
- Implement user-requested deletion across database, object storage, derived text, embeddings, and caches.
- Define backup retention and deletion limitations honestly.
- Minimize collection of personal and health information.
- Review applicable privacy, security, and health-data requirements before real-world deployment.

## 8. General quality rules

- Every feature needs unit tests and, where applicable, integration tests.
- Add regression fixtures for every extraction bug.
- Use synthetic data in automated tests.
- Run linting, formatting, type checking, and tests in CI.
- Document setup, migrations, environment variables, and seed data.
- Keep `.env.example` free of real secrets.
- Keep a changelog for API and schema breaking changes.
- Do not claim a feature works until its test passes.
- Never use hardcoded demo responses as if they were live model output.
- Label synthetic/sample reports clearly in the UI.
