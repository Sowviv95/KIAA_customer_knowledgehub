"""LLM provider service — OpenAI with environment-based API key."""

import json

from app.core.config import get_openai_api_key, is_openai_configured, DEFAULT_LLM_MODEL
from app.db.database import get_connection
from app.services.prompts import build_grounded_prompt, build_file_summary_prompt
from app.services.search import search_chunks


def get_llm_status() -> dict:
    """Return LLM provider status without exposing the API key."""
    configured = is_openai_configured()
    return {
        "provider": "openai",
        "configured": configured,
        "model": DEFAULT_LLM_MODEL,
        "key_source": "environment",
        "message": (
            "OpenAI provider configured via environment variable."
            if configured
            else "OPENAI_API_KEY is not set. Set it as an environment variable to enable LLM features."
        ),
    }


def is_llm_configured() -> bool:
    """Check whether the LLM provider is ready."""
    return is_openai_configured()


def generate_grounded_answer(
    question: str,
    evidence_items: list[dict],
    model: str | None = None,
    max_tokens: int = 500,
) -> dict:
    """Generate a grounded answer using OpenAI, based only on provided evidence.

    evidence_items: list of {"file_name": str, "snippet": str}

    Returns a dict with answer, model, usage, etc.
    """
    # Guard: no evidence → no API call
    if not evidence_items:
        return {
            "answer": "No supporting evidence was provided, so no answer was generated.",
            "model": model or DEFAULT_LLM_MODEL,
            "evidence_count": 0,
            "grounded": True,
            "usage": None,
            "called_api": False,
        }

    # Guard: no API key
    api_key = get_openai_api_key()
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY is not configured. "
            "Set it as an environment variable before calling LLM endpoints."
        )

    # Lazy import to avoid startup cost when key is not set
    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    use_model = model or DEFAULT_LLM_MODEL
    messages = build_grounded_prompt(question, evidence_items)

    response = client.chat.completions.create(
        model=use_model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.1,
    )

    choice = response.choices[0]
    usage = None
    if response.usage:
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    return {
        "answer": choice.message.content or "",
        "model": response.model,
        "evidence_count": len(evidence_items),
        "grounded": True,
        "usage": usage,
        "called_api": True,
    }


def _try_search(query: str, limit: int) -> list[dict]:
    """Attempt FTS5 search, returning empty list on any error."""
    try:
        return search_chunks(query, limit)
    except Exception:
        return []


def _extract_keywords_for_or(question: str) -> str:
    """Extract content words from a question and join with OR for broader FTS5 recall."""
    from app.services.search import sanitise_fts_query
    sanitized = sanitise_fts_query(question)
    words = sanitized.split()
    # Need at least 2 words for OR to be useful
    if len(words) < 2:
        return ""
    return " OR ".join(words)


def grounded_search_answer(
    question: str,
    search_query: str | None = None,
    limit: int = 5,
    model: str | None = None,
    max_tokens: int = 400,
) -> dict:
    """Search FTS5, then generate a grounded LLM answer from top results.

    Uses multi-strategy FTS5 search for better recall:
    1. Try the search_query (with topic expansion from frontend)
    2. If no results, try the raw question
    3. If still no results, try individual keywords joined with OR

    Returns a structured dict matching GroundedSearchResponse.
    """
    use_model = model or DEFAULT_LLM_MODEL

    # Step 1: Multi-strategy FTS5 search
    results: list[dict] = []

    # Strategy 1: search_query (includes topic expansion terms)
    if search_query:
        results = _try_search(search_query, limit)

    # Strategy 2: raw question (without topic expansion)
    if not results:
        results = _try_search(question, limit)

    # Strategy 3: individual keywords joined with OR (broadest recall)
    if not results:
        or_query = _extract_keywords_for_or(question)
        if or_query:
            results = _try_search(or_query, limit)

    # No evidence after all strategies → safe response, no LLM call
    if not results:
        return {
            "answer": (
                "I could not find supporting evidence in the indexed files.\n\n"
                "Suggestions:\n"
                "- Try different keywords or broader search terms\n"
                "- Scan and parse more files in Settings\n"
                "- Use Evidence Retrieval mode to inspect raw snippets directly"
            ),
            "grounded": False,
            "called_llm": False,
            "model": use_model,
            "evidence_count": 0,
            "sources": [],
            "usage": None,
        }

    # Step 2: Build evidence items for prompt (respect token budget)
    MAX_CONTEXT_CHARS = 8000  # conservative context budget (~2000 tokens)
    evidence_items: list[dict] = []
    sources: list[dict] = []
    char_count = 0

    for r in results:
        snippet_text = r["snippet"].replace("<mark>", "").replace("</mark>", "")
        if char_count + len(snippet_text) > MAX_CONTEXT_CHARS:
            break
        evidence_items.append({
            "file_name": r["file_name"],
            "snippet": snippet_text,
        })
        sources.append({
            "file_id": r["file_id"],
            "file_name": r["file_name"],
            "chunk_id": r["chunk_id"],
            "chunk_index": r["chunk_index"],
            "snippet": r["snippet"],  # keep <mark> tags for frontend
            "file_type": r.get("file_type", ""),
            "category": r.get("category", ""),
            "customer_relevance": r.get("customer_relevance", ""),
            "token_estimate": r.get("token_estimate", 0),
        })
        char_count += len(snippet_text)

    # Step 3: Call LLM
    api_key = get_openai_api_key()
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY is not configured. "
            "Set it as an environment variable before calling LLM endpoints."
        )

    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    messages = build_grounded_prompt(question, evidence_items)

    response = client.chat.completions.create(
        model=use_model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.1,
    )

    choice = response.choices[0]
    usage = None
    if response.usage:
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    return {
        "answer": choice.message.content or "",
        "grounded": True,
        "called_llm": True,
        "model": response.model,
        "evidence_count": len(evidence_items),
        "sources": sources,
        "usage": usage,
    }


def generate_file_summary(
    file_id: int,
    model: str | None = None,
    max_tokens: int = 500,
) -> dict:
    """Generate an LLM-grounded summary for a single file using its parsed chunks.

    Reads chunks from the database — no file upload needed.
    """
    use_model = model or DEFAULT_LLM_MODEL

    # Fetch file metadata
    conn = get_connection()
    try:
        file_row = conn.execute(
            "SELECT id, name, file_type, category FROM files WHERE id = ?",
            (file_id,),
        ).fetchone()
        if not file_row:
            raise ValueError(f"File with id {file_id} not found.")

        file_name = file_row["name"]
        file_type = file_row["file_type"]
        category = file_row["category"]

        # Fetch parsed chunks (limit to keep within token budget)
        chunk_rows = conn.execute(
            "SELECT content FROM chunks WHERE file_id = ? ORDER BY chunk_index LIMIT 10",
            (file_id,),
        ).fetchall()
    finally:
        conn.close()

    if not chunk_rows:
        return {
            "file_id": file_id,
            "file_name": file_name,
            "summary": "This file has not been parsed yet. No content available for summarisation.",
            "key_points": [],
            "topics": [],
            "model": use_model,
            "evidence_count": 0,
            "called_llm": False,
            "usage": None,
        }

    # Trim chunks to stay within context budget (~8k chars ≈ 2k tokens)
    MAX_CONTEXT_CHARS = 8000
    chunks: list[str] = []
    char_count = 0
    for row in chunk_rows:
        text = row["content"]
        if char_count + len(text) > MAX_CONTEXT_CHARS:
            # Include a truncated portion of this chunk if we have room
            remaining = MAX_CONTEXT_CHARS - char_count
            if remaining > 200:
                chunks.append(text[:remaining] + "...")
            break
        chunks.append(text)
        char_count += len(text)

    # Guard: no API key
    api_key = get_openai_api_key()
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY is not configured. "
            "Set it as an environment variable before calling LLM endpoints."
        )

    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    messages = build_file_summary_prompt(file_name, file_type, category, chunks)

    response = client.chat.completions.create(
        model=use_model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.1,
    )

    choice = response.choices[0]
    raw_content = choice.message.content or ""

    # Parse JSON response from LLM
    try:
        # Strip markdown fences if present
        cleaned = raw_content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        summary = parsed.get("summary", raw_content)
        key_points = parsed.get("key_points", [])
        topics = parsed.get("topics", [])
    except (json.JSONDecodeError, AttributeError):
        # Fallback: use raw LLM text as summary
        summary = raw_content
        key_points = []
        topics = []

    usage = None
    if response.usage:
        usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    return {
        "file_id": file_id,
        "file_name": file_name,
        "summary": summary,
        "key_points": key_points if isinstance(key_points, list) else [],
        "topics": topics if isinstance(topics, list) else [],
        "model": response.model,
        "evidence_count": len(chunks),
        "called_llm": True,
        "usage": usage,
    }
