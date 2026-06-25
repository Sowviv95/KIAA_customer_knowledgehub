# Customer Knowledge Hub — Backend

FastAPI backend for the Customer Knowledge Hub. Provides REST API endpoints for settings, files, alerts, search and LLM-grounded answers.

## Status

**Sprint 10A** — Backend includes file scanning, parsing, FTS5 search, and LLM provider foundation. Frontend Ask AI uses retrieval-only mode. LLM grounded answers available via backend test endpoint.

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

After setting the key, restart the backend server.

**Never commit real API keys.**

To check whether the key is configured:
```
GET http://localhost:8000/llm/status
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/settings` | Get current settings |
| PUT | `/settings` | Update settings |
| POST | `/files/scan` | Scan configured folder |
| GET | `/files` | List indexed files |
| GET | `/files/{id}` | Get single file |
| POST | `/files/{id}/parse` | Parse single file into chunks |
| POST | `/files/parse` | Parse all unparsed files |
| GET | `/files/{id}/chunks` | Get chunks for a file |
| GET | `/alerts` | List alerts |
| PUT | `/alerts/{id}` | Update alert status |
| GET | `/search?q=...` | Full-text search over chunks |
| GET | `/llm/status` | LLM provider status |
| POST | `/llm/grounded-answer-test` | Test grounded answer (backend only) |

## API Documentation

FastAPI auto-generates interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database

SQLite database is stored at `../data/customer_knowledge_hub.db` (relative to `backend/`). The database and tables are created automatically on first startup.

## What is NOT implemented yet

- Automatic file watcher (watchdog)
- Embedding generation
- Vector / semantic search
- Summary generation
- Customer update extraction
- Requirement extraction
- Frontend LLM answer integration (Ask AI uses retrieval-only mode)
- Chat history persistence
