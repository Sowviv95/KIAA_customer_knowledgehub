# Customer Knowledge Hub — Demo Script

## Prerequisites

1. Backend running: `cd backend && uvicorn app.main:app --reload`
2. Frontend running: `cd "Customer Knowledge Hub UI" && npm run dev`
3. Scan folder configured in Settings with customer files
4. Files scanned and parsed (Settings > Scan & Parse)
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

- File list with status, classification, and last updated
- Missing files are clearly marked
- Parse status (Done, Pending, Missing)

### 3. Evidence Drawer

Click any file or evidence link. Show:

- Source file name and metadata
- Parsed content preview
- "Ask AI about this" action
- Create action/requirement from evidence with source lineage

### 4. Ask AI

Navigate to Ask AI. Show:

- Evidence Retrieval mode: searches parsed chunks via FTS5
- Grounded Answer mode (requires LLM key): AI answers grounded in evidence only
- Source citations with file names and snippets

### 5. AI Candidate Extraction

Navigate to Summaries > Candidate Updates. Show:

- Click "Extract candidates" to run AI extraction from parsed evidence
- Each candidate shows: update type, title, description, confidence, topic
- Every candidate has a source file and evidence quote (grounded)
- LLM unavailable state is clean if key is not set

### 6. Candidate Review

On a candidate card:

- Click "Accept" to mark as accepted for review
- Click "Reject" to dismiss
- Accepting does NOT auto-create requirements or actions
- This is the human-review guardrail

### 7. Convert to Requirement or Follow-up

On an accepted candidate:

- Click "Convert to Requirement" or "Convert to Follow-up"
- Review modal opens with editable title, description, topic
- For follow-ups: priority, owner, due date fields
- Source file and evidence quote shown read-only
- Click "Create Requirement" or "Create Follow-up" to confirm
- Candidate card shows "Converted to Requirement" badge
- Click "View Requirement" to navigate to the created record

### 8. Requirements and Follow-ups

Navigate to Summaries > Requirements. Show:

- Converted requirements appear with source lineage
- Status can be changed inline (Open, Confirmed, Changed, etc.)
- Source evidence and file links preserved

Navigate to Summaries > Open Follow-ups. Show:

- Converted actions appear with priority, owner, due date
- Source file and evidence excerpt shown
- Mark as Done when completed

### 9. Timeline

Navigate to Summaries > Timeline. Show:

- Real events from candidate lifecycle and manual workflows
- Group filters: All, Customer decisions, AI candidate lifecycle, Requirements & follow-ups, Files & alerts
- Search box filters across title, topic, source file
- Today/Yesterday date grouping
- Expandable source excerpts on cards
- Evidence Drawer accessible from timeline events

### 10. Source Lineage Story

Explain the end-to-end lineage:

1. Customer file scanned and parsed into evidence chunks
2. AI extracted grounded candidate updates from evidence
3. Human reviewer accepted relevant candidates
4. Reviewer explicitly converted candidates to requirements/follow-ups
5. Every requirement/action traces back to source file and evidence quote
6. Timeline shows the full decision history

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

## Demo Readiness Check

Open Settings and scroll to "Demo Readiness" to verify:

- Backend connected
- LLM key configured (optional but recommended)
- Scan folder set
- Files indexed and parsed
- Chunks available for search
