from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from api.services.lfs_service import get_ingestion_job, ingest_uploaded_dataset, list_ingestion_jobs, process_uploaded_file

router = APIRouter()


@router.post("/dataset")
async def upload_dataset(
    request: Request,
    file: UploadFile | None = File(default=None),
    run_pipeline: bool = Form(default=True),
):
    """Accept multipart .dta/.csv/.xlsx uploads, or legacy JSON {filename, records}."""
    try:
        content_type = request.headers.get("content-type", "")
        if file is not None or "multipart/form-data" in content_type:
            if file is None:
                raise HTTPException(status_code=400, detail="Multipart upload must include a file field named 'file'.")
            content = await file.read()
            result = ingest_uploaded_dataset(content, file.filename or "upload", run_pipeline=run_pipeline)
            status_code = 200 if result.get("success") else 400
            return JSONResponse(status_code=status_code, content={"success": result.get("success", False), "data": result.get("data"), "error": result.get("error")})

        payload = await request.json()
        filename = payload.get("filename")
        records = payload.get("records")
        if not filename or not isinstance(records, list) or not records:
            raise HTTPException(status_code=400, detail="Legacy JSON upload requires filename and non-empty records.")
        result = process_uploaded_file(str(filename), records)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/ingestion-jobs")
async def ingestion_jobs():
    return list_ingestion_jobs()


@router.get("/ingestion-jobs/{job_id}")
async def ingestion_job(job_id: str):
    result = get_ingestion_job(job_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Ingestion job not found"))
    return result