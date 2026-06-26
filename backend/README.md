# Customer Knowledge Hub — Backend

FastAPI backend for the Customer Knowledge Hub. Provides REST API endpoints for file management, search, AI insight generation, requirements, follow-ups, timeline, topic configuration, and exports.

## Requirements

- Python 3.11+
- SQLite (bundled with Python)

## Setup

```bash
# From the backend/ directory
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

## Run

```bash
# From the backend/ directory
uvicorn app.main:app --reload --port 8000
```

The server will start at `http://localhost:8000`.

## OpenAI API Key

The API key is read from an environment variable only. It is never stored in the database, frontend, or code.

```powershell
# PowerShell — current session only
$env:OPENAI_API_KEY="sk-..."

# PowerShell — persistent (requires terminal restart)
setx OPENAI_API_KEY "sk-..."
```

```bash
# Bash
export OPENAI_API_KEY="sk-..."
```

After setting the key, restart the backend server. **Never commit real API keys.**

To check whether the key is configured:
```
GET http://localhost:8000/llm/status
```

## Endpoints

### Core

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/settings` | Get current settings |
| PUT | `/settings` | Update settings |
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/demo/readiness` | Demo readiness status |

### Files & Parsing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/files/scan` | Scan configured folder |
| GET | `/files` | List indexed files |
| GET | `/files/summary` | File summaries with chunk counts |
| GET | `/files/{id}` | Get single file |
| POST | `/files/{id}/parse` | Parse single file into chunks |
| POST | `/files/parse` | Parse all unparsed files |
| GET | `/files/{id}/chunks` | Get chunks for a file |

### Search & Ask AI

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search?q=...` | Full-text search over chunks |
| GET | `/llm/status` | LLM provider status |
| POST | `/llm/grounded-answer` | Search + LLM grounded answer |

### AI Insight Candidates

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ai/status` | AI extraction availability |
| POST | `/ai/candidates/extract` | Extract insight candidates from evidence |
| GET | `/ai/candidates` | List candidates (filterable) |
| PATCH | `/ai/candidates/{id}/review` | Accept/reject candidate |
| POST | `/ai/candidates/{id}/convert-to-requirement` | Convert to requirement |
| POST | `/ai/candidates/{id}/convert-to-action` | Convert to follow-up |

### Requirements & Follow-ups

| Method | Path | Description |
|--------|------|-------------|
| GET | `/requirements` | List requirements |
| POST | `/requirements` | Create requirement |
| PATCH | `/requirements/{id}` | Update requirement |
| GET | `/actions` | List follow-up actions |
| POST | `/actions` | Create action |
| PATCH | `/actions/{id}` | Update action |

### Alerts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/alerts` | List alerts |
| PUT | `/alerts/{id}` | Update alert status |

### Topics & Timeline

| Method | Path | Description |
|--------|------|-------------|
| GET | `/topics` | List tracked topics |
| POST | `/topics` | Create topic |
| PATCH | `/topics/{id}` | Update topic |
| DELETE | `/topics/{id}` | Delete topic |
| GET | `/topics/summary` | Topic summary with counts |
| GET | `/timeline/events` | Timeline events |
| GET | `/change-log` | Change log events |

## API Documentation

FastAPI auto-generates interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database

SQLite database is stored at `../data/customer_knowledge_hub.db` (relative to `backend/`). The database and tables are created automatically on first startup. Default tracked topics and settings are seeded on init.

## Tests

```bash
python -m pytest tests/ -v
```

## Not Implemented

- Automatic file watcher (watchdog)
- Embedding generation / vector search
- Chat history persistence
