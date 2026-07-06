from fastapi import APIRouter
from api.services.lfs_service import get_indicators

router = APIRouter()

@router.get("/indicators")
async def read_indicators(year: int | None = None, sex: str | None = None, area: str | None = None):
    data = get_indicators(year=year, sex=sex, area=area)
    return data

@router.get("/indicators/trends")
async def read_indicator_trends():
    data = get_indicators()
    return {"trends": data.get("indicators", [])}
