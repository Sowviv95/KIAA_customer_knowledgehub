-- Customer Knowledge Hub — SQLite schema
-- Sprint 6A: table creation only, no data population

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS files (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    file_path       TEXT NOT NULL UNIQUE,
    file_type       TEXT NOT NULL,                          -- DOCX, XLSX, YAML, PPTX, MSG, PDF, JSON, EML
    category        TEXT NOT NULL DEFAULT 'Document',       -- RFP, Meeting Notes, Schema, Source List, Deck, Email, Onboarding
    file_hash       TEXT,                                   -- SHA-256 for change detection
    file_size       INTEGER,
    customer_relevance TEXT DEFAULT 'Reference',            -- Customer Provided, Meeting Note, Email Export, Schema, Source List, Internal Deck, Reference
    summary_status  TEXT NOT NULL DEFAULT 'Pending',        -- Done, Pending, In Progress, Skipped
    indexed_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    severity        TEXT NOT NULL DEFAULT 'Medium',         -- High, Medium, Low
    type            TEXT NOT NULL,                          -- New Customer File Added, Customer Document Changed, etc.
    description     TEXT NOT NULL,
    source_file     TEXT,
    source_type     TEXT,                                   -- Meeting, Email, Document, Deck, Schema, Source List
    topic           TEXT,
    status          TEXT NOT NULL DEFAULT 'New',            -- New, Reviewed, Ignored, Action
    excerpt         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracked_topics (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    understanding   TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracked_topic_updates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id        INTEGER NOT NULL REFERENCES tracked_topics(id),
    update_text     TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracked_topic_questions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id        INTEGER NOT NULL REFERENCES tracked_topics(id),
    question        TEXT NOT NULL,
    resolved        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS requirements (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    text            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'Open',           -- Confirmed, Open, Changed, Assumption, Superseded
    topic           TEXT,
    source_type     TEXT,
    source_file     TEXT,
    excerpt         TEXT,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_updates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date            TEXT NOT NULL,
    text            TEXT NOT NULL,
    source_type     TEXT NOT NULL,
    source_file     TEXT,
    topic           TEXT,
    excerpt         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS actions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    text            TEXT NOT NULL,
    owner           TEXT,
    due_date        TEXT,
    priority        TEXT NOT NULL DEFAULT 'Medium',         -- High, Medium, Low
    status          TEXT NOT NULL DEFAULT 'Open',           -- Open, Done, Cancelled
    source_file     TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS summaries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id         INTEGER REFERENCES files(id),
    summary_type    TEXT NOT NULL DEFAULT 'file',           -- file, executive, topic
    content         TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chunks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id         INTEGER NOT NULL REFERENCES files(id),
    chunk_index     INTEGER NOT NULL DEFAULT 0,
    content         TEXT NOT NULL,
    token_count     INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT,
    context         TEXT,                                   -- e.g. "Evidence — filename.docx" or "Context: Schema/API"
    role            TEXT DEFAULT 'All Views',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL REFERENCES chat_sessions(id),
    role            TEXT NOT NULL,                          -- user, assistant
    content         TEXT NOT NULL,
    sources         TEXT,                                   -- JSON array of source references
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_topic ON requirements(topic);
CREATE INDEX IF NOT EXISTS idx_customer_updates_date ON customer_updates(date);
CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

CREATE TABLE IF NOT EXISTS ai_update_candidates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    update_type     TEXT NOT NULL CHECK(update_type IN ('requirement','decision','open_question','action_item','scope_change','risk','clarification')),
    title           TEXT NOT NULL,
    description     TEXT,
    topic           TEXT,
    source_file     TEXT NOT NULL,
    source_chunk_id INTEGER,
    evidence_quote  TEXT NOT NULL,
    confidence      REAL,
    status          TEXT NOT NULL DEFAULT 'candidate' CHECK(status IN ('candidate','accepted','rejected')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at     TEXT,
    reviewer_action TEXT,
    raw_model_json  TEXT,
    error_message   TEXT,
    converted_to_type TEXT,
    converted_to_id   INTEGER,
    converted_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_candidates_status ON ai_update_candidates(status);
CREATE INDEX IF NOT EXISTS idx_ai_candidates_type ON ai_update_candidates(update_type);

CREATE TABLE IF NOT EXISTS customer_change_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type      TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    topic           TEXT,
    source_file     TEXT,
    source_excerpt  TEXT,
    related_type    TEXT,
    related_id      INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    metadata_json   TEXT
);

CREATE INDEX IF NOT EXISTS idx_change_log_event_type ON customer_change_log(event_type);
CREATE INDEX IF NOT EXISTS idx_change_log_created_at ON customer_change_log(created_at);

-- FTS5 full-text search over chunks (standalone, not content-sync)
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    content,
    file_name,
    tokenize='porter unicode61'
);
