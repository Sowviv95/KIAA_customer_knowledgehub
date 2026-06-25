"""Tracked topics service — derive topic summaries from existing tables."""

from app.db.database import get_connection
from app.services.file_inventory import classify_topic, EXTENSION_TO_CATEGORY

# Canonical topic vocabulary
CANONICAL_TOPICS = [
    "Scope", "Source List", "Schema/API", "SLA", "Monitoring Cadence",
    "Alerts", "Reports", "Support Model", "Commercials", "Open Questions",
    "Meeting Notes",
]

# Category → default topic mapping (for files/alerts without explicit topic)
_CATEGORY_TO_TOPIC: dict[str, str] = {
    "Meeting Notes": "Meeting Notes",
    "Source List": "Source List",
    "Schema": "Schema/API",
    "Email": "Scope",
    "Deck": "Scope",
    "Document": "Scope",
}


def _infer_topic(
    explicit_topic: str | None,
    source_file: str | None,
    category: str | None,
) -> str:
    """Deterministically infer a topic from available fields."""
    # 1. Use explicit topic if set and non-empty
    if explicit_topic and explicit_topic.strip():
        return explicit_topic.strip()
    # 2. Try keyword-based inference from source_file name
    if source_file:
        kw_topic = classify_topic(source_file, category or "Document")
        if kw_topic:
            return kw_topic
    # 3. Fall back to category mapping
    if category:
        return _CATEGORY_TO_TOPIC.get(category, "Scope")
    return "Scope"


def get_topic_summary() -> list[dict]:
    """Compute per-topic counts from files, alerts, actions, requirements."""
    conn = get_connection()
    try:
        # Accumulate counts per topic
        topics: dict[str, dict] = {}

        def _ensure(topic: str) -> dict:
            if topic not in topics:
                topics[topic] = {
                    "topic": topic,
                    "files_count": 0,
                    "alerts_count": 0,
                    "open_actions_count": 0,
                    "open_requirements_count": 0,
                    "last_activity_at": None,
                }
            return topics[topic]

        def _update_last(entry: dict, ts: str | None) -> None:
            if ts and (entry["last_activity_at"] is None or ts > entry["last_activity_at"]):
                entry["last_activity_at"] = ts

        # ── Files ──
        for row in conn.execute(
            "SELECT name, category, updated_at FROM files WHERE summary_status != 'Missing'"
        ).fetchall():
            topic = _infer_topic(None, row["name"], row["category"])
            entry = _ensure(topic)
            entry["files_count"] += 1
            _update_last(entry, row["updated_at"])

        # ── Alerts ──
        for row in conn.execute(
            "SELECT topic, source_file, source_type, created_at FROM alerts"
        ).fetchall():
            topic = _infer_topic(row["topic"], row["source_file"], row["source_type"])
            entry = _ensure(topic)
            entry["alerts_count"] += 1
            _update_last(entry, row["created_at"])

        # ── Actions (open only) ──
        for row in conn.execute(
            "SELECT source_file, created_at FROM actions WHERE status IN ('Open', 'In Progress', 'Blocked')"
        ).fetchall():
            topic = _infer_topic(None, row["source_file"], None)
            entry = _ensure(topic)
            entry["open_actions_count"] += 1
            _update_last(entry, row["created_at"])

        # ── Requirements (open only) ──
        for row in conn.execute(
            "SELECT topic, source_file, updated_at FROM requirements WHERE status IN ('Open', 'Changed', 'Assumption')"
        ).fetchall():
            topic = _infer_topic(row["topic"], row["source_file"], None)
            entry = _ensure(topic)
            entry["open_requirements_count"] += 1
            _update_last(entry, row["updated_at"])

        # Build result list — include all canonical topics (even empty ones)
        result = []
        seen = set()
        for t in CANONICAL_TOPICS:
            entry = topics.get(t) or _ensure(t)
            entry["total_items"] = (
                entry["files_count"] + entry["alerts_count"]
                + entry["open_actions_count"] + entry["open_requirements_count"]
            )
            result.append(entry)
            seen.add(t)

        # Add any non-canonical topics that appeared in data
        for t, entry in sorted(topics.items()):
            if t not in seen:
                entry["total_items"] = (
                    entry["files_count"] + entry["alerts_count"]
                    + entry["open_actions_count"] + entry["open_requirements_count"]
                )
                result.append(entry)

        return result

    finally:
        conn.close()
