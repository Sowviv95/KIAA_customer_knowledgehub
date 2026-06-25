"""Text chunking service — splits parsed text into database-ready chunks."""

from datetime import datetime, timezone

from app.db.database import get_connection
from app.services.parsers import parse_file, SUPPORTED_PARSE_EXTENSIONS

# Target chunk size in characters
CHUNK_TARGET = 1200
CHUNK_MIN = 200
CHUNK_MAX = 2000


def _estimate_tokens(text: str) -> int:
    """Simple token estimate: ~4 chars per token."""
    return max(1, len(text) // 4)


def _split_into_chunks(text: str) -> list[str]:
    """Split text into chunks of ~CHUNK_TARGET characters, respecting paragraph boundaries."""
    if len(text) <= CHUNK_MAX:
        return [text] if text.strip() else []

    paragraphs = text.split("\n")
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        para_len = len(para) + 1  # +1 for newline

        # If a single paragraph exceeds max, split it by sentences/characters
        if para_len > CHUNK_MAX:
            # Flush current buffer first
            if current:
                chunks.append("\n".join(current))
                current = []
                current_len = 0
            # Split long paragraph into fixed-size pieces
            for i in range(0, len(para), CHUNK_TARGET):
                piece = para[i:i + CHUNK_TARGET]
                if piece.strip():
                    chunks.append(piece)
            continue

        # If adding this paragraph would exceed target, flush
        if current_len + para_len > CHUNK_TARGET and current_len >= CHUNK_MIN:
            chunks.append("\n".join(current))
            current = []
            current_len = 0

        current.append(para)
        current_len += para_len

    # Flush remaining
    if current:
        text_remaining = "\n".join(current)
        if text_remaining.strip():
            chunks.append(text_remaining)

    return chunks


def parse_and_chunk_file(file_id: int) -> dict:
    """Parse a file, split into chunks, and store in database.

    Returns a summary dict with status, chunk count, etc.
    """
    conn = get_connection()
    try:
        # Get file record
        row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
        if not row:
            raise ValueError(f"File not found: id={file_id}")

        file_path = row["file_path"]
        file_name = row["name"]
        ext = "." + file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        if ext not in SUPPORTED_PARSE_EXTENSIONS:
            conn.execute(
                "UPDATE files SET summary_status = 'Skipped', updated_at = ? WHERE id = ?",
                (now, file_id),
            )
            conn.commit()
            return {
                "file_id": file_id,
                "file_name": file_name,
                "status": "skipped",
                "reason": f"Unsupported extension: {ext}",
                "chunks_created": 0,
                "characters_extracted": 0,
                "warnings": [],
            }

        # Parse
        result = parse_file(file_path)

        if not result.text.strip():
            conn.execute(
                "UPDATE files SET summary_status = 'Skipped', updated_at = ? WHERE id = ?",
                (now, file_id),
            )
            conn.commit()
            return {
                "file_id": file_id,
                "file_name": file_name,
                "status": "empty",
                "reason": "No text extracted",
                "chunks_created": 0,
                "characters_extracted": 0,
                "warnings": result.warnings,
            }

        # Chunk
        chunks = _split_into_chunks(result.text)

        # Delete existing chunks and FTS rows for this file, then insert new
        old_ids = [r["id"] for r in conn.execute("SELECT id FROM chunks WHERE file_id = ?", (file_id,)).fetchall()]
        if old_ids:
            placeholders = ",".join("?" for _ in old_ids)
            conn.execute(f"DELETE FROM chunks_fts WHERE rowid IN ({placeholders})", old_ids)
        conn.execute("DELETE FROM chunks WHERE file_id = ?", (file_id,))

        for i, chunk_text in enumerate(chunks):
            cursor = conn.execute(
                """INSERT INTO chunks (file_id, chunk_index, content, token_count, created_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (file_id, i, chunk_text, _estimate_tokens(chunk_text), now),
            )
            conn.execute(
                "INSERT INTO chunks_fts(rowid, content, file_name) VALUES (?, ?, ?)",
                (cursor.lastrowid, chunk_text, file_name),
            )

        # Update file status
        conn.execute(
            "UPDATE files SET summary_status = 'Done', updated_at = ? WHERE id = ?",
            (now, file_id),
        )

        # Enrich alert excerpts — replace generic "File: X (Category)" with first chunk
        if chunks:
            snippet = chunks[0][:300]
            if len(chunks[0]) > 300:
                snippet += "..."
            conn.execute(
                """UPDATE alerts SET excerpt = ?
                   WHERE source_file = ? AND excerpt LIKE 'File: %'""",
                (snippet, file_name),
            )

        conn.commit()

        return {
            "file_id": file_id,
            "file_name": file_name,
            "status": "parsed",
            "chunks_created": len(chunks),
            "characters_extracted": len(result.text),
            "warnings": result.warnings,
        }

    except Exception as e:
        # Record error on file
        try:
            now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute(
                "UPDATE files SET summary_status = 'Skipped', updated_at = ? WHERE id = ?",
                (now, file_id),
            )
            conn.commit()
        except Exception:
            pass
        return {
            "file_id": file_id,
            "file_name": file_name if 'file_name' in dir() else str(file_id),
            "status": "failed",
            "reason": str(e),
            "chunks_created": 0,
            "characters_extracted": 0,
            "warnings": [str(e)],
        }
    finally:
        conn.close()


def parse_all_files(force: bool = False) -> dict:
    """Parse all files in the database. Skip already-parsed and missing unless force=True."""
    conn = get_connection()
    try:
        if force:
            rows = conn.execute(
                "SELECT id FROM files WHERE summary_status != 'Missing'"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id FROM files WHERE summary_status NOT IN ('Done', 'Missing')"
            ).fetchall()
    finally:
        conn.close()

    processed = 0
    parsed = 0
    skipped = 0
    failed = 0
    total_chunks = 0
    errors: list[str] = []

    for row in rows:
        processed += 1
        result = parse_and_chunk_file(row["id"])
        status = result["status"]
        if status == "parsed":
            parsed += 1
            total_chunks += result["chunks_created"]
        elif status in ("skipped", "empty"):
            skipped += 1
        else:
            failed += 1
            errors.append(f"{result.get('file_name', row['id'])}: {result.get('reason', 'unknown')}")

    return {
        "processed": processed,
        "parsed": parsed,
        "skipped": skipped,
        "failed": failed,
        "chunks_created": total_chunks,
        "errors": errors,
    }
