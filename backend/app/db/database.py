"""SQLite database connection and initialisation."""

import sqlite3
from pathlib import Path

from app.core.config import DB_PATH, DATA_DIR

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row factory enabled."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """Create all tables from schema.sql if they don't exist."""
    schema_sql = _SCHEMA_PATH.read_text(encoding="utf-8")
    conn = get_connection()
    try:
        conn.executescript(schema_sql)
        # Seed default settings if the table is empty
        cursor = conn.execute("SELECT COUNT(*) FROM settings")
        if cursor.fetchone()[0] == 0:
            defaults = [
                ("local_folder_path", ""),
                ("token_budget_per_request", "80000"),
                ("llm_provider", "OpenAI GPT-4o"),
                ("embedding_provider", "OpenAI text-embedding-3-large"),
                ("mock_mode", "true"),
            ]
            conn.executemany(
                "INSERT INTO settings (key, value) VALUES (?, ?)",
                defaults,
            )
            conn.commit()

        # Migrate: add excerpt column to actions if missing
        _migrate_actions_excerpt(conn)

        # Migrate: create ai_update_candidates table if missing
        _migrate_ai_candidates(conn)

        # Migrate: add conversion columns to ai_update_candidates if missing
        _migrate_ai_candidates_conversion(conn)

        # Migrate: create customer_change_log table if missing
        _migrate_change_log(conn)

        # Migrate: add configurable columns to tracked_topics
        _migrate_tracked_topics(conn)

        # Seed default tracked topics if empty
        _seed_tracked_topics(conn)

        # Backfill FTS index from existing chunks if needed
        _backfill_fts(conn)
    finally:
        conn.close()


def _migrate_actions_excerpt(conn) -> None:
    """Add excerpt column to actions table if it doesn't exist yet."""
    cols = [row[1] for row in conn.execute("PRAGMA table_info(actions)").fetchall()]
    if "excerpt" not in cols:
        conn.execute("ALTER TABLE actions ADD COLUMN excerpt TEXT")
        conn.commit()


def _migrate_ai_candidates(conn) -> None:
    """Create ai_update_candidates table if it doesn't exist (for existing DBs)."""
    tables = [row[0] for row in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()]
    if "ai_update_candidates" not in tables:
        conn.executescript("""
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
                error_message   TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_ai_candidates_status ON ai_update_candidates(status);
            CREATE INDEX IF NOT EXISTS idx_ai_candidates_type ON ai_update_candidates(update_type);
        """)


def _migrate_ai_candidates_conversion(conn) -> None:
    """Add conversion tracking columns to ai_update_candidates if missing."""
    tables = [row[0] for row in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()]
    if "ai_update_candidates" not in tables:
        return
    cols = [row[1] for row in conn.execute("PRAGMA table_info(ai_update_candidates)").fetchall()]
    if "converted_to_type" not in cols:
        conn.execute("ALTER TABLE ai_update_candidates ADD COLUMN converted_to_type TEXT")
        conn.execute("ALTER TABLE ai_update_candidates ADD COLUMN converted_to_id INTEGER")
        conn.execute("ALTER TABLE ai_update_candidates ADD COLUMN converted_at TEXT")
        conn.commit()


def _migrate_change_log(conn) -> None:
    """Create customer_change_log table if it doesn't exist (for existing DBs)."""
    tables = [row[0] for row in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()]
    if "customer_change_log" not in tables:
        conn.executescript("""
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
        """)


_DEFAULT_TOPICS = [
    ("Scope", 1, '["scope","phase","coverage","entity","ingestion","Phase 1","Phase 2"]'),
    ("Source List", 2, '["source list","data source","website","URL","monitoring","coverage"]'),
    ("Schema/API", 3, '["schema","API","swagger","endpoint","payload","field","validation","countryCode"]'),
    ("SLA", 4, '["SLA","latency","uptime","response time","p99","cadence","timeliness"]'),
    ("Monitoring Cadence", 5, '["monitoring","cadence","refresh","frequency","batch","delta","daily"]'),
    ("Alerts", 6, '["alert","notification","webhook","email","threshold","trigger"]'),
    ("Reports", 7, '["report","daily report","weekly report","coverage report","change log"]'),
    ("Support Model", 8, '["support","incident","issue","resolution","outage","P1","P2","weekend"]'),
    ("Commercials", 9, '["commercial","pricing","proposal","tier","discount","API call","volume"]'),
    ("Open Questions", 10, '["question","clarification","open","pending","unresolved","TBC"]'),
    ("Meeting Notes", 11, '["meeting","call","transcript","steerco","workshop","discovery"]'),
]


def _migrate_tracked_topics(conn) -> None:
    """Add enabled, sort_order, keywords columns to tracked_topics if missing."""
    cols = [row[1] for row in conn.execute("PRAGMA table_info(tracked_topics)").fetchall()]
    if "enabled" not in cols:
        conn.execute("ALTER TABLE tracked_topics ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1")
        conn.commit()
    if "sort_order" not in cols:
        conn.execute("ALTER TABLE tracked_topics ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
        conn.commit()
    if "keywords" not in cols:
        conn.execute("ALTER TABLE tracked_topics ADD COLUMN keywords TEXT")
        conn.commit()


def _seed_tracked_topics(conn) -> None:
    """Seed default tracked topics if the table is empty."""
    count = conn.execute("SELECT COUNT(*) FROM tracked_topics").fetchone()[0]
    if count > 0:
        return
    for name, order, keywords in _DEFAULT_TOPICS:
        conn.execute(
            "INSERT INTO tracked_topics (name, understanding, enabled, sort_order, keywords) "
            "VALUES (?, '', 1, ?, ?)",
            (name, order, keywords),
        )
    conn.commit()


def _backfill_fts(conn) -> None:
    """Populate chunks_fts from chunks table if FTS is empty but chunks exist."""
    chunk_count = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    if chunk_count == 0:
        return
    fts_count = conn.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
    if fts_count >= chunk_count:
        return
    # Clear and rebuild FTS
    conn.execute("DELETE FROM chunks_fts")
    conn.execute("""
        INSERT INTO chunks_fts(rowid, content, file_name)
        SELECT c.id, c.content, f.name
        FROM chunks c JOIN files f ON c.file_id = f.id
    """)
    conn.commit()
