"""Timeline service — derive chronological events from existing tables."""

from app.db.database import get_connection
from app.services.file_inventory import classify_topic, EXTENSION_TO_CATEGORY


def _infer_topic(explicit_topic: str | None, source_file: str | None, category: str | None) -> str | None:
    """Best-effort topic inference from available fields."""
    if explicit_topic and explicit_topic.strip():
        return explicit_topic.strip()
    if source_file:
        return classify_topic(source_file, category or "Document")
    return None


def get_timeline_events(
    limit: int = 50,
    topic: str | None = None,
    event_type: str | None = None,
) -> list[dict]:
    """Return chronological events derived from files, alerts, actions, requirements."""
    conn = get_connection()
    try:
        events: list[dict] = []

        # ── File events ──
        for row in conn.execute("SELECT * FROM files").fetchall():
            name = row["name"]
            cat = row["category"]
            ftopic = _infer_topic(None, name, cat)
            status = row["summary_status"]

            # File indexed
            events.append({
                "id": f"file-indexed-{row['id']}",
                "event_type": "file_indexed",
                "title": f"File indexed: {name}",
                "description": f"{cat} file added to index ({status})",
                "source_file": name,
                "topic": ftopic,
                "status": status,
                "severity_or_priority": None,
                "occurred_at": row["indexed_at"],
                "related_entity_type": "file",
                "related_entity_id": row["id"],
            })

            # File parsed (if Done and updated_at differs from indexed_at)
            if status == "Done" and row["updated_at"] != row["indexed_at"]:
                events.append({
                    "id": f"file-parsed-{row['id']}",
                    "event_type": "file_parsed",
                    "title": f"File parsed: {name}",
                    "description": f"Content extracted and chunked for search",
                    "source_file": name,
                    "topic": ftopic,
                    "status": "Done",
                    "severity_or_priority": None,
                    "occurred_at": row["updated_at"],
                    "related_entity_type": "file",
                    "related_entity_id": row["id"],
                })

            # File missing
            if status == "Missing":
                events.append({
                    "id": f"file-missing-{row['id']}",
                    "event_type": "file_missing",
                    "title": f"File missing: {name}",
                    "description": f"File no longer found on disk",
                    "source_file": name,
                    "topic": ftopic,
                    "status": "Missing",
                    "severity_or_priority": None,
                    "occurred_at": row["updated_at"],
                    "related_entity_type": "file",
                    "related_entity_id": row["id"],
                })

        # ── Alert events ──
        for row in conn.execute("SELECT * FROM alerts").fetchall():
            atopic = _infer_topic(row["topic"], row["source_file"], row["source_type"])
            events.append({
                "id": f"alert-{row['id']}",
                "event_type": "alert_created",
                "title": row["description"],
                "description": row["type"],
                "source_file": row["source_file"],
                "topic": atopic,
                "status": row["status"],
                "severity_or_priority": row["severity"],
                "occurred_at": row["created_at"],
                "related_entity_type": "alert",
                "related_entity_id": row["id"],
            })

        # ── Action events ──
        for row in conn.execute("SELECT * FROM actions").fetchall():
            atopic = _infer_topic(None, row["source_file"], None)
            events.append({
                "id": f"action-{row['id']}",
                "event_type": "action_created",
                "title": f"Follow-up created",
                "description": row["text"][:200],
                "source_file": row["source_file"],
                "topic": atopic,
                "status": row["status"],
                "severity_or_priority": row["priority"],
                "occurred_at": row["created_at"],
                "related_entity_type": "action",
                "related_entity_id": row["id"],
            })

        # ── Requirement events ──
        for row in conn.execute("SELECT * FROM requirements").fetchall():
            rtopic = _infer_topic(row["topic"], row["source_file"], None)
            events.append({
                "id": f"requirement-{row['id']}",
                "event_type": "requirement_created",
                "title": f"Requirement: {row['status']}",
                "description": row["text"][:200],
                "source_file": row["source_file"],
                "topic": rtopic,
                "status": row["status"],
                "severity_or_priority": None,
                "occurred_at": row["updated_at"],
                "related_entity_type": "requirement",
                "related_entity_id": row["id"],
            })

        # ── Filter ──
        if topic:
            events = [e for e in events if e["topic"] and e["topic"].lower() == topic.lower()]
        if event_type:
            events = [e for e in events if e["event_type"] == event_type]

        # ── Sort newest first, limit ──
        events.sort(key=lambda e: e["occurred_at"] or "", reverse=True)
        return events[:limit]

    finally:
        conn.close()
