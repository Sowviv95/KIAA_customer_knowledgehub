# Customer Knowledge Hub — LSEG Risk Intelligence

A local-first app for tracking customer updates, decisions, requirements, open questions, follow-ups, evidence, and change history for the LSEG Risk Intelligence project.

## What It Does

Drop customer files into a local folder. The app scans, parses, and indexes them. Then generate AI-powered insight candidates, review them with trust signals, and convert accepted insights into tracked requirements and follow-ups — all with full source lineage back to the original evidence.

**Core workflow:** Scan folder > Parse files > Generate Insights > Review candidates > Convert to requirements/follow-ups > Track changes > Summarize > Export

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd "Customer Knowledge Hub UI"
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Configure

1. Open Settings in the app
2. Set the local folder path to a directory containing customer files
3. Click Save Changes
4. Go to File Library and click Scan & Parse

### 4. Optional: LLM Key

For AI insight generation and grounded answers, set an OpenAI API key:

```powershell
$env:OPENAI_API_KEY="sk-..."    # PowerShell
```
```bash
export OPENAI_API_KEY="sk-..."  # Bash
```

Restart the backend after setting the key. The key is read from the environment only — never stored in the database or frontend.

## Supported File Types

DOCX, PPTX, XLSX, YAML, JSON, PDF, TXT, CSV, MSG, EML

## Key Features

| Feature | Description |
|---------|-------------|
| File Library | Scan local folder, parse files, track status |
| Ask AI | Evidence retrieval (keyword search) and LLM grounded answers |
| Insight Candidates | AI-generated customer updates with trust signals |
| Candidate Review | Accept/reject with filters, confidence scores, evidence quality badges |
| Requirements | Track confirmed, open, changed requirements with source lineage |
| Follow-ups | Track actions with priority, owner, due date |
| Executive Brief | Evidence-backed summary with requirements, follow-ups, open questions, risks |
| Timeline | Full change history with event grouping and search |
| Tracked Topics | Configurable topic taxonomy with search keywords |
| Exports | CSV for requirements/follow-ups/candidates, Markdown for Executive Brief |
| Demo Readiness | Settings panel showing system health and data state |

## Architecture

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** FastAPI + SQLite + Python
- **Search:** SQLite FTS5 full-text search
- **AI:** OpenAI GPT-4o-mini (optional — deterministic workflows work without it)
- **Storage:** Local SQLite database at `data/customer_knowledge_hub.db`

## Hard Constraints

- No Docker required
- No login / user management
- No file upload — local folder scanning only
- API keys backend-only, never exposed to frontend
- No embeddings / vector search
- No streaming
- No chat persistence
- AI outputs are suggestions only — human review required

## Reset Demo State

```bash
cd backend
python -m scripts.reset_demo_state        # Clear candidates + change log
python -m scripts.reset_demo_state --all  # Also clear actions, requirements, alerts
```

Source files and parsed chunks are never deleted by the reset script.

## Project Structure

```
CustomerKnowledgeHub_LSEG/
  backend/                  # FastAPI backend
    app/
      routers/              # API endpoints
      services/             # Business logic
      models/               # Pydantic models
      db/                   # Database schema + migrations
    tests/                  # Backend tests
  Customer Knowledge Hub UI/  # React frontend
    src/app/
      components/           # Page components
      api/                  # API client modules
      data/                 # Configuration data
  data/                     # SQLite database
  DEMO_SCRIPT.md            # Demo walkthrough
  RELEASE_NOTES.md          # Delivery summary
```

## Tests

```bash
cd backend && python -m pytest tests/ -v
cd "Customer Knowledge Hub UI" && npm run build
```
