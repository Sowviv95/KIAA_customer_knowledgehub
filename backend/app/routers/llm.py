"""LLM endpoints — status, grounded answer test, and production grounded answer."""

from fastapi import APIRouter, HTTPException

from app.models.llm import (
    LLMStatusResponse,
    GroundedAnswerRequest,
    GroundedAnswerResponse,
    GroundedSearchRequest,
    GroundedSearchResponse,
)
from app.services.llm_provider import (
    get_llm_status,
    generate_grounded_answer,
    grounded_search_answer,
)

router = APIRouter()


@router.get("/status", response_model=LLMStatusResponse)
def llm_status():
    """Return LLM provider configuration status. Never returns the API key."""
    return get_llm_status()


@router.post("/grounded-answer-test", response_model=GroundedAnswerResponse)
def grounded_answer_test(req: GroundedAnswerRequest):
    """Backend-only test endpoint for grounded LLM answers.

    Requires evidence_items. Uses OPENAI_API_KEY from environment.
    Do not connect the frontend to this endpoint yet.
    """
    evidence = [item.model_dump() for item in req.evidence_items]

    try:
        result = generate_grounded_answer(
            question=req.question,
            evidence_items=evidence,
            model=req.model,
            max_tokens=req.max_tokens,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {e}")

    return result


@router.post("/grounded-answer", response_model=GroundedSearchResponse)
def grounded_answer(req: GroundedSearchRequest):
    """Production grounded answer: search FTS5 + call LLM with top evidence.

    Flow:
    1. Run FTS5 search using search_query (or question as fallback).
    2. If no evidence found, return safe response without calling LLM.
    3. If evidence found, send top snippets to LLM and return grounded answer.

    Test examples:
    - "What does the customer say about 30-minute SLA?" (search_query: "SLA 30-minute latency")
    - "What has the customer confirmed about API delivery?" (search_query: "API delivery")
    - "Which files mention source list changes?" (search_query: "source list changes")
    - "What does the evidence say about blockchain?" — likely no-evidence case
    """
    try:
        result = grounded_search_answer(
            question=req.question,
            search_query=req.search_query,
            limit=req.limit,
            model=req.model,
            max_tokens=req.max_tokens,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grounded answer failed: {e}")

    return result
