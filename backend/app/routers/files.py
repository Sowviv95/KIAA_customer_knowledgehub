"""Files and scan endpoints."""

from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.db.database import get_connection
from app.models.files import FileRecord, ScanSummary, ChunkRecord, ParseSummary, BulkParseSummary, FileSummaryItem
from app.services.file_inventory import scan_folder
from app.services.chunker import parse_and_chunk_file, parse_all_files

router = APIRouter()


def _get_folder_path() -> str:
    """Read local_folder_path from settings."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT value FROM settings WHERE key = 'local_folder_path'"
        ).fetchone()
        return row["value"] if row else ""
    finally:
        conn.close()


@router.post("/scan", response_model=ScanSummary)
def scan_files():
    """Manually scan the configured local folder and register files."""
    folder = _get_folder_path()
    if not folder or not Path(folder).is_dir():
        raise HTTPException(
            status_code=400,
            detail="local_folder_path is not configured or does not exist. "
                   "Set it in Settings before scanning.",
        )
    try:
        result = scan_folder(folder)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.get("", response_model=list[FileRecord])
def list_files(limit: int = 200):
    """Return all indexed files, newest first."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM files ORDER BY updated_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [FileRecord(**dict(r)) for r in rows]
    finally:
        conn.close()


@router.get("/summary", response_model=list[FileSummaryItem])
def file_summaries():
    """Return all files with chunk counts and first-chunk excerpts."""
    conn = get_connection()
    try:
        rows = conn.execute("""
            SELECT f.*,
                   COALESCE(c.cnt, 0) AS chunk_count,
                   c.first_excerpt,
                   COALESCE(a.cnt, 0) AS alert_count
            FROM files f
            LEFT JOIN (
                SELECT file_id, COUNT(*) AS cnt,
                       (SELECT substr(content, 1, 300) FROM chunks c2
                        WHERE c2.file_id = chunks.file_id ORDER BY chunk_index LIMIT 1) AS first_excerpt
                FROM chunks GROUP BY file_id
            ) c ON c.file_id = f.id
            LEFT JOIN (
                SELECT source_file, COUNT(*) AS cnt FROM alerts GROUP BY source_file
            ) a ON a.source_file = f.name
            ORDER BY f.updated_at DESC
        """).fetchall()
        return [
            FileSummaryItem(
                id=r["id"], name=r["name"], file_type=r["file_type"],
                category=r["category"], customer_relevance=r["customer_relevance"],
                summary_status=r["summary_status"], indexed_at=r["indexed_at"],
                updated_at=r["updated_at"], chunk_count=r["chunk_count"],
                first_chunk_excerpt=r["first_excerpt"],
                alert_count=r["alert_count"],
            )
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/{file_id}", response_model=FileRecord)
def get_file(file_id: int):
    """Return a single file by ID."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="File not found")
        return FileRecord(**dict(row))
    finally:
        conn.close()


@router.post("/{file_id}/parse", response_model=ParseSummary)
def parse_single_file(file_id: int):
    """Parse a single file and store chunks."""
    result = parse_and_chunk_file(file_id)
    if result["status"] == "failed":
        raise HTTPException(status_code=500, detail=result.get("reason", "Parse failed"))
    return result


@router.post("/parse", response_model=BulkParseSummary)
def parse_all(force: bool = False):
    """Parse all unparsed files. Use force=true to re-parse all."""
    return parse_all_files(force=force)


@router.get("/{file_id}/chunks", response_model=list[ChunkRecord])
def get_file_chunks(file_id: int):
    """Return chunks for a file, ordered by chunk_index."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT id FROM files WHERE id = ?", (file_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="File not found")
        rows = conn.execute(
            "SELECT * FROM chunks WHERE file_id = ? ORDER BY chunk_index",
            (file_id,),
        ).fetchall()
        return [ChunkRecord(**dict(r)) for r in rows]
    finally:
        conn.close()
