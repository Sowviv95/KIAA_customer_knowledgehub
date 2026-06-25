"""Search endpoint — full-text search over parsed chunks."""

from fastapi import APIRouter, HTTPException

from app.models.search import SearchResponse
from app.services.search import search_chunks

router = APIRouter()


@router.get("", response_model=SearchResponse)
def search(q: str = "", limit: int = 20):
    """Search parsed file chunks using FTS5."""
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required.")

    try:
        results = search_chunks(q.strip(), limit=min(limit, 100))
    except Exception as e:
        # FTS5 syntax errors (e.g. unmatched quotes) return a clear message
        raise HTTPException(status_code=400, detail=f"Search error: {e}")

    return SearchResponse(query=q.strip(), count=len(results), results=results)
