from fastapi import APIRouter
from api.services.lfs_service import get_tables, get_publication_tables

router = APIRouter()

@router.get("/standard")
async def read_standard_tables(year: int | None = None):
    data = get_tables(year=year)
    return data

@router.get("/publication")
async def read_publication_tables(year: int | None = None):
    data = get_publication_tables(year=year)
    return data
