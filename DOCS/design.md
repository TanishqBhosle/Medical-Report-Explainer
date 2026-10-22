# Medical Report Explainer — UI/UX Design Specification

## 1. Design goals

- Reduce anxiety and make medical terminology easier to understand.
- Be calm, clear, respectful, and accessible—not alarmist.
- Make source values and their provenance visible.
- Separate extracted facts from AI explanations.
- Show uncertainty and limitations without burying them.
- Make privacy and deletion controls easy to find.
- Work on desktop and mobile.

## 2. Visual direction

### Design language
Use a clean healthcare workspace: warm off-white background, white surfaces, deep navy/blue text, muted teal accents, and restrained semantic colors. Avoid a hospital-monitor look, neon gradients, excessive glassmorphism, or alarming red for every abnormal value.

### Suggested tokens
- Page background: `#F7F9FC`
- Surface: `#FFFFFF`
- Primary text: `#172B4D`
- Secondary text: `#526277`
- Primary action: `#2563EB`
- Accent: `#0F766E`
- Border: `#DCE3EC`
- Low: muted amber
- High: muted orange
- In-range: muted teal
- Unknown/review: neutral slate

Color must never be the only indicator. Pair status colors with labels and icons.

### Typography and spacing
- Use a readable sans-serif such as Inter.
- Body text: 16px baseline; avoid tiny medical text.
- Use an 8px spacing scale.
- Keep content width comfortable for reading.
- Use consistent heading hierarchy and generous whitespace.

## 3. Information architecture

Primary navigation:
- **Overview**
- **Upload report**
- **My reports**
- **Help & privacy**

User menu:
- Account
- Data and deletion
- Sign out

MVP routes:
- `/` — landing / product introduction
- `/login` and `/register` — authentication, if local auth is used
- `/app` — overview
- `/app/upload` — upload
- `/app/reports/:reportId` — report results
- `/app/reports` — report history
- `/app/compare` — compare reports
- `/app/settings/privacy` — privacy and deletion

## 4. Key screens

### 4.1 Landing page
Purpose: explain the product and establish trust.

Sections:
1. Header with product name, How it works, Privacy, Sign in.
2. Hero: “Understand your medical report, in plain language.”
3. Supporting text: upload a report to see extracted values, explanations, and sources.
4. Three-step workflow: Upload → Review extracted details → Read explanations.
5. Privacy section explaining how uploads are processed and stored.
6. Limitations: not a diagnosis or substitute for a clinician.
7. CTA: “Explain a report.”

Avoid promising accurate diagnosis, guaranteed interpretations, or immediate clinical answers.

### 4.2 Upload screen
Components:
- Drag-and-drop zone plus browse button.
- Accepted formats and file-size/page limits from actual backend configuration.
- Consent/processing notice linked to privacy details.
- Selected-file card with filename, size, and remove action.
- Upload/progress state.
- Accessible error messages.
- Option to cancel before processing where supported.

States:
- Empty
- File selected
- Uploading
- Queued/processing
- Unsupported/too large
- Upload failed with retry
- Processing complete

### 4.3 Processing screen
Show clear stages without claiming false precision:
- Upload received
- Reading text/tables
- Checking extracted fields
- Preparing explanation

Show “This may take a little while” if needed. Never show fabricated progress or fake model output. Provide cancel/delete where supported.

### 4.4 Report results screen
Recommended layout:
1. Header with report date if confidently extracted, file label, status, and delete action.
2. Short summary card with an explicit “AI-generated explanation” label.
3. Review notice if any values are uncertain.
4. Results table:
   - Test
   - Reported value
   - Unit
   - Reference range as printed
   - Reported flag / range comparison
   - “Explain” action
5. Expandable evidence panel with page number/snippet.
6. Questions to ask a clinician.
7. Source citations and limitations.
8. “Ask about this report” question box.

Do not use a single “health score” or red/green grade that overstates the meaning of the report.

### 4.5 Observation detail
Display:
- Original test name and extracted value.
- Unit and reference range.
- Extraction validation status.
- Plain-language explanation.
- Relevant trusted-source citations.
- Why the system may not be able to interpret the value.
- Reminder that the clinician interprets results in context.

If extraction is uncertain, show “Please verify this value against your original report” prominently.

### 4.6 Ask a question
- Input field with examples: “What does this test measure?” and “Explain this term.”
- Scope indicator: “Answering using this report and listed sources.”
- Loading indicator and cancel/timeout behavior.
- Answer with citations.
- Insufficient evidence state.
- Safe response for diagnosis or medication-change requests.
- Feedback controls such as “Helpful” / “Not helpful,” without soliciting sensitive details unnecessarily.

### 4.7 Report history
- Search/sort by date and status.
- Report title, upload date, processing status.
- Open, compare, or delete actions.
- Empty state explaining how to upload the first report.
- Pagination or lazy loading for long histories.

### 4.8 Compare reports
- Select two reports and dates.
- Display matched parameters in a table/chart only when units and identities are compatible.
- Show values, dates, differences, and source ranges.
- Clearly label unmatched/incomparable parameters.
- Avoid labels like “better” or “worse” unless a medically reviewed rule justifies the interpretation.

### 4.9 Privacy and deletion
- Explain what is stored and why.
- Offer deletion for a report and its derived data.
- Explain deletion status and any retention limitations.
- Confirm destructive actions.
- Do not expose raw report text in account analytics.

## 5. UX writing and safety language

Prefer:
- “The report marks this value as high.”
- “This value is outside the reference range printed on this report.”
- “A clinician can interpret this result alongside symptoms and medical history.”
- “We couldn't reliably extract this field. Please check the original report.”

Avoid:
- “You have [disease].”
- “This is definitely dangerous.”
- “Your health is 80% normal.”
- “Stop taking your medicine.”
- “Your result is safe” based only on a reference range.

If an urgent or emergency concern is raised, use a medically reviewed escalation message that directs the user to local emergency services or an appropriate healthcare professional; do not attempt to triage from a lab value alone.

## 6. Accessibility and responsive behavior
- Meet WCAG 2.2 AA goals where practical.
- Keyboard-operable upload, tables, dialogs, and chat.
- Visible focus indicators and meaningful headings.
- Accessible names for icon buttons.
- Sufficient contrast and text resizing.
- Use labels and icons in addition to color.
- On mobile, transform wide tables into stacked result cards or allow accessible horizontal scrolling.
- Respect reduced-motion preferences.
- Announce processing state changes to assistive technology.

## 7. UI component inventory
- `AppShell`, `Sidebar`, `TopBar`
- `UploadDropzone`, `SelectedFileCard`, `UploadProgress`
- `ProcessingStepper`, `StatusBadge`
- `ReportSummaryCard`, `ObservationTable`, `ObservationCard`
- `ReferenceRangeDisplay`, `ExtractionConfidenceNotice`
- `ExplanationPanel`, `CitationList`, `LimitationsNotice`
- `QuestionComposer`, `AnswerCard`, `AbstentionNotice`
- `ReportHistoryTable`, `ReportCompareTable`, `TrendChart`
- `DeleteConfirmationDialog`, `EmptyState`, `ErrorState`, `Skeleton`
