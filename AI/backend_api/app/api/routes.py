from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from app.schemas import JobDetail, JobResponse, JobStatus, ReviewSelectionsRequest, ReviewSelectionsResponse
from app.services.job_store import job_dir, read_job, read_result, write_result
from app.services.pipeline_runner import create_job, run_contract_pipeline
from app.services.review import MissingReviewSelectionsError, apply_review_selections
from app.storage.database import save_processed_contract


router = APIRouter()


@router.post("/contracts/process", response_model=JobResponse, status_code=202)
async def process_contract(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> JobResponse:
    if file.content_type not in {"application/pdf", "application/octet-stream"} and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    job_id = create_job(file.filename)
    directory = job_dir(job_id)
    directory.mkdir(parents=True, exist_ok=True)
    pdf_path = directory / "source.pdf"
    pdf_path.write_bytes(await file.read())

    background_tasks.add_task(run_contract_pipeline, job_id, pdf_path)
    return JobResponse(job_id=job_id, status=JobStatus.queued)


@router.get("/jobs/{job_id}", response_model=JobDetail)
def get_job(job_id: str) -> JobDetail:
    metadata = read_job(job_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    result = read_result(job_id) if metadata.get("status") == JobStatus.completed.value else None
    return JobDetail(
        job_id=job_id,
        status=JobStatus(metadata["status"]),
        current_phase=metadata.get("current_phase"),
        error=metadata.get("error"),
        result=result,
    )


@router.post("/contracts/{job_id}/review-selections", response_model=ReviewSelectionsResponse)
def submit_review_selections(job_id: str, payload: ReviewSelectionsRequest) -> ReviewSelectionsResponse:
    metadata = read_job(job_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    if metadata.get("status") != JobStatus.completed.value:
        raise HTTPException(status_code=409, detail="Contract processing is not complete yet.")

    document = read_result(job_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Processed JSON was not found.")

    try:
        updated_document = apply_review_selections(document, payload.selections)
    except MissingReviewSelectionsError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Selections are required for all flagged articles.",
                "missing_article_ids": exc.missing_article_ids,
            },
        ) from exc
    write_result(job_id, updated_document)
    document_id = save_processed_contract(
        job_id=job_id,
        source_filename=metadata.get("source_filename"),
        document=updated_document,
    )

    return ReviewSelectionsResponse(job_id=job_id, document_id=document_id, document=updated_document)
