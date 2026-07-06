from fastapi import APIRouter
from api.services.lfs_service import get_metadata

router = APIRouter()

@router.get("/metadata")
async def read_metadata():
    return get_metadata()
