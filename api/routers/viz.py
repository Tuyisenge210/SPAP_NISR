import re
from fastapi import APIRouter, HTTPException
from api.services.lfs_service import get_viz_dataset

router = APIRouter()

_VALID_DATASET = re.compile(r"^[A-Za-z0-9_\-]+$")


@router.get("/{dataset_name}")
async def read_viz_dataset(dataset_name: str):
    if not _VALID_DATASET.match(dataset_name):
        raise HTTPException(status_code=400, detail="Invalid dataset name")
    try:
        data = get_viz_dataset(dataset_name)
        return {"success": True, "data": data}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))