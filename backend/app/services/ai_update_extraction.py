"""AI-powered candidate update extraction from parsed evidence chunks."""

import json
import logging
from datetime import datetime, timezone

from app.core.config import get_openai_api_key, is_openai_configured, DEFAULT_LLM_MODEL
from app.db.database import get_connection
from app.models.ai_candidates import VALID_UPDATE_TYPES
from app.services.change_log import record_change_event

log = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """\
You are a structured-data extraction assistant for the Customer Knowledge Hub.
Your job is to identify candidate customer updates from the provided evidence chunks.

Rules:
- Use ONLY the provided evidence chunks. Do NOT use outside knowledge.
- Return ONLY customer update candidates found in the chunks.
- Every candidate MUST include: update_type, title, description, topic, source_chunk_id, source_file, evidence_quote, confidence.
- evidence_quote MUST be copied verbatim from the provided chunk text. Do not paraphrase.
- If nothing grounded is found, return an empty candidates array.
- Return strict JSON only. No markdown, no commentary.

Valid update_type values: requirement, decision, open_question, action_item, scope_change, risk, clarification

Return JSON in this exact format:
{
  "candidates": [
    {
      "update_type": "requirement",
      "title": "Short descriptive title",
      "description": "Detailed description of the update",
      "topic": "Relevant tracked topic or null",
      "source_chunk_id": 123,
      "source_file": "filename.docx",
      "evidence_quote": "Exact quote from chunk text",
      "confidence": 0.85
    }
  ]
}
"""


def is_extraction_available() -> dict:
    """Check whether AI candidate extraction is available."""
    configured = is_openai_configured()
    return {
        "available": configured,
        "message": (
            "AI candidate extraction is available."
            if configured
            else "AI candidate extraction is unavailable because the backend LLM key is not configured. "
                 "Existing evidence retrieval and manual workflows are still available."
        ),
    }


def _fetch_chunks(topic: str | None, file_id: int | None, limit: int) -> list[dict]:
    """Fetch parsed chunks from the database, optionally filtered."""
    conn = get_connection()
    try:
        if file_id is not None:
            rows = conn.execute(
                """
                SELECT c.id, c.file_id, c.chunk_index, c.content, c.token_count,
                       f.name AS file_name
                FROM chunks c
                JOIN files f ON c.file_id = f.id
                WHERE c.file_id = ?
                ORDER BY c.chunk_index
                LIMIT ?
                """,
                (file_id, limit),
            ).fetchall()
        elif topic:
            rows = conn.execute(
                """
                SELECT c.id, c.file_id, c.chunk_index, c.content, c.token_count,
                       f.name AS file_name
                FROM chunks c
                JOIN files f ON c.file_id = f.id
                WHERE f.category LIKE ? OR f.customer_relevance LIKE ? OR f.name LIKE ?
                ORDER BY c.id DESC
                LIMIT ?
                """,
                (f"%{topic}%", f"%{topic}%", f"%{topic}%", limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT c.id, c.file_id, c.chunk_index, c.content, c.token_count,
                       f.name AS file_name
                FROM chunks c
                JOIN files f ON c.file_id = f.id
                ORDER BY c.id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def _build_user_prompt(chunks: list[dict]) -> str:
    """Build the user message with numbered evidence chunks."""
    parts = ["Here are the parsed evidence chunks:\n"]
    for ch in chunks:
        parts.append(
            f"--- Chunk ID: {ch['id']} | File: {ch['file_name']} ---\n"
            f"{ch['content']}\n"
        )
    parts.append(
        "\nExtract all customer update candidates from these chunks. "
        "Return strict JSON only."
    )
    return "\n".join(parts)


def _validate_candidate(raw: dict, chunk_lookup: dict[int, dict]) -> dict | None:
    """Validate and clean a single candidate. Returns None if invalid."""
    update_type = raw.get("update_type", "")
    if update_type not in VALID_UPDATE_TYPES:
        return None

    evidence_quote = (raw.get("evidence_quote") or "").strip()
    if not evidence_quote:
        return None

    source_file = (raw.get("source_file") or "").strip()
    if not source_file:
        return None

    source_chunk_id = raw.get("source_chunk_id")

    # Try to tie back to a provided chunk
    if source_chunk_id and source_chunk_id in chunk_lookup:
        chunk = chunk_lookup[source_chunk_id]
        source_file = chunk["file_name"]
    elif source_chunk_id and source_chunk_id not in chunk_lookup:
        # Try to find by file name match
        matched = None
        for cid, ch in chunk_lookup.items():
            if ch["file_name"] == source_file:
                matched = cid
                break
        if matched:
            source_chunk_id = matched
        else:
            return None  # Cannot tie to a provided chunk

    title = (raw.get("title") or "").strip()
    if not title:
        return None

    confidence = raw.get("confidence")
    if confidence is not None:
        try:
            confidence = float(confidence)
            confidence = max(0.0, min(1.0, confidence))
        except (TypeError, ValueError):
            confidence = None

    return {
        "update_type": update_type,
        "title": title,
        "description": (raw.get("description") or "").strip() or None,
        "topic": (raw.get("topic") or "").strip() or None,
        "source_file": source_file,
        "source_chunk_id": source_chunk_id,
        "evidence_quote": evidence_quote,
        "confidence": confidence,
    }


def extract_candidates(
    topic: str | None = None,
    file_id: int | None = None,
    limit_chunks: int = 25,
) -> dict:
    """Extract AI candidate updates from parsed chunks.

    Returns dict with count_created, count_skipped, candidates, error.
    """
    # Guard: LLM not configured
    if not is_openai_configured():
        return {
            "count_created": 0,
            "count_skipped": 0,
            "candidates": [],
            "error": "AI candidate extraction is unavailable because the backend LLM key is not configured.",
        }

    # Fetch chunks
    chunks = _fetch_chunks(topic, file_id, limit_chunks)
    if not chunks:
        return {
            "count_created": 0,
            "count_skipped": 0,
            "candidates": [],
            "error": None,
        }

    chunk_lookup = {ch["id"]: ch for ch in chunks}

    # Build prompt
    user_prompt = _build_user_prompt(chunks)

    # Call LLM
    api_key = get_openai_api_key()
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model=DEFAULT_LLM_MODEL,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2000,
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        raw_json = response.choices[0].message.content or "{}"
    except Exception as exc:
        log.error("LLM extraction call failed: %s", exc)
        return {
            "count_created": 0,
            "count_skipped": 0,
            "candidates": [],
            "error": f"LLM call failed: {exc}",
        }

    # Parse JSON
    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        log.error("Failed to parse LLM JSON: %s", exc)
        return {
            "count_created": 0,
            "count_skipped": 0,
            "candidates": [],
            "error": f"Failed to parse model output as JSON: {exc}",
        }

    raw_candidates = parsed.get("candidates", [])
    if not isinstance(raw_candidates, list):
        raw_candidates = []

    # Validate and store
    created = []
    skipped = 0
    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        for raw_cand in raw_candidates:
            validated = _validate_candidate(raw_cand, chunk_lookup)
            if validated is None:
                skipped += 1
                continue

            cursor = conn.execute(
                """
                INSERT INTO ai_update_candidates
                    (update_type, title, description, topic, source_file,
                     source_chunk_id, evidence_quote, confidence, status,
                     created_at, raw_model_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'candidate', ?, ?)
                """,
                (
                    validated["update_type"],
                    validated["title"],
                    validated["description"],
                    validated["topic"],
                    validated["source_file"],
                    validated["source_chunk_id"],
                    validated["evidence_quote"],
                    validated["confidence"],
                    now,
                    raw_json,
                ),
            )
            created.append({
                "id": cursor.lastrowid,
                **validated,
                "status": "candidate",
                "created_at": now,
                "reviewed_at": None,
                "reviewer_action": None,
            })
        conn.commit()
    finally:
        conn.close()

    # Record change log events for extracted candidates
    for c in created:
        try:
            record_change_event(
                event_type="candidate_extracted",
                title=c["title"],
                description=c.get("description"),
                topic=c.get("topic"),
                source_file=c.get("source_file"),
                source_excerpt=(c.get("evidence_quote") or "")[:300],
                related_type="ai_candidate",
                related_id=c["id"],
            )
        except Exception:
            pass  # non-critical

    return {
        "count_created": len(created),
        "count_skipped": skipped,
        "candidates": created,
        "error": None,
    }


def _get_candidate_row(conn, candidate_id: int) -> dict | None:
    """Fetch a single candidate row as dict."""
    row = conn.execute(
        """
        SELECT id, update_type, title, description, topic, source_file,
               source_chunk_id, evidence_quote, confidence, status,
               created_at, reviewed_at, reviewer_action,
               converted_to_type, converted_to_id, converted_at
        FROM ai_update_candidates WHERE id = ?
        """,
        (candidate_id,),
    ).fetchone()
    return dict(row) if row else None


_CANDIDATE_SELECT_COLS = """id, update_type, title, description, topic, source_file,
               source_chunk_id, evidence_quote, confidence, status,
               created_at, reviewed_at, reviewer_action,
               converted_to_type, converted_to_id, converted_at"""


def _build_record_text(title: str, description: str | None) -> str:
    """Build requirement/action text from title and optional description."""
    if description and description.strip() and description.strip() != title.strip():
        return f"{title}\n\n{description.strip()}"
    return title


def _infer_source_type(conn, source_file: str) -> str:
    """Infer source_type from file metadata if available, else 'Document'."""
    row = conn.execute(
        "SELECT category, customer_relevance FROM files WHERE name = ? LIMIT 1",
        (source_file,),
    ).fetchone()
    if not row:
        return "Document"
    category = (row["category"] or "").lower()
    relevance = (row["customer_relevance"] or "").lower()
    if "meeting" in category or "meeting" in relevance:
        return "Meeting"
    if "email" in category or "email" in relevance:
        return "Email"
    if "deck" in category or "deck" in relevance:
        return "Deck"
    if "schema" in category or "schema" in relevance:
        return "Schema"
    if "source list" in category or "source list" in relevance:
        return "Source List"
    return "Document"


def convert_to_requirement(
    candidate_id: int,
    title: str | None = None,
    description: str | None = None,
    topic: str | None = None,
) -> dict:
    """Convert an accepted candidate to a requirement record.

    Returns dict with candidate, converted_to_type, converted_to_id, or error.
    """
    conn = get_connection()
    try:
        cand = _get_candidate_row(conn, candidate_id)
        if not cand:
            return {"error": "Candidate not found", "status_code": 404}
        if cand["status"] != "accepted":
            return {"error": "Only accepted candidates can be converted", "status_code": 400}
        if cand["converted_to_type"]:
            return {"error": "Candidate has already been converted", "status_code": 400}

        use_title = title or cand["title"]
        use_desc = description if description is not None else cand["description"]
        req_text = _build_record_text(use_title, use_desc)
        req_topic = topic if topic is not None else cand["topic"]
        req_excerpt = cand["evidence_quote"]
        req_source_file = cand["source_file"]
        req_source_type = _infer_source_type(conn, req_source_file)

        cursor = conn.execute(
            "INSERT INTO requirements (text, status, topic, source_type, source_file, excerpt) "
            "VALUES (?, 'Open', ?, ?, ?, ?)",
            (req_text, req_topic, req_source_type, req_source_file, req_excerpt),
        )
        req_id = cursor.lastrowid

        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        conn.execute(
            "UPDATE ai_update_candidates SET converted_to_type = 'requirement', converted_to_id = ?, converted_at = ? WHERE id = ?",
            (req_id, now, candidate_id),
        )
        conn.commit()

        cand = _get_candidate_row(conn, candidate_id)
    finally:
        conn.close()

    try:
        record_change_event(
            event_type="candidate_converted_to_requirement",
            title=use_title,
            description=use_desc,
            topic=req_topic,
            source_file=req_source_file,
            source_excerpt=(req_excerpt or "")[:300],
            related_type="requirement",
            related_id=req_id,
        )
    except Exception:
        pass

    return {
        "candidate": cand,
        "converted_to_type": "requirement",
        "converted_to_id": req_id,
    }


def convert_to_action(
    candidate_id: int,
    title: str | None = None,
    description: str | None = None,
    topic: str | None = None,
    priority: str = "Medium",
    owner: str | None = None,
    due_date: str | None = None,
) -> dict:
    """Convert an accepted candidate to an action/follow-up record.

    Returns dict with candidate, converted_to_type, converted_to_id, or error.
    """
    conn = get_connection()
    try:
        cand = _get_candidate_row(conn, candidate_id)
        if not cand:
            return {"error": "Candidate not found", "status_code": 404}
        if cand["status"] != "accepted":
            return {"error": "Only accepted candidates can be converted", "status_code": 400}
        if cand["converted_to_type"]:
            return {"error": "Candidate has already been converted", "status_code": 400}

        use_title = title or cand["title"]
        use_desc = description if description is not None else cand["description"]
        action_text = _build_record_text(use_title, use_desc)
        action_excerpt = cand["evidence_quote"]
        action_source_file = cand["source_file"]
        if priority not in ("High", "Medium", "Low"):
            priority = "Medium"

        cursor = conn.execute(
            "INSERT INTO actions (text, owner, due_date, priority, status, source_file, excerpt) "
            "VALUES (?, ?, ?, ?, 'Open', ?, ?)",
            (action_text, owner, due_date, priority, action_source_file, action_excerpt),
        )
        action_id = cursor.lastrowid

        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        conn.execute(
            "UPDATE ai_update_candidates SET converted_to_type = 'action', converted_to_id = ?, converted_at = ? WHERE id = ?",
            (action_id, now, candidate_id),
        )
        conn.commit()

        cand = _get_candidate_row(conn, candidate_id)
    finally:
        conn.close()

    try:
        record_change_event(
            event_type="candidate_converted_to_action",
            title=use_title,
            description=use_desc,
            topic=cand.get("topic") if cand else None,
            source_file=action_source_file,
            source_excerpt=(action_excerpt or "")[:300],
            related_type="action",
            related_id=action_id,
        )
    except Exception:
        pass

    return {
        "candidate": cand,
        "converted_to_type": "action",
        "converted_to_id": action_id,
    }


def list_candidates(
    status: str | None = None,
    update_type: str | None = None,
    topic: str | None = None,
    source_file: str | None = None,
) -> list[dict]:
    """List AI candidates with optional filters."""
    conn = get_connection()
    try:
        conditions = []
        params: list = []

        if status:
            conditions.append("status = ?")
            params.append(status)

        if update_type:
            conditions.append("update_type = ?")
            params.append(update_type)

        if topic:
            conditions.append("topic LIKE ?")
            params.append(f"%{topic}%")

        if source_file:
            conditions.append("source_file LIKE ?")
            params.append(f"%{source_file}%")

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        rows = conn.execute(
            f"""
            SELECT id, update_type, title, description, topic, source_file,
                   source_chunk_id, evidence_quote, confidence, status,
                   created_at, reviewed_at, reviewer_action,
                   converted_to_type, converted_to_id, converted_at
            FROM ai_update_candidates
            {where}
            ORDER BY
                CASE status WHEN 'candidate' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END,
                created_at DESC
            """,
            params,
        ).fetchall()

        return [dict(r) for r in rows]
    finally:
        conn.close()


def review_candidate(candidate_id: int, status: str, reviewer_action: str | None = None) -> dict | None:
    """Update review status of a candidate. Does NOT create actions/requirements."""
    if status not in ("candidate", "accepted", "rejected"):
        return None

    conn = get_connection()
    try:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        reviewed_at = now if status != "candidate" else None

        conn.execute(
            """
            UPDATE ai_update_candidates
            SET status = ?, reviewed_at = ?, reviewer_action = ?
            WHERE id = ?
            """,
            (status, reviewed_at, reviewer_action, candidate_id),
        )
        conn.commit()

        row = conn.execute(
            """
            SELECT id, update_type, title, description, topic, source_file,
                   source_chunk_id, evidence_quote, confidence, status,
                   created_at, reviewed_at, reviewer_action,
                   converted_to_type, converted_to_id, converted_at
            FROM ai_update_candidates WHERE id = ?
            """,
            (candidate_id,),
        ).fetchone()

        if not row:
            return None
        result = dict(row)
    finally:
        conn.close()

    # Record change log event
    event_map = {"accepted": "candidate_accepted", "rejected": "candidate_rejected", "candidate": "candidate_reset"}
    try:
        record_change_event(
            event_type=event_map.get(status, f"candidate_{status}"),
            title=result["title"],
            description=result.get("description"),
            topic=result.get("topic"),
            source_file=result.get("source_file"),
            source_excerpt=(result.get("evidence_quote") or "")[:300],
            related_type="ai_candidate",
            related_id=candidate_id,
        )
    except Exception:
        pass  # non-critical

    return result
