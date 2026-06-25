"""Shared fixtures for backend tests."""

import os
import tempfile
import pytest
from pathlib import Path

# Ensure OPENAI_API_KEY is not set during tests by default
# Individual tests can override this.


@pytest.fixture(autouse=True)
def _isolated_db(tmp_path, monkeypatch):
    """Use a temporary database for each test."""
    db_path = tmp_path / "test.db"
    data_dir = tmp_path
    monkeypatch.setattr("app.core.config.DB_PATH", db_path)
    monkeypatch.setattr("app.core.config.DATA_DIR", data_dir)
    # Initialize the DB
    from app.db.database import init_db
    init_db()


@pytest.fixture
def client(_isolated_db):
    """FastAPI test client with isolated database."""
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)


@pytest.fixture
def seeded_chunks(_isolated_db):
    """Seed some test chunks into the database."""
    import uuid
    from app.db.database import get_connection
    conn = get_connection()
    try:
        unique = uuid.uuid4().hex[:8]
        conn.execute(
            "INSERT INTO files (name, file_path, file_type, category) VALUES (?, ?, ?, ?)",
            (f"test_meeting_notes_{unique}.docx", f"/test/test_meeting_notes_{unique}.docx", "DOCX", "Meeting Notes"),
        )
        file_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        chunks = [
            (file_id, 0, "Customer confirmed that API latency must be under 500ms p99. This is a hard requirement for phase 1 delivery.", 25),
            (file_id, 1, "Open question: Will the customer provide test credentials for the staging environment? Need answer by next week.", 20),
            (file_id, 2, "Decision made: Data delivery will use REST API rather than SFTP. Customer prefers API-based approach for real-time updates.", 25),
        ]
        for fid, idx, content, tokens in chunks:
            conn.execute(
                "INSERT INTO chunks (file_id, chunk_index, content, token_count) VALUES (?, ?, ?, ?)",
                (fid, idx, content, tokens),
            )
        conn.commit()
        return file_id
    finally:
        conn.close()
