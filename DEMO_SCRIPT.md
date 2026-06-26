# Customer Knowledge Hub — Demo Script

## Prerequisites

1. Backend running: `cd backend && uvicorn app.main:app --reload`
2. Frontend running: `cd "Customer Knowledge Hub UI" && npm run dev`
3. Scan folder configured in Settings with customer files
4. Files scanned and parsed (Settings > Scan & Parse, or File Library > Scan & Parse)
5. Optional: `OPENAI_API_KEY` environment variable set for AI features

## Demo Path

### 1. Dashboard Overview

Open the Dashboard. Show:

- Files indexed and parsed counts
- Open alerts and follow-ups
- Recent indexed files and recent alerts
- Auto-refresh every 60 seconds

### 2. File Library

Navigate to File Library. Show:

- Header shows parsed/pending/missing counts and last scan time
- "Scan & Parse" button triggers folder scan and parsing directly from File Library
- File list with status, classification, and last updated
- Missing files are clearly marked
- Per-file Parse button for pending files
- Parse status (Done, Pending, Missing)

### 3. Evidence Drawer

Click any file or evidence link. Show:

- Source file name and metadata
- Parsed content preview
- "Ask AI about this" action
- Create action/requirement from evidence with source lineage

### 4. Ask AI

Navigate to Ask AI. Show:

- Evidence Retrieval mode (default): keyword search across all parsed file chunks
- Grounded Answer mode (requires LLM key): AI answers grounded in indexed evidence only
- Topic scope selector filters results to a specific tracked topic
- Source citations with file names and highlighted snippets
- Search Evidence sidebar for direct keyword search independent of chat

### 5. Summaries Overview

Navigate to Summaries. Show the Executive Brief tab:

- Evidence grounding statement: "Based on N parsed files and M evidence chunks"
- KPI cards: files indexed, evidence chunks, open alerts, open follow-ups
- Key Requirements section: status breakdown (confirmed/open/changed) with source files
- Open Follow-ups section: priority-ordered actions with owner and source
- Open Questions & Risks section: from accepted insight candidates with evidence quotes
- Accepted Insights section: pending conversion items with link to review
- Active tracked topics with file/alert/action counts
- Recent activity timeline preview
- Alert breakdown and data quality indicators
- Recent Changes section: categorized summary of what happened (insights generated, accepted, converted, requirements/follow-ups updated) with timestamps and source files
- All sections are deterministic — no AI-generated text, only actual data records

Switch to Tracked Topics tab:

- Topic cards with drill-down stats (files, alerts, open actions, open requirements)
- Click a topic to expand and ask AI about it

### 6. Insight Candidate Generation

Navigate to Summaries > Insight Candidates (or click "Generate Insights" from the File Library scan result banner). Show:

- Click "Generate Insights" to extract reviewable customer updates from parsed evidence
- Duplicate candidates are automatically filtered out across runs
- Each candidate shows: insight type, title, description, confidence, tracked topic
- Every candidate has a source file and evidence quote (grounded)
- LLM unavailable state is clean if key is not set

### 7. Candidate Review

Filter and review candidates:

- Filter by status (Pending / Accepted / Converted / Rejected), insight type, tracked topic, or source file
- "New" badge on candidates generated in the last 24 hours
- Status labels: Pending (new), Accepted, Rejected, Converted
- Extraction result shows new vs already captured counts
- Click "Accept" to mark as accepted for review
- Click "Reject" to dismiss — optional reason is recorded
- Rejected candidates show the reason and can be reset
- Accepting does NOT auto-create requirements or actions
- This is the human-review guardrail

### 8. Convert to Requirement or Follow-up

On an accepted candidate:

- Click "Convert to Requirement" or "Convert to Follow-up"
- Review modal opens with editable title, description, topic
- For follow-ups: priority, owner, due date fields
- Source file and evidence quote shown read-only
- Click "Create Requirement" or "Create Follow-up" to confirm
- Candidate card shows "Converted to Requirement" badge
- Click "View Requirement" to navigate to the created record

### 9. Requirements and Follow-ups

Navigate to Summaries > Requirements. Show:

- Converted requirements appear with source lineage
- Status can be changed inline (Open, Confirmed, Changed, etc.)
- Source evidence and file links preserved

Navigate to Summaries > Open Follow-ups. Show:

- Converted actions appear with priority, owner, due date
- Source file and evidence excerpt shown
- Mark as Done when completed

### 10. Timeline

Navigate to Summaries > Timeline. Show:

- Real events from candidate lifecycle and manual workflows
- Group filters: All, Customer decisions, AI candidate lifecycle, Requirements & follow-ups, Files & alerts
- Search box filters across title, topic, source file
- Today/Yesterday date grouping
- Expandable source excerpts on cards
- Evidence Drawer accessible from timeline events

### 11. Source Lineage Story

Explain the end-to-end lineage:

1. Customer file scanned and parsed into evidence chunks
2. AI extracted grounded candidate updates from evidence
3. Human reviewer accepted relevant candidates
4. Reviewer explicitly converted candidates to requirements/follow-ups
5. Every requirement/action traces back to source file and evidence quote
6. Timeline shows the full decision history

### 12. Export

Show export capabilities from each Summaries tab:

- Executive Brief: Export button downloads a Markdown summary with KPIs, requirements, follow-ups, open questions, topics, and recent changes
- Requirements tab: Export button downloads CSV with all requirements, statuses, source files, and evidence
- Open Follow-ups tab: Export button downloads CSV with actions, priorities, owners, and source evidence
- Insight Candidates tab: Export CSV button downloads all candidates with types, confidence, evidence quotes, and review status
- All exports include date-stamped filenames (e.g., requirements_export_20260626.csv)
- Exports are frontend-only — no data leaves the local machine

### Key Guardrails to Highlight

- AI suggestions are candidates only, never auto-applied
- Accept does not create records; conversion requires explicit confirmation
- Every AI output is grounded in parsed evidence with source file and quote
- API keys stay backend-only, never exposed to frontend
- No login required; locally hosted
- Deterministic workflows (scan, parse, search) work without LLM

## Reset Demo State

To clear AI candidates and change log for a fresh demo:

```bash
cd backend
python -m scripts.reset_demo_state
```

To also clear actions, requirements, and alerts:

```bash
python -m scripts.reset_demo_state --all
```

Source files and parsed chunks are never deleted by the reset script.

## Topic Configuration

Open Settings and scroll to "Tracked Topics":

- 11 default LSEG Risk Intelligence topics are pre-configured
- Each topic has search expansion keywords (used by Ask AI scope)
- Topics can be enabled/disabled — disabled topics hide from filters
- New topics can be added without code changes
- Topic changes reflect across Dashboard, Ask AI, and Summaries filters
- Existing records are safe if a topic is renamed or disabled

## Demo Readiness Check

Open Settings and scroll to "Demo Readiness" to verify:

- Backend connected
- LLM key configured (optional but recommended)
- Scan folder set
- Files indexed and parsed
- Chunks available for search
