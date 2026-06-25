"""Dashboard stats computed from existing database tables."""

from app.db.database import get_connection


def get_dashboard_stats() -> dict:
    """Compute dashboard stats from files, alerts, and chunks tables."""
    conn = get_connection()
    try:
        # File counts
        files_indexed = conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
        files_parsed = conn.execute(
            "SELECT COUNT(*) FROM files WHERE summary_status = 'Done'"
        ).fetchone()[0]
        files_missing = conn.execute(
            "SELECT COUNT(*) FROM files WHERE summary_status = 'Missing'"
        ).fetchone()[0]
        files_pending = files_indexed - files_parsed - files_missing

        # Alert counts
        total_alerts = conn.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
        open_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE status IN ('New', 'Action')"
        ).fetchone()[0]
        reviewed_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'Reviewed'"
        ).fetchone()[0]
        ignored_alerts = conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE status = 'Ignored'"
        ).fetchone()[0]

        # Chunks
        chunks_indexed = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]

        # Actions & requirements counts for follow-ups KPI
        open_actions = conn.execute(
            "SELECT COUNT(*) FROM actions WHERE status IN ('Open', 'In Progress', 'Blocked')"
        ).fetchone()[0]
        open_requirements = conn.execute(
            "SELECT COUNT(*) FROM requirements WHERE status IN ('Open', 'Changed', 'Assumption')"
        ).fetchone()[0]
        open_followups = open_actions + open_requirements

        # Last indexed timestamp
        row = conn.execute(
            "SELECT indexed_at FROM files ORDER BY indexed_at DESC LIMIT 1"
        ).fetchone()
        last_indexed_at = row["indexed_at"] if row else None

        # Folder configured?
        folder_row = conn.execute(
            "SELECT value FROM settings WHERE key = 'local_folder_path'"
        ).fetchone()
        folder_configured = bool(folder_row and folder_row["value"].strip())

        # Derive status label
        if not folder_configured:
            status_label = "No folder configured"
        elif files_indexed == 0:
            status_label = "Folder configured, no files indexed"
        elif files_pending > 0:
            status_label = "Files indexed, parsing pending"
        elif files_missing > 0:
            status_label = f"Indexed evidence ready ({files_missing} missing)"
        else:
            status_label = "Indexed evidence ready"

        # Latest files (5)
        latest_files_rows = conn.execute(
            "SELECT id, name, file_type, category, summary_status, indexed_at "
            "FROM files ORDER BY indexed_at DESC LIMIT 5"
        ).fetchall()
        latest_files = [
            {
                "id": r["id"],
                "name": r["name"],
                "file_type": r["file_type"],
                "category": r["category"],
                "summary_status": r["summary_status"],
                "indexed_at": r["indexed_at"],
            }
            for r in latest_files_rows
        ]

        # Latest alerts (5)
        latest_alerts_rows = conn.execute(
            "SELECT id, severity, type, description, source_file, status, created_at "
            "FROM alerts ORDER BY created_at DESC LIMIT 5"
        ).fetchall()
        latest_alerts = [
            {
                "id": r["id"],
                "severity": r["severity"],
                "type": r["type"],
                "description": r["description"],
                "source_file": r["source_file"],
                "status": r["status"],
                "created_at": r["created_at"],
            }
            for r in latest_alerts_rows
        ]

        return {
            "files_indexed": files_indexed,
            "files_parsed": files_parsed,
            "files_pending_parse": files_pending,
            "total_alerts": total_alerts,
            "open_alerts": open_alerts,
            "reviewed_alerts": reviewed_alerts,
            "ignored_alerts": ignored_alerts,
            "chunks_indexed": chunks_indexed,
            "open_actions": open_actions,
            "open_requirements": open_requirements,
            "open_followups": open_followups,
            "last_indexed_at": last_indexed_at,
            "status_label": status_label,
            "latest_files": latest_files,
            "latest_alerts": latest_alerts,
        }
    finally:
        conn.close()
