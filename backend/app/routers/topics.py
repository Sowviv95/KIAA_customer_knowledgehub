"""Tracked topics endpoints — summary + CRUD configuration."""

from fastapi import APIRouter, HTTPException

from app.db.database import get_connection
from app.models.topics import TopicSummaryItem, TrackedTopicItem, TrackedTopicCreate, TrackedTopicUpdate
from app.services.topics import get_topic_summary

router = APIRouter()


def _row_to_item(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "understanding": row["understanding"],
        "enabled": bool(row["enabled"]),
        "sort_order": row["sort_order"],
        "keywords": row["keywords"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@router.get("/summary", response_model=list[TopicSummaryItem])
def topic_summary():
    """Return per-topic counts derived from files, alerts, actions, and requirements."""
    return get_topic_summary()


@router.get("", response_model=list[TrackedTopicItem])
def list_topics(enabled_only: bool = False):
    """Return all configured tracked topics."""
    conn = get_connection()
    try:
        if enabled_only:
            rows = conn.execute(
                "SELECT * FROM tracked_topics WHERE enabled = 1 ORDER BY sort_order, id"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM tracked_topics ORDER BY sort_order, id"
            ).fetchall()
        return [_row_to_item(r) for r in rows]
    finally:
        conn.close()


@router.post("", response_model=TrackedTopicItem, status_code=201)
def create_topic(body: TrackedTopicCreate):
    """Add a new tracked topic."""
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM tracked_topics WHERE name = ?", (body.name,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail=f"Topic '{body.name}' already exists.")
        cursor = conn.execute(
            "INSERT INTO tracked_topics (name, understanding, enabled, sort_order, keywords) "
            "VALUES (?, ?, ?, ?, ?)",
            (body.name, body.understanding, int(body.enabled), body.sort_order, body.keywords),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM tracked_topics WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return _row_to_item(row)
    finally:
        conn.close()


@router.patch("/{topic_id}", response_model=TrackedTopicItem)
def update_topic(topic_id: int, body: TrackedTopicUpdate):
    """Update a tracked topic."""
    conn = get_connection()
    try:
        existing = conn.execute("SELECT * FROM tracked_topics WHERE id = ?", (topic_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Topic not found")
        updates = body.model_dump(exclude_none=True)
        if not updates:
            return _row_to_item(existing)
        if "enabled" in updates:
            updates["enabled"] = int(updates["enabled"])
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [topic_id]
        conn.execute(
            f"UPDATE tracked_topics SET {set_clause}, updated_at = datetime('now') WHERE id = ?",
            values,
        )
        conn.commit()
        row = conn.execute("SELECT * FROM tracked_topics WHERE id = ?", (topic_id,)).fetchone()
        return _row_to_item(row)
    finally:
        conn.close()


@router.delete("/{topic_id}", status_code=204)
def delete_topic(topic_id: int):
    """Delete a tracked topic. Existing records with this topic name remain unchanged."""
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM tracked_topics WHERE id = ?", (topic_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Topic not found")
        conn.execute("DELETE FROM tracked_topics WHERE id = ?", (topic_id,))
        conn.commit()
    finally:
        conn.close()
