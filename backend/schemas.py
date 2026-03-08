from pydantic import BaseModel, Field
from datetime import datetime, date
from enum import Enum


class PortalStatus(str, Enum):
    IDLE = "idle"
    CONNECTING = "connecting"
    NAVIGATING = "navigating"
    EXTRACTING = "extracting"
    COMPLETE = "complete"
    ERROR = "error"


class SearchRequest(BaseModel):
    keywords: str = Field(..., min_length=1, max_length=500)
    naics_code: str | None = None
    states: list[str] = Field(..., min_length=1)


class BidResult(BaseModel):
    id: str
    source_portal: str
    source_state: str
    title: str
    solicitation_number: str | None = None
    agency: str | None = None
    posted_date: str | None = None
    deadline: str | None = None
    days_remaining: int | None = None
    estimated_value: str | None = None
    set_aside: str | None = None
    category: str | None = None
    description: str | None = None
    source_url: str | None = None
    match_score: float = 0.0
    match_reasons: list[str] = Field(default_factory=list)


class PortalEvent(BaseModel):
    """SSE event sent to frontend."""
    portal: str
    state: str
    status: PortalStatus
    message: str | None = None
    results: list[BidResult] = Field(default_factory=list)
    elapsed_seconds: float = 0.0
