# Customer Knowledge Hub — Release Notes

## Delivery Summary

Local-first Customer Knowledge Hub for the LSEG Risk Intelligence project. Built across sprints 18A–27.

### Core Capabilities

**File Ingestion**
- Local folder scanning with automatic file classification (Document, Meeting Notes, Schema, Source List, Deck, Email)
- File parsing into searchable evidence chunks (DOCX, PPTX, XLSX, YAML, JSON, PDF, TXT, CSV, MSG, EML)
- Missing file detection and status tracking
- Scan & Parse available from both Settings and File Library

**Evidence Search**
- Full-text search (SQLite FTS5) across all parsed file chunks
- Topic-scoped search with keyword expansion
- Evidence Drawer with parsed content preview, chunk viewer, and source lineage
- Direct keyword search sidebar in Ask AI

**AI-Powered Insights**
- LLM-based insight candidate extraction from parsed evidence (requires OPENAI_API_KEY)
- Candidate deduplication by source file + title
- 7 insight types: Requirement, Decision, Open Question, Action Item, Scope Change, Risk, Clarification
- Every candidate grounded in source file + verbatim evidence quote
- Confidence scoring with color-coded indicators (High/Medium/Low)
- Evidence quality badges (Evidence-backed / Weak evidence)

**Grounded Answers**
- Ask AI Evidence Retrieval mode: keyword search, no LLM
- Ask AI Grounded Answer mode: search + LLM answer grounded in indexed evidence only
- Role-specific suggested questions
- Topic scope filtering

**Candidate Review**
- Accept / reject / reset workflow
- Optional reject reason (stored as reviewer_action)
- Filters by status, insight type, tracked topic, source file
- "New" badge on candidates created in last 24 hours
- Expanded audit lifecycle (created/reviewed/converted timestamps)
- Quality warnings before conversion (empty topic, short evidence)

**Conversion Workflow**
- Explicit conversion to Requirement or Follow-up via confirmation modal
- Editable title, description, topic, priority, owner, due date
- Source file and evidence quote preserved read-only
- Accepting does NOT auto-create records — conversion requires explicit confirmation

**Requirements & Follow-ups**
- Full CRUD for requirements (Confirmed, Open, Changed, Assumption, Superseded)
- Full CRUD for follow-up actions (Open, Done, with priority/owner/due date)
- Inline status changes
- Source evidence links preserved

**Executive Brief**
- Evidence grounding statement
- KPI cards: files indexed, evidence chunks, open alerts, open follow-ups
- Key Requirements section with status breakdown
- Open Follow-ups section with priority badges
- Open Questions & Risks from accepted insight candidates
- Accepted Insights pending conversion
- Active tracked topics
- Recent Changes from change log
- Alert breakdown and data quality indicators
- All sections deterministic — no AI-generated narrative text

**Timeline & Change Log**
- Unified timeline merging file events + change log
- Event group filters (All, Customer decisions, AI lifecycle, Requirements & follow-ups, Files & alerts)
- Search across title, topic, source file
- Today/Yesterday date grouping
- Expandable source excerpts

**Exports**
- CSV: Requirements, Follow-ups, Insight Candidates
- Markdown: Executive Brief
- Date-stamped filenames
- Frontend-only — no data leaves the local machine

**Topic Configuration**
- 11 default LSEG Risk Intelligence topics seeded on init
- Enable/disable topics from Settings
- Add new topics without code changes
- Search expansion keywords configurable per topic
- Changes reflect across Dashboard, Ask AI, and Summaries filters

**Alerts**
- Automatic alerts on file scan (new/changed files, schema updates, source list changes)
- Status management (New, Reviewed, Ignored, Action)
- Severity levels (High, Medium, Low)
- Create follow-up from alert

**Settings & Configuration**
- Local folder path configuration
- Model provider selection
- Token budget slider
- LLM status indicator
- Tracked topics management
- Demo readiness panel

### Guardrails

- AI suggestions are candidates only — never auto-applied
- Accept does not create records; conversion requires explicit modal confirmation
- Every AI output is grounded in parsed evidence with source file and quote
- API keys stay backend-only, never exposed to frontend
- No login required; locally hosted
- No files are uploaded anywhere
- Deterministic workflows (scan, parse, search) work without LLM

### Technical Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLite + Python
- Search: SQLite FTS5
- AI: OpenAI GPT-4o-mini (optional)

### Test Results

- Backend: 43/43 tests passing
- Frontend: Production build successful

### Known Limitations

- No automatic file watcher (manual scan required)
- No embedding / vector search
- No chat history persistence
- No streaming
- No multi-user / login
- No PDF rendering in Evidence Drawer
- Topic keywords are JSON text (no dedicated editor UI)
