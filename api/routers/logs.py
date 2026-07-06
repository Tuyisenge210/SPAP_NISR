from fastapi import APIRouter
from api.services.lfs_service import get_pipeline_logs

router = APIRouter()

@router.get("/logs")
async def read_logs():
    return get_pipeline_logs()
