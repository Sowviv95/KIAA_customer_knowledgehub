"""Customer change log service — deterministic event recording."""

import json
from datetime import datetime, timezone

from app.db.database import get_connection


def record_change_event(
    event_type: str,
    title: str,
    description: str | None = None,
    topic: str | None = None,
    source_file: str | None = None,
    source_excerpt: str | None = None,
    related_type: str | None = None,
    related_id: int | None = None,
    metadata: dict | None = None,
) -> int:
    """Record a change log event. Returns the new event id."""
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        meta_json = json.dumps(metadata) if metadata else None
        cursor = conn.execute(
            """INSERT INTO customer_change_log
               (event_type, title, description, topic, source_file,
                source_excerpt, related_type, related_id, created_at, metadata_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (event_type, title, description, topic, source_file,
             source_excerpt, related_type, related_id, now, meta_json),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def list_change_events(
    event_type: str | None = None,
    topic: str | None = None,
    related_type: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """List change log events, newest first."""
    conn = get_connection()
    try:
        conditions = []
        params: list = []

        if event_type:
            conditions.append("event_type = ?")
            params.append(event_type)
        if topic:
            conditions.append("topic LIKE ?")
            params.append(f"%{topic}%")
        if related_type:
            conditions.append("related_type = ?")
            params.append(related_type)

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)

        rows = conn.execute(
            f"""SELECT id, event_type, title, description, topic, source_file,
                       source_excerpt, related_type, related_id, created_at
                FROM customer_change_log
                {where}
                ORDER BY created_at DESC, id DESC
                LIMIT ?""",
            params,
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
