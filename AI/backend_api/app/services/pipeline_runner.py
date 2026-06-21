import threading
import uuid
from pathlib import Path

from app.core.config import settings
from app.pipeline.extraction import run_extraction_phase
from app.pipeline.ocr import run_ocr_phase
from app.pipeline.pdf import pdf_to_images
from app.pipeline.templates import run_template_correction
from app.schemas import JobStatus
from app.services.job_store import job_dir, write_job, write_result


gpu_pipeline_lock = threading.Lock()


def create_job(source_filename: str | None) -> str:
    job_id = uuid.uuid4().hex
    write_job(job_id, status=JobStatus.queued.value, source_filename=source_filename, current_phase="queued")
    return job_id


def run_contract_pipeline(job_id: str, pdf_path: Path) -> None:
    with gpu_pipeline_lock:
        try:
            work_dir = job_dir(job_id)
            images_dir = work_dir / "images"
            ocr_dir = work_dir / "ocr"
            extraction_dir = work_dir / "phase2"

            write_job(job_id, status=JobStatus.running.value, current_phase="upload_preprocessing")
            image_paths = pdf_to_images(pdf_path, images_dir)

            write_job(job_id, current_phase="phase_1_ocr")
            pages = run_ocr_phase(image_paths, ocr_dir)

            write_job(job_id, current_phase="phase_2_structured_extraction")
            extractions = run_extraction_phase(pages, extraction_dir)

            write_job(job_id, current_phase="phase_3_template_correction")
            document = run_template_correction(job_id, extractions, settings.templates_path)

            write_result(job_id, document)
            write_job(job_id, status=JobStatus.completed.value, current_phase="completed", error=None)
        except Exception as exc:
            write_job(job_id, status=JobStatus.failed.value, current_phase="failed", error=str(exc))
            raise
