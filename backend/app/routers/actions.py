"""Actions CRUD endpoints."""

from fastapi import APIRouter, HTTPException

from app.db.database import get_connection
from app.models.actions import ActionItem, ActionCreate, ActionUpdate
from app.services.change_log import record_change_event

router = APIRouter()


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "text": row["text"],
        "owner": row["owner"],
        "due_date": row["due_date"],
        "priority": row["priority"],
        "status": row["status"],
        "source_file": row["source_file"],
        "excerpt": row["excerpt"],
        "created_at": row["created_at"],
    }


@router.get("", response_model=list[ActionItem])
def list_actions(status: str | None = None):
    conn = get_connection()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM actions WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM actions ORDER BY created_at DESC"
            ).fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


@router.post("", response_model=ActionItem, status_code=201)
def create_action(body: ActionCreate):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO actions (text, owner, due_date, priority, status, source_file, excerpt) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (body.text, body.owner, body.due_date, body.priority, body.status, body.source_file, body.excerpt),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM actions WHERE id = ?", (cursor.lastrowid,)).fetchone()
        result = _row_to_dict(row)
    finally:
        conn.close()
    try:
        record_change_event(
            event_type="action_created", title=body.text, topic=None,
            source_file=body.source_file, source_excerpt=(body.excerpt or "")[:300],
            related_type="action", related_id=result["id"],
        )
    except Exception:
        pass
    return result


@router.patch("/{action_id}", response_model=ActionItem)
def update_action(action_id: int, body: ActionUpdate):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT * FROM actions WHERE id = ?", (action_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Action not found")
        updates = body.model_dump(exclude_none=True)
        if not updates:
            return _row_to_dict(existing)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [action_id]
        conn.execute(f"UPDATE actions SET {set_clause} WHERE id = ?", values)
        conn.commit()
        row = conn.execute("SELECT * FROM actions WHERE id = ?", (action_id,)).fetchone()
        result = _row_to_dict(row)
    finally:
        conn.close()
    try:
        record_change_event(
            event_type="action_updated", title=result["text"],
            description=f"Updated: {', '.join(updates.keys())}",
            source_file=result.get("source_file"),
            related_type="action", related_id=action_id,
        )
    except Exception:
        pass
    return result
