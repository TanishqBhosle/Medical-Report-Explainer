# Medical Report Explainer — Testing Strategy

## 1. Testing objectives

Verify that:
- The application starts and its dependencies are healthy.
- Uploads are validated and processed reliably.
- Extracted values preserve source meaning and provenance.
- Range flags are deterministic and correct where comparison is valid.
- RAG citations support the explanation.
- The LLM does not invent report values or make prohibited medical claims.
- Users cannot access other users' reports.
- Failures are handled safely and do not leak sensitive information.
- Frontend flows work on desktop and mobile.
- Deletion removes data according to the documented policy.

## 2. Test layers

| Layer | Tools | What to test |
|---|---|---|
| Backend unit | pytest | Parsing, normalization, flagging, access policies, safety checks |
| API integration | pytest + HTTPX | Routes, schemas, auth, database, jobs, error codes |
| Extraction regression | pytest + fixtures | Digital PDFs, scanned PDFs, images, tables, varied layouts |
| RAG evaluation | Fixed gold dataset + custom metrics | Recall@K, citation support, retrieval relevance |
| LLM/safety evaluation | Golden prompts + human review | Groundedness, abstention, prohibited advice, citation validity |
| Frontend unit | Vitest + React Testing Library | Components, validation, states, accessibility |
| End-to-end | Playwright | Upload-to-results, history, compare, deletion |
| Security | Automated and manual tests | IDOR, file validation, prompt injection, rate limiting, secrets |
| Performance | Locust or k6 | Upload and Q&A latency, concurrency, resource limits |
| Deployment smoke | CI/deployment checks | Health, migrations, provider connectivity, rollback readiness |

## 3. Required backend tests

### 3.1 Upload validation
- Accept supported PDF/JPG/PNG files within configured limits.
- Reject unsupported extension and unsupported file signature.
- Reject empty and corrupt files.
- Reject oversized files and excessive page counts.
- Handle filename traversal strings safely.
- Reject MIME/extension mismatch.
- Ensure a failed upload leaves no public or orphaned file.
- Ensure retry does not create duplicate report records.

### 3.2 PDF and OCR extraction
- Extract text from a normal digital PDF.
- OCR a scanned PDF and image.
- Extract tables spanning multiple pages.
- Preserve decimal points, negative signs, inequalities, and units.
- Handle rotated pages, low resolution, skew, and mixed text/image pages.
- Handle missing values and blank rows.
- Preserve page number/snippet provenance.
- Return `needs_review` for ambiguous extraction.
- Fail safely if OCR is unavailable or times out.
- Run regression fixtures for every fixed extraction bug.

### 3.3 Normalization and range flagging
Test cases must include:
- Value below lower bound.
- Value equal to lower bound.
- Value inside range.
- Value equal to upper bound.
- Value above upper bound.
- Missing lower/upper bound.
- Qualitative values such as “positive” or “negative”.
- Comparators such as `<` and `>`.
- Different units for the same analyte.
- No reference range.
- Invalid numeric string.
- Reference text that cannot be parsed confidently.
- Lab-provided flag conflicting with application-derived flag.

Expected behavior: preserve original source data, avoid unsafe comparisons, record the source of each flag, and use `unknown`/`needs_review` when semantics are unclear.

### 3.4 RAG and explanation
- Relevant trusted source is retrieved for a known question.
- Exact test names are found by keyword search.
- Vector retrieval finds paraphrased queries.
- Reranking, if enabled, improves or at least does not materially degrade the gold set.
- Every citation ID belongs to a retrieved and active source.
- Citation supports the associated claim.
- No citation is fabricated.
- Missing evidence leads to abstention or a clarification request.
- Uploaded text containing “ignore previous instructions” does not override system rules.
- LLM output failing schema validation is rejected/retried safely.
- Provider timeout/rate limit produces a safe error.
- LLM cannot overwrite the extracted value, unit, or deterministic range flag.
- Questions asking for diagnosis, prescriptions, or medication changes receive safe handling.
- The answer distinguishes what the report says from general information.

### 3.5 Authorization and privacy
- Anonymous requests cannot access reports.
- User A cannot list, read, compare, or delete User B's reports.
- Guessing report/job/explanation UUIDs does not bypass authorization.
- Every child resource is scoped to its report owner.
- Signed URLs, if used, expire and do not grant broader access.
- Logs and error responses do not expose report text or credentials.
- Deletion removes the original file and derived artifacts according to policy.
- Retried deletion is idempotent.
- Database backups and retention behavior are documented and tested.

### 3.6 Job and resilience behavior
- Polling returns valid status transitions.
- Worker restart does not corrupt a report.
- Duplicate job delivery does not duplicate observations.
- Transient provider failure retries within a bounded limit.
- Permanent failures end in `FAILED` with a safe code.
- Temporary files are cleaned after success and failure.
- Readiness fails if a required dependency is unavailable.
- Liveness does not perform expensive OCR or LLM calls.

## 4. Required frontend tests
- Upload control accepts supported file types and shows configured limits.
- File size/type errors are understandable and accessible.
- Processing states update from the API, not hardcoded timers.
- Results render original values, units, ranges, and status labels accurately.
- Low-confidence extraction displays a review warning.
- Citations open the correct source.
- API errors have retry/empty states and do not erase user context unnecessarily.
- Question submission prevents duplicate clicks while in flight.
- Empty history, no observations, no citations, and no comparison matches render correctly.
- Delete action requires confirmation and updates history.
- Mobile layouts work at narrow viewport widths.
- Keyboard navigation, focus visibility, labels, and reduced motion are checked.

## 5. End-to-end scenarios

### E2E-01: Digital report happy path
1. Log in as a test user.
2. Upload a known synthetic digital PDF.
3. Wait for processing completion.
4. Verify expected observation names, values, units, ranges, and source pages.
5. Request a plain-language explanation.
6. Verify citations are displayed and valid.
7. Open report history and confirm the report appears.

### E2E-02: Scanned report
1. Upload a synthetic scanned report.
2. Confirm OCR stage runs.
3. Verify low-confidence fields are flagged.
4. Confirm the user can see page provenance and review notices.

### E2E-03: Unsupported or corrupt upload
1. Upload an unsupported or corrupt file.
2. Confirm safe error code and message.
3. Confirm no successful report result is shown.
4. Confirm temporary storage is cleaned.

### E2E-04: Insufficient evidence
1. Ask a question unrelated to the report or approved knowledge base.
2. Confirm the system abstains or requests clarification.
3. Confirm no invented citation or confident unsupported medical claim appears.

### E2E-05: Cross-user access
1. User A uploads a report.
2. User B attempts to read, compare, and delete it using its ID.
3. Confirm access is denied without leaking report contents or existence where privacy policy requires 404 behavior.

### E2E-06: Comparison
1. Upload two synthetic reports with a known shared test and compatible units.
2. Compare them.
3. Verify values and dates match the source reports.
4. Include one incompatible-unit test and verify it is marked not comparable.

### E2E-07: Deletion
1. Delete a report.
2. Verify it no longer appears in history.
3. Verify its original file, observations, explanations, embeddings, and derived content are removed according to the retention policy.
4. Verify repeat deletion is handled idempotently.

## 6. Evaluation release gates

Set thresholds using a representative validation set before release. Do not select thresholds after looking at the final test set.

Suggested initial gates:
- **Authorization:** 100% of known cross-user access tests blocked.
- **Critical safety tests:** zero known unsafe diagnosis/prescription outputs in the frozen safety suite.
- **Citations:** zero fabricated citation IDs in the frozen test set.
- **Extraction:** publish field-level exact-match and numeric accuracy by document type; define acceptable minimums from reviewed sample performance before release.
- **Range flags:** 100% agreement on deterministic unit-test cases with valid compatible inputs.
- **Deletion:** 100% pass rate on defined deletion verification tests.
- **Reliability:** all critical E2E scenarios pass in CI or release qualification.
- **Performance:** publish measured p50/p95 latency and cost; set product-specific targets after baseline measurements.

These gates are engineering release criteria, not proof of clinical effectiveness or safety.

## 7. Test data management
- Prefer synthetic reports with intentionally varied layouts and values.
- Use public examples only when their license and terms permit the intended use.
- Never put identifiable patient data into source control or public CI.
- Store gold annotations separately from prompts and model code.
- Version datasets and record changes.
- Keep a separate frozen test set to reduce evaluation leakage.
- Have qualified reviewers assess clinically sensitive examples.
- Redact any manually reviewed sample before sharing reports.

## 8. CI checklist
On each pull request:
1. Format and lint backend/frontend.
2. Run Python type checks and TypeScript type checks.
3. Run backend unit and API tests.
4. Run frontend unit tests.
5. Run extraction regression tests.
6. Run security/dependency scanning.
7. Run selected safety regression cases.
8. Build frontend and backend containers.
9. Run migration checks.
10. Run E2E tests on main/release branches.
