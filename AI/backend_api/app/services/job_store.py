import json
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.schemas import JobStatus


def job_dir(job_id: str) -> Path:
    return settings.jobs_dir / job_id


def metadata_path(job_id: str) -> Path:
    return job_dir(job_id) / "job.json"


def result_path(job_id: str) -> Path:
    return job_dir(job_id) / "final.json"


def write_job(job_id: str, **data: Any) -> None:
    directory = job_dir(job_id)
    directory.mkdir(parents=True, exist_ok=True)
    current = read_job(job_id) or {"job_id": job_id, "status": JobStatus.queued.value}
    current.update(data)
    metadata_path(job_id).write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")


def read_job(job_id: str) -> dict[str, Any] | None:
    path = metadata_path(job_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def write_result(job_id: str, document: dict[str, Any]) -> None:
    result_path(job_id).write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")


def read_result(job_id: str) -> dict[str, Any] | None:
    path = result_path(job_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))
