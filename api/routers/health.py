from fastapi import APIRouter
import os
from labour_analytics.config import Config

router = APIRouter()

@router.get("/health")
async def health_check():
    final_dir = Config.FOLDERS.get("final", "")
    parquet_exists = os.path.exists(os.path.join(final_dir, "RLFS_Harmonized_2020_2025.parquet"))
    return {
        "status": "ok",
        "parquet_ready": parquet_exists,
        "final_dir": final_dir,
    }
