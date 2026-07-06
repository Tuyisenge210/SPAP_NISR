from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from api.services.lfs_service import get_excel_report

router = APIRouter()

@router.get("/excel/{report_name}")
async def download_excel_report(report_name: str):
    try:
        path = get_excel_report(report_name)
        if not path or not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Report not found")
        return FileResponse(
            path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=os.path.basename(path),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
