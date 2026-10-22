# Medical Report Explainer

An educational, patient-centered laboratory report explanation platform built with **FastAPI**, **React + TypeScript (Vite)**, and grounded **RAG (Retrieval-Augmented Generation)**.

---

## 1. System Overview

Medical laboratory reports are dense with technical acronyms, differing measurement units, and confusing laboratory-specific intervals. **ReportExplainer** translates complex diagnostic parameters into calm, accessible, plain-language summaries while enforcing strict clinical boundaries:
- **Zero Diagnosis Claims:** Abnormal markers are never claimed to "prove" illness.
- **Zero Prescription Advice:** No recommendations to start, stop, or adjust medications.
- **Deterministic Range Flagging:** Mathematical evaluation against printed laboratory intervals—never hallucinated by generative models.
- **Traceable Provenance:** Every extracted parameter retains original report page numbers and text snippets.
- **Grounded Citations:** Evidence sourced exclusively from authoritative health resources (MedlinePlus, NIH, CDC, WHO, and Lab Tests Online).

---

## 2. Directory Structure

```text
Medical Report Explainer/
├── DOCS/
│   ├── prd.md                    # Product Requirements Document
│   ├── architecture.md           # HLD, LLD & system design
│   ├── DataBase.md               # PostgreSQL schema & API contract
│   ├── design.md                 # UI/UX design tokens & specifications
│   ├── phase.md                  # Development phases & roadmap
│   ├── rules.md                  # Safety & architectural constraints
│   └── testing.md                # E2E & unit test specifications
├── backend/
│   ├── app/
│   │   ├── api/                  # API routers & dependency injection
│   │   │   ├── deps.py           # JWT & report ownership authorization
│   │   │   └── routes/           # Auth, reports, observations, explanations, compare, jobs, health
│   │   ├── core/                 # Config, security (bcrypt/JWT), redacted logging
│   │   ├── db/                   # SQLAlchemy declarative base, sessionmaker, seed knowledge
│   │   ├── models/               # Users, reports, jobs, observations, explanations, citations, audit
│   │   ├── schemas/              # Pydantic v2 validation contracts
│   │   ├── services/             # Ingestion, PDF/OCR extraction, normalization, flagging, RAG, safety
│   │   └── main.py               # FastAPI application entrypoint
│   ├── storage/                  # Encrypted private document store (git-ignored)
│   ├── tests/                    # Pytest suite (auth, safety, flagging, reports)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Footer, layout controls
│   │   ├── context/              # AuthContext (login, register, token persistence)
│   │   ├── pages/                # Landing, Dashboard, Upload, Report Details, History, Compare, Privacy
│   │   ├── services/             # Typed API client
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx               # Primary application router
│   │   ├── main.tsx              # React DOM bootstrap
│   │   └── index.css             # Healthcare design system tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 3. Quick Start Guide

### Prerequisites
- **Python:** 3.11+
- **Node.js:** 18+ (tested on Node v24)
- **Package Managers:** pip, npm

### Backend Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run backend unit & safety tests:
   ```bash
   python -m pytest tests -v
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API interactive documentation will be available at:
   - OpenAPI Docs: `http://localhost:8000/api/v1/docs`
   - Health Live check: `http://localhost:8000/api/v1/health/live`
   - Health Readiness check: `http://localhost:8000/api/v1/health/ready`

### Frontend Setup
1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## 4. Key Endpoints (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create patient user account |
| `POST` | `/auth/login` | Authenticate and obtain Bearer JWT |
| `GET` | `/auth/me` | Fetch authenticated user profile |
| `POST` | `/reports` | Multipart report upload (PDF/JPG/PNG) |
| `GET` | `/reports` | Paginated listing of user's reports |
| `GET` | `/reports/{id}` | Report metadata and processing status |
| `DELETE`| `/reports/{id}` | Idempotent complete deletion (file + records) |
| `GET` | `/reports/{id}/observations` | Verified test observations & flags |
| `POST` | `/reports/{id}/explanations` | Generate grounded explanation or ask question |
| `POST` | `/reports/compare` | Longitudinal comparison of 2 reports |
| `GET` | `/jobs/{job_id}` | Processing job stage & progress polling |
| `GET` | `/health/live` | Service liveness probe |
| `GET` | `/health/ready` | Dependency readiness probe |

---

## 5. Medical Safety & Privacy Guarantees

- **User Scoped Access:** Endpoints verify ownership on every action; guessing UUIDs yields privacy-preserving `404 Not Found`.
- **Automated Log Redaction:** Structured logs filter out emails, phone numbers, and diagnostic values.
- **Safety Guardrail Service:** Intercepts diagnosis queries, medication adjustments, prompt injection attempts, and emergency crises with safe refusals and physician referral prompts.
