# Customer Knowledge Hub — Backend Plan

## Sprint 6A Scope (Current)

Backend foundation — database schema and basic settings API.

### What was built
- FastAPI app with CORS, health endpoint, settings endpoints
- SQLite database with 11+ tables (files, alerts, tracked_topics, requirements, customer_updates, actions, summaries, chunks, chat_sessions, chat_messages, settings)
- Pydantic models for settings
- Database initialisation with default settings
- Backend README with setup instructions

### What is intentionally NOT included
- File watcher / file scanning
- File parsing (DOCX, XLSX, YAML, PPTX, MSG, PDF, JSON, EML)
- LLM calls or provider abstraction
- Embedding generation
- Vector search / SQLite FTS5
- Summary generation (deterministic or LLM-based)
- Alert generation from file changes
- Chat / Ask AI backend
- Frontend-to-backend API connection (frontend still uses mock data)

## Recommended Next Sprints

### Sprint 6B: File Scanning Foundation
- Implement local folder watcher using `watchdog`
- Detect new, changed and deleted files in the configured folder
- Register files in the `files` table with SHA-256 hash for change detection
- Generate alerts for new/changed files
- Do not parse file contents yet

### Sprint 6C: File Parsing
- Parse DOCX, XLSX, YAML, PPTX, MSG using Python libraries
- Extract text content into `chunks` table
- Calculate token counts per chunk
- Generate file-level summaries (deterministic extraction, not LLM)

### Sprint 7A: Frontend-Backend Connection
- Replace mock data imports in the frontend with API calls
- Add API client utility to the frontend
- Wire Settings page to real backend settings
- Wire File Library to real file list from database
- Keep mock fallback for features not yet backed by API

### Sprint 7B: SQLite FTS5 and Search
- Add FTS5 virtual tables for full-text search across chunks
- Wire search results to the File Library and Ask AI
- Cached summaries for tracked topics

### Sprint 8: Optional LLM Integration
- LLM provider abstraction (OpenAI, Anthropic, Azure, local Ollama)
- Summary generation using LLM
- Ask AI chat with RAG over indexed chunks
- Confidence scoring for source citations
