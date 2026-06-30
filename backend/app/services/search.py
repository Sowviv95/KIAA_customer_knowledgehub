"""Full-text search over parsed chunks using SQLite FTS5."""

import re

from app.db.database import get_connection


def sanitise_fts_query(query: str) -> str:
    """Sanitise a user query for safe FTS5 MATCH usage.

    - Strips FTS5 operators and special characters that cause syntax errors.
    - Keeps alphanumeric words, hyphens within words, and spaces.
    - Preserves FTS5 OR operator when used intentionally (e.g. scoped search).
    - Returns empty string if nothing useful remains.
    """
    # Remove FTS5 column filters like "content:" or "file_name:"
    q = re.sub(r'\b\w+\s*:', ' ', query)
    # Keep only word characters, whitespace, and hyphens
    q = re.sub(r'[^\w\s-]', ' ', q)
    # Remove standalone hyphens (FTS5 NOT operator) but keep hyphenated words
    q = re.sub(r'(?<!\w)-|-(?!\w)', ' ', q)
    # Collapse whitespace
    q = re.sub(r'\s+', ' ', q).strip()
    # Remove FTS5 reserved words if they appear as the entire (single-word) query
    if q.upper() in ('AND', 'OR', 'NOT', 'NEAR'):
        return ''
    return q


def search_chunks(query: str, limit: int = 20) -> list[dict]:
    """Search chunks_fts and return results joined with file metadata."""
    safe_query = sanitise_fts_query(query)
    if not safe_query:
        return []

    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT
                c.id AS chunk_id,
                c.file_id,
                c.chunk_index,
                c.token_count,
                snippet(chunks_fts, 0, '<mark>', '</mark>', '...', 40) AS snippet,
                f.name AS file_name,
                f.file_type,
                f.category,
                f.customer_relevance,
                f.updated_at
            FROM chunks_fts
            JOIN chunks c ON c.id = chunks_fts.rowid
            JOIN files f ON f.id = c.file_id
            WHERE chunks_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (safe_query, limit),
        ).fetchall()

        results = []
        for row in rows:
            results.append({
                "chunk_id": row["chunk_id"],
                "file_id": row["file_id"],
                "file_name": row["file_name"],
                "chunk_index": row["chunk_index"],
                "snippet": row["snippet"],
                "file_type": row["file_type"],
                "category": row["category"],
                "customer_relevance": row["customer_relevance"],
                "token_estimate": row["token_count"] or 0,
                "updated_at": row["updated_at"],
            })
        return results

    finally:
        conn.close()
