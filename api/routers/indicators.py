from fastapi import APIRouter
from api.services.lfs_service import get_dashboard_summary, get_indicators

router = APIRouter()

@router.get("/indicators")
async def read_indicators(year: int | None = None, sex: str | None = None, area: str | None = None):
    data = get_indicators(year=year, sex=sex, area=area)
    return data


@router.get("/indicators/dashboard")
async def read_dashboard_summary(
    year: int | None = None,
    sex: str | None = None,
    area: str | None = None,
    age_group: str | None = None,
    province: str | None = None,
):
    return get_dashboard_summary(
        year=year,
        sex=sex,
        area=area,
        age_group=age_group,
        province=province,
    )

@router.get("/indicators/trends")
async def read_indicator_trends():
    data = get_indicators()
    return {"trends": data.get("indicators", [])}
