"""Demo readiness endpoint — aggregated status for demo preparation."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import is_openai_configured
from app.db.database import get_connection


router = APIRouter()


class DemoReadinessResponse(BaseModel):
    backend_healthy: bool
    llm_configured: bool
    scan_folder_configured: bool
    scan_folder_path: str
    files_indexed: int
    files_parsed: int
    files_missing: int
    chunks_parsed: int
    candidates_total: int
    candidates_accepted: int
    candidates_converted: int
    open_followups: int
    requirements_total: int
    change_log_events: int


@router.get("/readiness", response_model=DemoReadinessResponse)
def get_demo_readiness():
    """Return aggregated demo readiness status from all tables."""
    conn = get_connection()
    try:
        # Scan folder
        row = conn.execute("SELECT value FROM settings WHERE key = 'local_folder_path'").fetchone()
        scan_path = row["value"] if row else ""

        files_indexed = conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
        files_parsed = conn.execute("SELECT COUNT(*) FROM files WHERE summary_status = 'Done'").fetchone()[0]
        files_missing = conn.execute("SELECT COUNT(*) FROM files WHERE summary_status = 'Missing'").fetchone()[0]
        chunks = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]

        cands_total = conn.execute("SELECT COUNT(*) FROM ai_update_candidates").fetchone()[0]
        cands_accepted = conn.execute("SELECT COUNT(*) FROM ai_update_candidates WHERE status = 'accepted'").fetchone()[0]
        cands_converted = conn.execute("SELECT COUNT(*) FROM ai_update_candidates WHERE converted_to_type IS NOT NULL").fetchone()[0]

        open_actions = conn.execute("SELECT COUNT(*) FROM actions WHERE status IN ('Open','In Progress','Blocked')").fetchone()[0]
        reqs_total = conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0]

        log_events = conn.execute("SELECT COUNT(*) FROM customer_change_log").fetchone()[0]

        return DemoReadinessResponse(
            backend_healthy=True,
            llm_configured=is_openai_configured(),
            scan_folder_configured=bool(scan_path.strip()),
            scan_folder_path=scan_path,
            files_indexed=files_indexed,
            files_parsed=files_parsed,
            files_missing=files_missing,
            chunks_parsed=chunks,
            candidates_total=cands_total,
            candidates_accepted=cands_accepted,
            candidates_converted=cands_converted,
            open_followups=open_actions,
            requirements_total=reqs_total,
            change_log_events=log_events,
        )
    finally:
        conn.close()
