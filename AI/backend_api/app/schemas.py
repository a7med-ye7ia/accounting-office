from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus


class JobDetail(BaseModel):
    job_id: str
    status: JobStatus
    current_phase: str | None = None
    error: str | None = None
    result: dict[str, Any] | None = None


class ArticleSelection(BaseModel):
    article_id: str = Field(..., min_length=1)
    chosen_field: Literal["value", "value_ocr"]


class ReviewSelectionsRequest(BaseModel):
    selections: list[ArticleSelection]


class ReviewSelectionsResponse(BaseModel):
    job_id: str
    document_id: int
    document: dict[str, Any]
