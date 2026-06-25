"""Router for AI candidate update extraction endpoints."""

from fastapi import APIRouter, HTTPException

from app.models.ai_candidates import (
    AIStatusResponse,
    AIExtractionRequest,
    AIExtractionResponse,
    AIUpdateCandidateItem,
    AIUpdateCandidateReviewRequest,
    AIUpdateCandidateListResponse,
    ConvertToRequirementRequest,
    ConvertToActionRequest,
    ConversionResponse,
    VALID_CANDIDATE_STATUSES,
)
from app.services.ai_update_extraction import (
    is_extraction_available,
    extract_candidates,
    list_candidates,
    review_candidate,
    convert_to_requirement,
    convert_to_action,
)

router = APIRouter()


@router.get("/status", response_model=AIStatusResponse)
def get_ai_status():
    """Return whether AI candidate extraction is available."""
    return is_extraction_available()


@router.post("/candidates/extract", response_model=AIExtractionResponse, status_code=201)
def post_extract_candidates(body: AIExtractionRequest):
    """Extract AI candidate updates from parsed evidence chunks."""
    result = extract_candidates(
        topic=body.topic,
        file_id=body.file_id,
        limit_chunks=body.limit_chunks,
    )
    candidates = [AIUpdateCandidateItem(**c) for c in result["candidates"]]
    return AIExtractionResponse(
        count_created=result["count_created"],
        count_skipped=result["count_skipped"],
        candidates=candidates,
        error=result.get("error"),
    )


@router.get("/candidates", response_model=AIUpdateCandidateListResponse)
def get_candidates(
    status: str | None = None,
    update_type: str | None = None,
    topic: str | None = None,
    source_file: str | None = None,
):
    """List AI candidate updates with optional filters."""
    rows = list_candidates(
        status=status,
        update_type=update_type,
        topic=topic,
        source_file=source_file,
    )
    candidates = [AIUpdateCandidateItem(**r) for r in rows]
    return AIUpdateCandidateListResponse(candidates=candidates, total=len(candidates))


@router.patch("/candidates/{candidate_id}/review", response_model=AIUpdateCandidateItem)
def patch_review_candidate(candidate_id: int, body: AIUpdateCandidateReviewRequest):
    """Review (accept/reject) an AI candidate. Does NOT create actions or requirements."""
    if body.status not in VALID_CANDIDATE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{body.status}'. Must be one of: {', '.join(sorted(VALID_CANDIDATE_STATUSES))}",
        )

    result = review_candidate(candidate_id, body.status, body.reviewer_action)
    if result is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return AIUpdateCandidateItem(**result)


@router.post("/candidates/{candidate_id}/convert-to-requirement", response_model=ConversionResponse, status_code=201)
def post_convert_to_requirement(candidate_id: int, body: ConvertToRequirementRequest):
    """Convert an accepted candidate into a requirement. Does not auto-convert on accept."""
    result = convert_to_requirement(
        candidate_id,
        title=body.title,
        description=body.description,
        topic=body.topic,
    )
    if "error" in result:
        raise HTTPException(status_code=result["status_code"], detail=result["error"])

    return ConversionResponse(
        candidate=AIUpdateCandidateItem(**result["candidate"]),
        converted_to_type=result["converted_to_type"],
        converted_to_id=result["converted_to_id"],
    )


@router.post("/candidates/{candidate_id}/convert-to-action", response_model=ConversionResponse, status_code=201)
def post_convert_to_action(candidate_id: int, body: ConvertToActionRequest):
    """Convert an accepted candidate into a follow-up action. Does not auto-convert on accept."""
    result = convert_to_action(
        candidate_id,
        title=body.title,
        description=body.description,
        topic=body.topic,
        priority=body.priority,
        owner=body.owner,
        due_date=body.due_date,
    )
    if "error" in result:
        raise HTTPException(status_code=result["status_code"], detail=result["error"])

    return ConversionResponse(
        candidate=AIUpdateCandidateItem(**result["candidate"]),
        converted_to_type=result["converted_to_type"],
        converted_to_id=result["converted_to_id"],
    )
