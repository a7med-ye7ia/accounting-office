# Legal Contract AI Backend

FastAPI service for the three-phase contract pipeline:

1. Upload a PDF and convert pages to images.
2. Run Chandra OCR, then fully unload the OCR model from RAM/VRAM.
3. Run Qwen structured extraction in 4-bit, then fully unload the Qwen model from RAM/VRAM.
4. Apply template correction and return JSON for frontend review.
5. Accept final article selections, remove the unselected text field, clear review flags, and save the final document.

## Run

```powershell
cd E:\accounting-office\AI\backend_api
copy .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8090
```

The service uses a single process-wide GPU lock so only one contract job loads models at a time.

## Endpoints

- `POST /api/v1/contracts/process` uploads a PDF and starts a processing job.
- `GET /api/v1/jobs/{job_id}` returns job status and final JSON when ready.
- `POST /api/v1/contracts/{job_id}/review-selections` receives frontend selections and saves the cleaned document.
- `GET /health` returns service health.

Review selections look like:

```json
{
  "selections": [
    {"article_id": "المادة (٣)", "chosen_field": "value_ocr"}
  ]
}
```

`chosen_field` must be either `value` or `value_ocr`.
