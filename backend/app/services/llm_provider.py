"""LLM provider service — OpenAI with environment-based API key."""

from app.core.config import get_openai_api_key, is_openai_configured, DEFAULT_LLM_MODEL
from app.services.prompts import build_grounded_prompt
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


def grounded_search_answer(
    question: str,
    search_query: str | None = None,
    limit: int = 5,
    model: str | None = None,
    max_tokens: int = 400,
) -> dict:
    """Search FTS5, then generate a grounded LLM answer from top results.

    Returns a structured dict matching GroundedSearchResponse.
    """
    use_model = model or DEFAULT_LLM_MODEL
    query = search_query or question

    # Step 1: FTS5 search
    try:
        results = search_chunks(query, limit)
    except Exception:
        results = []

    # No evidence → safe response, no LLM call
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
