from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from api.services.lfs_service import process_uploaded_file

router = APIRouter()


class UploadPayload(BaseModel):
    filename: str = Field(..., min_length=1, description="Dataset filename with supported extension")
    records: list = Field(..., min_length=1, description="Dataset records as a list of objects")


@router.post("/dataset")
async def upload_dataset(payload: UploadPayload):
    try:
        if not payload.records:
            raise HTTPException(status_code=400, detail="No records provided")
        result = process_uploaded_file(payload.filename, payload.records)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))