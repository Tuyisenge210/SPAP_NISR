from fastapi import APIRouter
from api.services.lfs_service import get_validation_status

router = APIRouter()

@router.get("/validation")
async def read_validation():
    return get_validation_status()
