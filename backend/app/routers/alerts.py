"""Alerts endpoints."""

from fastapi import APIRouter, HTTPException

from app.db.database import get_connection
from app.models.files import AlertRecord
from app.models.alerts import AlertStatusUpdate

router = APIRouter()

VALID_STATUSES = {"New", "Reviewed", "Ignored", "Action"}


@router.get("", response_model=list[AlertRecord])
def list_alerts(
    limit: int = 200,
    status: str | None = None,
    severity: str | None = None,
):
    """Return alerts, newest first. Optional status/severity filters."""
    conn = get_connection()
    try:
        clauses = []
        params: list = []
        if status:
            clauses.append("status = ?")
            params.append(status)
        if severity:
            clauses.append("severity = ?")
            params.append(severity)
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        params.append(limit)
        rows = conn.execute(
            f"SELECT * FROM alerts{where} ORDER BY created_at DESC LIMIT ?",
            params,
        ).fetchall()
        return [AlertRecord(**dict(r)) for r in rows]
    finally:
        conn.close()


@router.put("/{alert_id}", response_model=AlertRecord)
def update_alert_status(alert_id: int, update: AlertStatusUpdate):
    """Update an alert's status."""
    if update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{update.status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}",
        )
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Alert not found")
        conn.execute("UPDATE alerts SET status = ? WHERE id = ?", (update.status, alert_id))
        conn.commit()
        row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        return AlertRecord(**dict(row))
    finally:
        conn.close()
