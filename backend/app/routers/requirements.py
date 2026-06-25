"""Requirements CRUD endpoints."""

from fastapi import APIRouter, HTTPException

from app.db.database import get_connection
from app.models.requirements import RequirementItem, RequirementCreate, RequirementUpdate
from app.services.change_log import record_change_event

router = APIRouter()


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "text": row["text"],
        "status": row["status"],
        "topic": row["topic"],
        "source_type": row["source_type"],
        "source_file": row["source_file"],
        "excerpt": row["excerpt"],
        "updated_at": row["updated_at"],
    }


@router.get("", response_model=list[RequirementItem])
def list_requirements(status: str | None = None):
    conn = get_connection()
    try:
        if status:
            rows = conn.execute(
                "SELECT * FROM requirements WHERE status = ? ORDER BY updated_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM requirements ORDER BY updated_at DESC"
            ).fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


@router.post("", response_model=RequirementItem, status_code=201)
def create_requirement(body: RequirementCreate):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO requirements (text, status, topic, source_type, source_file, excerpt) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (body.text, body.status, body.topic, body.source_type, body.source_file, body.excerpt),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM requirements WHERE id = ?", (cursor.lastrowid,)).fetchone()
        result = _row_to_dict(row)
    finally:
        conn.close()
    try:
        record_change_event(
            event_type="requirement_created", title=body.text, topic=body.topic,
            source_file=body.source_file, source_excerpt=(body.excerpt or "")[:300],
            related_type="requirement", related_id=result["id"],
        )
    except Exception:
        pass
    return result


@router.patch("/{requirement_id}", response_model=RequirementItem)
def update_requirement(requirement_id: int, body: RequirementUpdate):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT * FROM requirements WHERE id = ?", (requirement_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Requirement not found")
        updates = body.model_dump(exclude_none=True)
        if not updates:
            return _row_to_dict(existing)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [requirement_id]
        conn.execute(
            f"UPDATE requirements SET {set_clause}, updated_at = datetime('now') WHERE id = ?",
            values,
        )
        conn.commit()
        row = conn.execute("SELECT * FROM requirements WHERE id = ?", (requirement_id,)).fetchone()
        result = _row_to_dict(row)
    finally:
        conn.close()
    try:
        record_change_event(
            event_type="requirement_updated", title=result["text"],
            description=f"Updated: {', '.join(updates.keys())}",
            topic=result.get("topic"), source_file=result.get("source_file"),
            related_type="requirement", related_id=requirement_id,
        )
    except Exception:
        pass
    return result
